import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
INDEX_PATH = ROOT / "data" / "vocab-index.json"
NOUNS_PATH = WORKSPACE / "_build_deps" / "german_nouns" / "nouns.csv"
DECK_PATH = WORKSPACE / "_sources" / "language-learning-decks" / "german" / "german.json"
ARTICLES = re.compile(r"^(?:der|die|das)\s+", re.IGNORECASE)
GENUS_TO_ARTICLE = {"m": "der", "f": "die", "n": "das"}
GENDER_TO_GENUS = {"masculine": "m", "feminine": "f", "neuter": "n"}


def first_value(row, names):
    for name in names:
        value = (row.get(name) or "").strip()
        if value and value not in {"-", "—"}:
            return value
    return ""


def normalize(value):
    return ARTICLES.sub("", str(value or "").strip()).casefold()


def load_nouns():
    result = {}
    with NOUNS_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            lemma = (row.get("lemma") or "").strip()
            if not lemma or lemma.startswith("-"):
                continue
            result.setdefault(lemma.casefold(), []).append(row)
    return result


def choose_noun(rows, expected_gender):
    if not rows:
        return None
    expected = GENDER_TO_GENUS.get(expected_gender, "")
    if expected:
        for row in rows:
            genera = {(row.get(key) or "").strip() for key in ["genus", "genus 1", "genus 2", "genus 3", "genus 4"]}
            if expected in genera:
                return row
    return rows[0]


def main():
    data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    nouns = load_nouns()
    deck = json.loads(DECK_PATH.read_text(encoding="utf-8"))
    deck_by_word = {normalize(item.get("word")): item for item in deck}
    noun_hits = 0
    plural_hits = 0
    separable_hits = 0

    for item in data["items"]:
        key = normalize(item.get("lemma") or item.get("term"))
        noun_row = choose_noun(nouns.get(key), item.get("gender"))
        looks_noun = item.get("article") or item.get("gender") or item.get("pos") == "名词"
        if noun_row and looks_noun:
            noun_hits += 1
            genus = first_value(noun_row, ["genus", "genus 1", "genus 2", "genus 3", "genus 4"])
            item["article"] = item.get("article") or GENUS_TO_ARTICLE.get(genus, "")
            item["plural"] = first_value(noun_row, ["nominativ plural", "nominativ plural*", "nominativ plural 1", "nominativ plural 2", "nominativ plural 3", "nominativ plural 4"])
            item["genitive"] = first_value(noun_row, ["genitiv singular", "genitiv singular*", "genitiv singular 1", "genitiv singular 2", "genitiv singular 3", "genitiv singular 4"])
            if item["plural"]:
                plural_hits += 1
        else:
            item.setdefault("plural", "")
            item.setdefault("genitive", "")

        source = deck_by_word.get(key, {})
        if source.get("is_separable_verb"):
            item["separable"] = True
            item["separablePrefix"] = source.get("separable_prefix", "")
            item["baseVerb"] = source.get("base_verb", "")
            item["verbForms"] = f"可分：{item['separablePrefix']} | 词根：{item['baseVerb']}"
            separable_hits += 1
        else:
            item.setdefault("separable", False)
            item.setdefault("separablePrefix", "")
            item.setdefault("baseVerb", "")
            item.setdefault("verbForms", "")

    sources = data.setdefault("license", {}).setdefault("sources", [])
    noun_source = "german-nouns 1.2.5 / WiktionaryDE (CC BY-SA 4.0)"
    if noun_source not in sources:
        sources.append(noun_source)
    data["formCoverage"] = {"nounMatches": noun_hits, "pluralForms": plural_hits, "separableVerbs": separable_hits}
    INDEX_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(data["formCoverage"], ensure_ascii=False))


if __name__ == "__main__":
    main()
