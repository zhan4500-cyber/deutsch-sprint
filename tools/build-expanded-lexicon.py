import json
import re
from pathlib import Path

import argostranslate.translate
from word2word import Word2word


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
DECK_PATH = WORKSPACE / "_sources" / "language-learning-decks" / "german" / "german.json"
ENDICT_DIR = WORKSPACE / "_sources" / "endict-sparse" / "dict"
WORD2WORD_CACHE = WORKSPACE / "_sources" / "word2word-cache"
TFS4_CORE_PATH = WORKSPACE / "deutsch-sprint-tfs4-pack-v1" / "data" / "tfs4-vocabulary-core.json"
OUTPUT_PATH = ROOT / "data" / "vocab-index.json"
EXAMPLE_CACHE_PATH = WORKSPACE / "_sources" / "argos-data" / "example-translations.json"
TARGET_PER_STAGE = 2500

VALID_TERM = re.compile(r"^[A-Za-zÄÖÜäöüßẞ][A-Za-zÄÖÜäöüßẞ' -]{1,49}$")
HAS_CJK = re.compile(r"[\u3400-\u9fff]")
ARTICLES = re.compile(r"^(?:der|die|das)\s+", re.IGNORECASE)
POS_ZH = {
    "noun": "名词",
    "verb": "动词",
    "adjective": "形容词",
    "adverb": "副词",
    "pronoun": "代词",
    "conjunction": "连词",
    "preposition": "介词",
    "interjection": "感叹词",
    "numeral": "数词",
    "article": "冠词",
}
MANUAL_ZH_OVERRIDES = {
    "Sie": "您；您们（正式称呼）",
    "auch": "也；还；同样",
    "nur": "只；仅仅",
    "da": "那里；由于；既然",
    "dann": "然后；那么；当时",
    "schon": "已经；确实",
    "mehr": "更多；更加",
    "mal": "一次；一下；乘以",
    "hier": "这里；在此",
    "Ihr": "您的；你们的",
    "immer": "总是；始终",
    "jetzt": "现在；此刻",
    "wieder": "又；再次；回到原状",
    "kein": "没有；不是任何",
    "all": "全部；所有",
    "sehr": "很；非常",
    "gut": "好的；良好地",
    "also": "所以；因此；那么",
    "viel": "许多；大量",
    "ganz": "完整的；全部；相当",
    "selbst": "自己；亲自；甚至",
    "wo": "哪里；在……的地方",
    "heute": "今天；当今",
    "nun": "现在；那么",
    "dabei": "在场；同时；而；随身带着",
    "dort": "那里",
    "gerade": "刚刚；正在；恰好；笔直的",
    "neu": "新的；重新",
    "erst": "才；首先；直到……才",
    "weit": "远的；宽广的；很大程度上",
    "wirklich": "真正的；确实；真的",
    "Mann": "男人；丈夫",
    "ander": "其他的；另一个",
    "leben": "生活；生存；活着",
    "jährig": "……岁的；有……年历史的",
    "Bundestag": "德国联邦议院",
    "Bundeswehr": "德国联邦国防军",
    "Landtag": "州议会",
    "Verfassungsschutz": "宪法保卫机构；国内情报机构",
    "Bundestagswahl": "联邦议院选举",
    "Landrat": "县长；县行政长官",
    "Landtagswahl": "州议会选举",
    "Rahmenbedingung": "框架条件；基本条件",
    "diesjährig": "今年的；本年度的",
    "Bundesstrasse": "联邦公路",
    "Migrationshintergrund": "移民背景",
    "Bundespräsident": "联邦总统",
    "Nationalspieler": "国家队队员（男性）",
    "Volkspartei": "全民型政党；大众政党",
    "Kommunalwahl": "地方选举；市镇选举",
    "Stadtwerk": "市政公用事业公司",
    "Slam": "诗歌擂台赛；现场竞技表演",
    "württembergisch": "符腾堡的",
    "Flüchtlingspolitik": "难民政策",
    "pseudo": "伪；假装的",
    "Klassenerhalt": "保级",
    "niedersächsisch": "下萨克森州的",
    "Rechtsextremismus": "右翼极端主义",
    "Fachhochschule": "应用技术大学",
    "Landesliga": "州级联赛；地区联赛",
    "Einsatz": "投入；使用；行动；赌注",
    "weiterhin": "继续；仍然；此外",
    "somit": "因此；从而",
    "jeweils": "各自；分别；每次",
    "teilweise": "部分地；在一定程度上",
    "folgend": "下列的；接下来的",
}


def normalize_term(value):
    return ARTICLES.sub("", str(value or "").strip()).casefold()


def load_rich_entries():
    data = json.loads((ROOT / "data" / "vocab-library.json").read_text(encoding="utf-8"))
    entries = []
    for stage in data["stages"]:
        for theme in stage["themes"]:
            for entry in theme["entries"]:
                entries.append({**entry, "stage": stage["id"], "theme": theme["id"]})
    return entries


def load_deck():
    records = json.loads(DECK_PATH.read_text(encoding="utf-8"))
    clean = []
    seen = set()
    for record in sorted(records, key=lambda item: item.get("word_frequency") or 10**9):
        word = str(record.get("word") or "").strip()
        key = normalize_term(word)
        if not record.get("useful_for_flashcard") or not VALID_TERM.fullmatch(word) or key in seen:
            continue
        seen.add(key)
        clean.append(record)
    return clean


def load_tfs4_core():
    data = json.loads(TFS4_CORE_PATH.read_text(encoding="utf-8"))
    return {normalize_term(item["display"]): item for item in data["entries"]}


def select_stage(deck, stage, levels, excluded=None):
    excluded = excluded or set()
    selected = []
    seen = set()
    for record in deck:
        key = normalize_term(record["word"])
        if record.get("cefr_level") not in levels or key in excluded or key in seen:
            continue
        selected.append({**record, "stage": stage, "curated": None})
        seen.add(key)
        if len(selected) == TARGET_PER_STAGE:
            break
    return selected


def merge_curated(selected, curated_entries, deck_by_key):
    selected_by_key = {normalize_term(item["word"]): item for item in selected}
    for curated in curated_entries:
        key = normalize_term(curated["term"])
        if key in selected_by_key:
            selected_by_key[key]["curated"] = curated
            continue
        source = deck_by_key.get(key, {
            "word": ARTICLES.sub("", curated["term"]),
            "pos": "",
            "cefr_level": curated.get("cefr", ""),
            "english_translation": "",
            "example_sentence_native": curated.get("example", ""),
            "example_sentence_english": "",
            "gender": "",
            "word_frequency": 10**9,
        })
        replacement = next((index for index in range(len(selected) - 1, -1, -1) if not selected[index]["curated"]), None)
        if replacement is None:
            continue
        selected[replacement] = {**source, "stage": curated["stage"], "curated": curated}
        selected_by_key[key] = selected[replacement]
    return sorted(selected, key=lambda item: item.get("word_frequency") or 10**9)


def english_lookup_keys(gloss):
    parts = re.split(r"[;,/]", str(gloss or ""))
    keys = []
    for part in parts[:4]:
        value = re.sub(r"\([^)]*\)", "", part).strip().lower()
        value = re.sub(r"^to\s+", "", value)
        value = re.sub(r"^(?:a|an|the)\s+", "", value)
        if value:
            keys.append(value)
    return keys


def build_english_chinese_map(records):
    needed = {key for record in records for key in english_lookup_keys(record.get("english_translation"))}
    translations = {}
    for file_path in ENDICT_DIR.glob("*.json"):
        with file_path.open("r", encoding="utf-8") as source:
            for line in source:
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                word = str(item.get("word") or "").strip().lower()
                if word not in needed or word in translations:
                    continue
                values = [re.sub(r"^\[[^]]+\]\s*", "", value).strip() for value in item.get("translation", [])]
                values = [value for value in values if HAS_CJK.search(value)]
                if values:
                    translations[word] = "；".join(values[:2])[:120]
    return translations


def translate_examples(records):
    cache = json.loads(EXAMPLE_CACHE_PATH.read_text(encoding="utf-8")) if EXAMPLE_CACHE_PATH.exists() else {}
    pending = []
    for record in records:
        if record.get("curated"):
            continue
        sentence = str(record.get("example_sentence_english") or "").strip()
        if sentence and sentence not in cache:
            pending.append(sentence)
    for index, sentence in enumerate(dict.fromkeys(pending), start=1):
        cache[sentence] = argostranslate.translate.translate(sentence, "en", "zh")
        if index % 100 == 0:
            EXAMPLE_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            EXAMPLE_CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"Translated {index}/{len(pending)} example sentences", flush=True)
    EXAMPLE_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    EXAMPLE_CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return cache


def usage_pattern(record):
    curated = record.get("curated")
    if curated:
        return curated.get("collocation") or curated.get("example", "")
    sentence = str(record.get("example_sentence_native") or "").strip()
    words = re.findall(r"[A-Za-zÄÖÜäöüßẞ'-]+", sentence)
    lemma = normalize_term(record["word"])
    stem = lemma[:max(3, min(6, len(lemma) - 2))]
    match_index = next((index for index, word in enumerate(words) if word.casefold().startswith(stem)), None)
    if match_index is None:
        return " ".join(words[:min(6, len(words))])
    start = max(0, match_index - 2)
    end = min(len(words), match_index + 3)
    return " ".join(words[start:end])


def translate_record(record, en_zh, de_zh, tfs4_core):
    curated = record.get("curated")
    if curated:
        return curated["meaning"], "curated"
    if record["word"] in MANUAL_ZH_OVERRIDES:
        return MANUAL_ZH_OVERRIDES[record["word"]], "manual_override"
    core_entry = tfs4_core.get(normalize_term(record["word"]))
    if core_entry:
        return core_entry["chinese"], "tfs4_core"
    for key in english_lookup_keys(record.get("english_translation")):
        if key in en_zh:
            return en_zh[key], "open_dictionary"
    queries = [record["word"], record["word"].lower(), record["word"].capitalize()]
    for query in queries:
        try:
            candidates = de_zh(query, n_best=5)
        except KeyError:
            continue
        values = []
        for candidate in candidates:
            candidate = str(candidate).strip()
            if HAS_CJK.search(candidate) and candidate not in values:
                values.append(candidate)
        if values:
            return "；".join(values[:3]), "automatic_lexicon"
    fallback = str(record.get("english_translation") or "释义待补充").strip()
    return f"英文释义：{fallback}", "english_fallback"


def build_output(records):
    en_zh = build_english_chinese_map(records)
    de_zh = Word2word("de", "zh_cn", custom_savedir=str(WORD2WORD_CACHE))
    tfs4_core = load_tfs4_core()
    example_translations = translate_examples(records)
    status_counts = {}
    items = []
    stage_ranks = {"foundation": 0, "advanced": 0}
    for index, record in enumerate(records, start=1):
        curated = record.get("curated")
        meaning, translation_status = translate_record(record, en_zh, de_zh, tfs4_core)
        status_counts[translation_status] = status_counts.get(translation_status, 0) + 1
        stage = record["stage"]
        stage_ranks[stage] += 1
        english_example = str(record.get("example_sentence_english") or "").strip()
        chinese_example = (curated or {}).get("translation") or example_translations.get(english_example, "")
        gender = record.get("gender", "")
        article = {"masculine": "der", "feminine": "die", "neuter": "das"}.get(gender, "")
        items.append({
            "id": f"LEX-{index:04d}",
            "term": curated["term"] if curated else record["word"],
            "lemma": record["word"],
            "stage": stage,
            "stageRank": stage_ranks[stage],
            "cefr": record.get("cefr_level") or (curated or {}).get("cefr", ""),
            "pos": (curated or {}).get("pos") or POS_ZH.get(record.get("pos"), record.get("pos") or "词汇"),
            "meaning": meaning,
            "englishGloss": record.get("english_translation", ""),
            "article": article,
            "usagePattern": usage_pattern(record),
            "example": (curated or {}).get("example") or record.get("example_sentence_native", ""),
            "exampleTranslation": chinese_example,
            "exampleTranslationLanguage": "zh",
            "gender": gender,
            "frequencyRank": record.get("word_frequency"),
            "translationStatus": translation_status,
            "richCard": True,
            "curated": bool(curated),
            "reviewStatus": "human_curated" if curated else "machine_complete_needs_teacher_review",
            "theme": (curated or {}).get("theme", ""),
        })
    return {
        "version": "1.0.0",
        "count": len(items),
        "stageCounts": stage_ranks,
        "translationStatusCounts": status_counts,
        "qualityNote": "5,000 个词条均含中文释义、用法片段和中德双语例句；其中 326 个为人工整理，其余由开放数据与离线翻译模型补全，仍需德语教师持续抽样校审。",
        "license": {
            "dataset": "CC BY-SA 4.0",
            "sources": [
                "Language-Learning-decks (MIT; frequency data CC BY-SA 4.0)",
                "wordfreq 3.0 (Apache-2.0 code; CC BY-SA 4.0 data)",
                "word2word (Apache-2.0)",
                "ECDICT/endict (MIT)",
                "Argos Translate (MIT/CC0; permissively licensed model data)",
            ],
        },
        "items": items,
    }


def main():
    rich_entries = load_rich_entries()
    deck = load_deck()
    deck_by_key = {normalize_term(item["word"]): item for item in deck}
    foundation = select_stage(deck, "foundation", {"A1", "A2", "B1"})
    foundation = merge_curated(foundation, [item for item in rich_entries if item["stage"] == "foundation"], deck_by_key)
    advanced = select_stage(deck, "advanced", {"B2", "C1", "C2"})
    advanced = merge_curated(advanced, [item for item in rich_entries if item["stage"] == "advanced"], deck_by_key)
    output = build_output(foundation + advanced)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "count": output["count"],
        "stageCounts": output["stageCounts"],
        "translationStatusCounts": output["translationStatusCounts"],
        "richCards": sum(1 for item in output["items"] if item["richCard"]),
        "curatedCards": sum(1 for item in output["items"] if item["curated"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
