import json
import re
from collections import Counter
from pathlib import Path

from word2word import Word2word


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
INDEX_PATH = ROOT / "data" / "vocab-index.json"
WORD2WORD_CACHE = WORKSPACE / "_sources" / "word2word-cache"
HAS_CJK = re.compile(r"[\u3400-\u9fff]")
FALLBACK_OVERRIDES = {
    "nächst": "下一个的；最近的",
    "Tv": "电视",
    "Fussball": "足球",
    "Cm": "厘米",
    "heutig": "今天的；当今的",
    "Website": "网站",
    "gesamt": "全部的；总计的",
    "anschliessend": "随后；接着",
    "App": "应用程序",
    "wiener": "维也纳的；维也纳人",
    "Kg": "千克；公斤",
    "Nutzer": "用户；使用者",
    "ober": "上面的；上层的",
    "inner": "内部的；内心的",
    "Smartphone": "智能手机",
    "Blog": "博客；网络日志",
    "User": "用户",
    "Community": "社群；社区",
    "Server": "服务器",
    "bayerisch": "巴伐利亚的；巴伐利亚方言",
    "kölner": "科隆的；科隆人",
    "münchner": "慕尼黑的；慕尼黑人",
    "Account": "账户；账号",
    "Edition": "版本；版次",
    "Pkw": "小汽车；乘用车",
    "Anhalt": "线索；依据；停顿",
    "Migrant": "移民；迁移者",
    "Bachelor": "学士；学士学位",
    "mega": "极好的；巨大的",
    "Wlan": "无线局域网；无线网络",
    "evtl": "可能；也许",
    "restlich": "剩余的；其余的",
    "Bayer": "巴伐利亚人",
    "Dj": "唱片骑师；音乐节目主持人",
    "Support": "支持；技术支持",
    "Entwickler": "开发者；研发人员",
    "Alpe": "高山牧场",
    "Demonstrant": "示威者；抗议者",
    "Gb": "吉字节",
    "Kfz": "机动车辆",
    "bisherig": "迄今的；以往的",
    "derzeitig": "当前的；现时的",
    "kommunistisch": "共产主义的",
    "industriell": "工业的；产业的",
    "Source": "来源；源",
    "Tool": "工具",
    "Ranking": "排名；等级",
    "Dominanz": "支配；主导地位",
}
DIRECT_OVERRIDES = {
    "ferner": "此外；而且",
    "Miss": "小姐；选美冠军",
    "Behinderung": "残障；妨碍",
    "auswirken": "产生影响；起作用",
    "Kokain": "可卡因",
    "Gelehrte": "学者",
    "religiös": "宗教的；虔诚的",
    "achten": "注意；尊重",
    "minder": "较少的；较差的",
    "denkbar": "可想象的；可能的",
    "Spruch": "话语；格言",
}


def sanitize_fallback(item):
    if item.get("term") in FALLBACK_OVERRIDES:
        return FALLBACK_OVERRIDES[item["term"]]
    text = str(item.get("meaning", "")).replace(",", "，")
    text = re.sub(r"(?:^|；)\s*(?:abbr|adv|adj|n|a|vt|vi|v)\.\s*", "；", text, flags=re.I)
    text = re.sub(r"^；+|；+$", "", text)
    parts = []
    for part in re.split(r"[；;]", text):
        value = part.strip()
        if value and HAS_CJK.search(value) and value not in parts:
            parts.append(value)
        if len(parts) == 1:
            break
    return "；".join(parts) or f"德语词汇“{item.get('term', '')}”（释义待复核）"


def clean_candidates(values):
    cleaned = []
    for value in values:
        text = str(value).strip()
        if not HAS_CJK.search(text) or text in cleaned:
            continue
        cleaned.append(text)
        if len(cleaned) == 1:
            break
    return cleaned


def main():
    data = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    dictionary = Word2word("de", "zh_cn", custom_savedir=str(WORD2WORD_CACHE))
    updated = 0

    for item in data["items"]:
        if item.get("term") in DIRECT_OVERRIDES:
            item["meaning"] = DIRECT_OVERRIDES[item["term"]]
            item["translationStatus"] = "manual_override"
            continue
        if item.get("translationStatus") == "english_pivot_reviewed":
            item["meaning"] = sanitize_fallback(item)
            continue
        if item.get("translationStatus") not in {"open_dictionary", "direct_de_dictionary"}:
            continue
        lookup = item.get("lemma") or item.get("term", "")
        try:
            candidates = clean_candidates(dictionary(lookup))
        except (KeyError, TypeError):
            candidates = []
        if not candidates:
            item["meaning"] = sanitize_fallback(item)
            item["translationStatus"] = "english_pivot_reviewed"
            continue
        item["meaning"] = "；".join(candidates)
        item["translationStatus"] = "direct_de_dictionary"
        updated += 1

    data["translationStatusCounts"] = dict(
        Counter(item.get("translationStatus", "unknown") for item in data["items"])
    )
    INDEX_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({"updated": updated, "counts": data["translationStatusCounts"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
