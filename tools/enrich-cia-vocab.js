const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workspace = path.resolve(root, "..");
const indexPath = path.join(root, "data", "vocab-index.json");
const ipaPath = path.join(workspace, "_sources", "ipa-dict-de.txt");
const verbsRoot = path.join(workspace, "_cia_deps", "node_modules");
const GermanVerbs = require(path.join(verbsRoot, "german-verbs"));
const GermanVerbsDict = require(path.join(verbsRoot, "german-verbs-dict", "dist", "verbs.json"));

const PREFIXES = {
  ab: "离开、向下或终止",
  an: "接近、接触或开始",
  auf: "向上、打开或开始",
  aus: "向外、结束或完全实现",
  bei: "靠近、附加或参与",
  ein: "进入、纳入",
  fest: "固定、牢固",
  fort: "离开或继续",
  her: "朝说话者方向",
  hin: "离开说话者方向",
  los: "脱离或开始",
  mit: "共同、随同",
  nach: "随后、模仿或补充",
  vor: "向前、预先或展示",
  weg: "离开、去除",
  weiter: "继续、进一步",
  wieder: "再次或恢复",
  zu: "朝向、关闭或增加",
  zurück: "返回、退回",
  zusammen: "共同、聚合",
  be: "把动作直接指向对象，常使动词具有及物性",
  emp: "接受或感受；只保存在少数固定词中",
  ent: "离开、去除或进入某种过程",
  er: "达到结果、获得或进入状态",
  miss: "错误、不当或相反",
  ver: "变化、完成、消耗或偏离；具体意义常随词固化",
  zer: "分裂、破坏或散开"
};

const SUFFIXES = {
  ung: "把动词或过程名词化，表示行为、过程或结果",
  heit: "构成阴性抽象名词，表示性质或状态",
  keit: "构成阴性抽象名词，表示性质或可能性",
  schaft: "表示群体、关系、状态或领域",
  nis: "表示结果、状态或抽象概念",
  tum: "表示状态、身份、集合或领域",
  chen: "表示小称，语法性别通常为中性",
  lein: "表示小称，语法性别通常为中性",
  in: "由人物名词构成阴性形式",
  er: "表示从事者、工具或来源相关的人或物",
  tion: "构成多为阴性的外来抽象名词",
  ität: "构成多为阴性的性质或状态名词",
  ismus: "表示思想体系、倾向或现象",
  lich: "构成形容词，表示具有某种性质或关系",
  ig: "构成形容词，表示具有某种特征",
  los: "构成形容词，表示缺少、没有",
  bar: "构成形容词，表示能够或可以被……"
};
const SEPARABLE_PREFIXES = new Set(["ab", "an", "auf", "aus", "bei", "ein", "fest", "fort", "her", "hin", "los", "mit", "nach", "vor", "weg", "weiter", "wieder", "zu", "zurück", "zusammen"]);
const NONFINITE_FORMS = new Set(["geboren", "sinngemäß", "wortwörtlich"]);
const CONJUGATION_OVERRIDES = {
  vorhaben: { present: { ich: "habe vor", du: "hast vor", er: "hat vor" }, preterite: "hatte vor", participle: "vorgehabt", irregular: { du: true, er: true, preterite: true, participle: true }, particle: "vor" },
  ausschliessen: { present: { ich: "schliesse aus", du: "schliesst aus", er: "schliesst aus" }, preterite: "schloss aus", participle: "ausgeschlossen", irregular: { du: false, er: false, preterite: true, participle: true }, particle: "aus" },
  antun: { present: { ich: "tue an", du: "tust an", er: "tut an" }, preterite: "tat an", participle: "angetan", irregular: { du: true, er: true, preterite: true, participle: true }, particle: "an" },
  loswerden: { present: { ich: "werde los", du: "wirst los", er: "wird los" }, preterite: "wurde los", participle: "losgeworden", irregular: { du: true, er: true, preterite: true, participle: true }, particle: "los" },
  heranziehen: { present: { ich: "ziehe heran", du: "ziehst heran", er: "zieht heran" }, preterite: "zog heran", participle: "herangezogen", irregular: { du: false, er: false, preterite: true, participle: true }, particle: "heran" },
  weiterentwickeln: { present: { ich: "entwickle weiter", du: "entwickelst weiter", er: "entwickelt weiter" }, preterite: "entwickelte weiter", participle: "weiterentwickelt", irregular: { du: false, er: false, preterite: false, participle: false }, particle: "weiter" },
  fortschreiten: { present: { ich: "schreite fort", du: "schreitest fort", er: "schreitet fort" }, preterite: "schritt fort", participle: "fortgeschritten", irregular: { du: false, er: false, preterite: true, participle: true }, particle: "fort" }
};

const VALENCY = {
  sein: "+ Nominativ / Prädikativ",
  haben: "+ Akkusativ",
  werden: "+ Nominativ / Prädikativ；也作被动态助动词",
  geben: "+ Dativ + Akkusativ；es gibt + Akkusativ",
  helfen: "+ Dativ",
  danken: "+ Dativ；für + Akkusativ",
  gefallen: "+ Dativ",
  gehören: "+ Dativ；zu + Dativ",
  folgen: "+ Dativ",
  fragen: "+ Akkusativ；nach + Dativ",
  antworten: "+ Dativ；auf + Akkusativ",
  warten: "auf + Akkusativ",
  denken: "an + Akkusativ",
  teilnehmen: "an + Dativ",
  abhängen: "von + Dativ",
  bestehen: "aus + Dativ / auf + Dativ / in + Dativ",
  sich_erinnern: "sich an + Akkusativ erinnern",
  erinnern: "+ Akkusativ；an + Akkusativ",
  sich_freuen: "sich auf + Akkusativ / über + Akkusativ freuen",
  sich_interessieren: "sich für + Akkusativ interessieren",
  sich_auswirken: "sich auf + Akkusativ auswirken",
  sich_vorbereiten: "sich auf + Akkusativ vorbereiten；etwas + Akkusativ vorbereiten",
  sich_einleben: "sich in + Dativ einleben",
  bitten: "+ Akkusativ；um + Akkusativ",
  sprechen: "mit + Dativ；über + Akkusativ / von + Dativ",
  reden: "mit + Dativ；über + Akkusativ / von + Dativ",
  gratulieren: "+ Dativ；zu + Dativ",
  begegnen: "+ Dativ",
  vertrauen: "+ Dativ",
  widersprechen: "+ Dativ",
  zustimmen: "+ Dativ",
  vermeiden: "+ Akkusativ",
  beeinflussen: "+ Akkusativ",
  betreffen: "+ Akkusativ"
};

const MORPHEME_MEANINGS = {
  stehen: "站立",
  wirken: "起作用、产生效果",
  bilden: "形成、构成",
  denken: "思考",
  achten: "注意、尊重",
  sprechen: "说、讲",
  gang: "行走、过程",
  minder: "较少、较低",
  halten: "保持、拿住",
  führen: "带领、引导",
  nehmen: "拿、取",
  geben: "给",
  kommen: "来、到达",
  gehen: "走、进行",
  machen: "做、使得",
  sehen: "看见",
  hören: "听见",
  schreiben: "书写",
  lesen: "阅读",
  lernen: "学习",
  bereiten: "准备、安排"
};

const CONFUSION_NOTES = {
  kennen: "kennen 用于熟悉人、地点或事物；知道事实通常用 wissen。",
  wissen: "wissen 接事实或从句；熟悉某人、某地通常用 kennen。",
  lernen: "lernen 是学习知识或技能；在大学攻读某专业常用 studieren。",
  studieren: "studieren 是大学阶段学习或研究；一般学习行为用 lernen。",
  bekommen: "bekommen 是“得到”，不是英语 become；“变成”用 werden。",
  werden: "werden 表示“变成”或构成将来时、被动态；“得到”用 bekommen。",
  fragen: "fragen 是提问；请求别人做事通常用 bitten。",
  bitten: "bitten 是请求，常见结构是 jemanden um etwas bitten。",
  bringen: "bringen 强调把东西带到目的地；holen 强调去取回来。",
  holen: "holen 是去取并带回来；bringen 是把东西带过去。",
  liegen: "liegen 是处于平放状态；legen 表示把某物放下。",
  legen: "legen 是放置动作；liegen 表示已经躺着或放着。",
  stehen: "stehen 是处于直立状态；stellen 表示把某物立着放。",
  stellen: "stellen 是放置动作；stehen 表示已经站着或立着。",
  als: "als 用于过去一次性事件或比较；反复发生的“当……时”常用 wenn。",
  wenn: "wenn 用于条件或反复发生的时间关系；过去一次性事件常用 als。"
};

const ENGLISH_BRIDGES = {
  haus: "house", wasser: "water", hand: "hand", name: "name", winter: "winter",
  sommer: "summer", finger: "finger", student: "student", universität: "university",
  problem: "problem", information: "information", musik: "music", kultur: "culture",
  sport: "sport", hotel: "hotel", radio: "radio", computer: "computer"
};

const bareTerm = (value) => String(value || "").replace(/^(?:der|die|das)\s+/i, "").trim();
const key = (value) => bareTerm(value).toLocaleLowerCase("de-DE");
const isVerb = (entry) => entry.pos.includes("动词") && !NONFINITE_FORMS.has(key(entry.term));
const isNoun = (entry) => entry.pos.includes("名词");
const isReflexive = (entry) => entry.pos.includes("反身") || /^sich\b/i.test(entry.usagePattern || "") || Object.hasOwn(VALENCY, `sich_${key(entry.term)}`);
const flatForm = (value) => Array.isArray(value) ? value.join(" ") : String(value || "");

const ipaMap = new Map();
for (const line of fs.readFileSync(ipaPath, "utf8").split(/\r?\n/)) {
  const [word, ipa] = line.split("\t");
  if (word && ipa && !ipaMap.has(key(word))) ipaMap.set(key(word), ipa.split(", ")[0]);
}

const data = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const entriesByKey = new Map();
for (const entry of data.items) {
  const entryKey = key(entry.term);
  if (!entriesByKey.has(entryKey)) entriesByKey.set(entryKey, entry);
}

const shortMeaning = (entry) => String(entry.meaning || "").split(/[；;]/)[0];
const pickByTerm = (entry, values) => values[[...bareTerm(entry.term)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % values.length];
const sceneFor = (entry) => {
  const haystack = `${entry.term} ${entry.meaning} ${entry.englishGloss || ""} ${entry.usagePattern || ""}`;
  if (/吃|喝|餐|饭|食品|咖啡|restaurant|essen|trinken/i.test(haystack)) return "食堂窗口排到你了：你要点单、付款，顺手评价味道";
  if (/课|学习|学生|大学|考试|作业|study|learn|univer|prüfung/i.test(haystack)) return "课前两分钟，同学在群里追问教室、作业或考试安排";
  if (/车|路|旅行|方向|火车|飞机|travel|fahr|reise|bahnhof/i.test(haystack)) return "车快开了，你要向路人确认站台、方向或换乘办法";
  if (/工作|公司|职业|申请|工资|work|job|firma|beruf/i.test(haystack)) return "实习面试里，对方让你把经历、要求或下一步说清楚";
  if (/观点|认为|论证|原因|结果|意见|argument|meinung|grund/i.test(haystack)) return "讨论课上有人不同意你，你得接住话并给出一个理由";
  if (/朋友|家庭|高兴|生气|担心|感觉|friend|famil|gefühl/i.test(haystack)) return "朋友发来语音问你怎么了，你要自然讲出刚才的事和感受";
  if (/买|价格|钱|商店|支付|buy|price|geld|kauf/i.test(haystack)) return "结账时价格不对，你要当场询问、解释或提出退换";
  if (/病|健康|医生|药|身体|health|arzt|krank|medizin/i.test(haystack)) return "诊所前台问你哪里不舒服、多久了，你要用完整句回答";
  if (/家|房间|住|厨房|门|窗|home|room|wohn|zimmer/i.test(haystack)) return "室友站在门口问家里怎么安排，你要马上描述位置或动作";
  if (/说|告诉|问|回答|信息|电话|邮件|speak|tell|answer|mail/i.test(haystack)) return "电话那头没听懂，你要换一种说法把关键信息再讲一遍";
  if (/时间|早|晚|今天|明天|周|月|time|today|morgen|woche/i.test(haystack)) return "朋友临时改约，你要确认几点、哪天以及先后顺序";
  if (isVerb(entry)) return pickByTerm(entry, [
    "室友问你接下来要做什么，你需要用一个动作句直接回答",
    "朋友没听清刚才发生了什么，你要用一句口语把动作讲明白",
    "办事窗口轮到你了，你要把自己的请求或处理过程说完整"
  ]);
  if (isNoun(entry)) return pickByTerm(entry, [
    "你把照片递给同学，需要指出其中这个人、地点或事物",
    "聊天时对方问你缺什么，你要带着冠词自然说出这个名词",
    "你在前台说明情况，这个名词正是句子里不可少的关键词"
  ]);
  return pickByTerm(entry, [
    "朋友让你评价刚才那件事，你需要用这个词把态度说准确",
    "你正在复述一天的经过，这个词负责把时间、程度或逻辑接起来",
    "对方只听懂一半，你要用这个词补上最关键的语气或关系"
  ]);
};

const englishBridgeFor = (entry) => {
  const term = key(entry.term).replace(/^sich\s+/, "");
  const known = ENGLISH_BRIDGES[term];
  if (known) return `${bareTerm(entry.term)} ↔ ${known}：词形和核心概念相近，可作为第一条检索线索。`;
  const english = String(entry.englishGloss || "").toLocaleLowerCase().replace(/^to\s+|^(?:a|an|the)\s+/, "").split(/[;,/ (]/)[0];
  if (english.length >= 5 && term.length >= 5 && (english === term || english.slice(0, 5) === term.slice(0, 5))) {
    return `${bareTerm(entry.term)} ↔ ${english}：这是可靠的英德同形/近形桥，不要照搬英语发音。`;
  }
  return "";
};

const memoryFor = (entry, valency) => {
  const termKey = key(entry.term).replace(/^sich\s+/, "");
  const scene = sceneFor(entry);
  const contrast = CONFUSION_NOTES[termKey] || (isVerb(entry)
    ? `不要只背“${shortMeaning(entry)}”；把 ${valency || "例句中的固定结构"} 连成一个口语块。`
    : isNoun(entry) ? `把冠词和复数当成词的一部分，开口时不要只说裸词 ${bareTerm(entry.term)}。` : "先从场景回想意思，再从意思反向说出德语。");
  return {
    scene: `${scene}。别先翻译整句：抓住“${shortMeaning(entry)}”这个意图，让 ${bareTerm(entry.term)} 先跳出来。`,
    spokenCue: entry.example || entry.usagePattern || bareTerm(entry.term),
    contrast,
    englishBridge: englishBridgeFor(entry),
    recallPrompt: `遮住答案，先口头回答：在“${scene}”时，你会怎样用 ${bareTerm(entry.term)} 开口？再把人物或时间换成自己的。`
  };
};
const meaningOf = (form) => {
  const formKey = key(form);
  if (MORPHEME_MEANINGS[formKey]) return MORPHEME_MEANINGS[formKey];
  const entry = entriesByKey.get(formKey);
  if (!entry) return "相关词基";
  if (["curated", "manual_override", "tfs4_core"].includes(entry.translationStatus)) return shortMeaning(entry);
  return "相关词基（未采用机器多义释义）";
};

const findVerbLookup = (term) => {
  const original = bareTerm(term).replace(/^sich\s+/i, "");
  const candidates = [original];
  if (original.includes("ss") && !original.includes("ß")) candidates.push(original.replace(/ss/g, "ß"));
  return candidates.find((candidate) => GermanVerbsDict[candidate]) || original;
};

const swissForm = (source, form) => source.includes("ss") && !source.includes("ß") ? form.replace(/ß/g, "ss") : form;

const regularFallback = (term, prefix = "") => {
  const stem = term.endsWith("en") ? term.slice(0, -2) : term.endsWith("n") ? term.slice(0, -1) : term;
  const needsE = /[dt]$/.test(stem);
  const noGe = term.endsWith("ieren") || ["be", "emp", "ent", "er", "ge", "miss", "ver", "zer"].some((item) => term.startsWith(item));
  const particleStem = prefix && term.startsWith(prefix) ? term.slice(prefix.length).replace(/en$/, "") : stem;
  const participleEnding = /[dt]$/.test(particleStem) ? "et" : "t";
  return {
    present: { ich: `${stem}e`, du: `${stem}${needsE ? "est" : "st"}`, er: `${stem}${needsE ? "et" : "t"}` },
    preterite: `${stem}${needsE ? "ete" : "te"}`,
    participle: prefix ? `${prefix}ge${particleStem}${participleEnding}` : noGe ? `${stem}${needsE ? "et" : "t"}` : `ge${stem}${needsE ? "et" : "t"}`,
    source: "rule_generated_needs_review",
    irregular: { du: false, er: false, preterite: false, participle: false }
  };
};

const conjugationFor = (entry, prefix) => {
  const sourceTerm = bareTerm(entry.term).replace(/^sich\s+/i, "");
  if (/\s/.test(sourceTerm) || /\b(?:etw|jdn|jdm)\./i.test(sourceTerm)) return null;
  if (CONJUGATION_OVERRIDES[sourceTerm]) return { ...CONJUGATION_OVERRIDES[sourceTerm], source: "manual_override" };
  const lookup = findVerbLookup(sourceTerm);
  try {
    const info = GermanVerbs.getVerbInfo(GermanVerbsDict, lookup);
    const rawPresent = info["PRÄ"].S;
    const particle = Array.isArray(rawPresent[1]) ? rawPresent[1][rawPresent[1].length - 1] : "";
    const present = {
      ich: swissForm(sourceTerm, flatForm(rawPresent[1])),
      du: swissForm(sourceTerm, flatForm(rawPresent[2])),
      er: swissForm(sourceTerm, flatForm(rawPresent[3]))
    };
    const baseInfinitive = particle && lookup.startsWith(particle) ? lookup.slice(particle.length) : lookup;
    const stem = baseInfinitive.replace(/en$/, "").replace(/n$/, "");
    const ambiguous = Array.isArray(info.PA2) && info.PA2.length > 1 && info.PA2.some((form) => form.endsWith("t"));
    const regularPreterite = `${stem}${/[dt]$/.test(stem) ? "ete" : "te"}${particle ? ` ${particle}` : ""}`;
    const preterite = swissForm(sourceTerm, ambiguous ? regularPreterite : flatForm(info.PRT.S[3]));
    const participleCandidate = ambiguous ? info.PA2.find((form) => form.endsWith("t")) : GermanVerbs.getPartizip2(GermanVerbsDict, lookup);
    const participle = swissForm(sourceTerm, participleCandidate);
    const presentStem = present.du.split(" ")[0].replace(/(?:e?st)$/, "");
    const thirdStem = present.er.split(" ")[0].replace(/(?:e?t)$/, "");
    const regularPast = new RegExp(`^${stem}(?:e)?te$`, "i").test(preterite.split(" ")[0]);
    return {
      present,
      preterite,
      participle,
      source: "german_verbs_dict",
      particle,
      disambiguated: ambiguous,
      irregular: {
        du: presentStem.toLocaleLowerCase("de-DE") !== stem.toLocaleLowerCase("de-DE"),
        er: thirdStem.toLocaleLowerCase("de-DE") !== stem.toLocaleLowerCase("de-DE"),
        preterite: !regularPast,
        participle: !participle.endsWith("t")
      }
    };
  } catch {
    return regularFallback(sourceTerm, prefix);
  }
};

const findPrefix = (entry) => {
  if (!isVerb(entry)) return null;
  const term = key(entry.term).replace(/^sich\s+/i, "");
  if (entry.separablePrefix && entry.baseVerb) return { form: entry.separablePrefix, base: entry.baseVerb, separable: true };
  const candidates = Object.keys(PREFIXES).sort((left, right) => right.length - left.length);
  for (const prefix of candidates) {
    if (!term.startsWith(prefix) || term.length - prefix.length < 3) continue;
    const base = term.slice(prefix.length);
    if (entriesByKey.has(base) || GermanVerbsDict[base]) return { form: prefix, base, separable: SEPARABLE_PREFIXES.has(prefix) };
  }
  return null;
};

const findSuffix = (entry) => {
  const term = key(entry.term);
  const candidates = Object.keys(SUFFIXES).sort((left, right) => right.length - left.length);
  for (const suffix of candidates) {
    if (!term.endsWith(suffix) || term.length - suffix.length < 3) continue;
    const raw = term.slice(0, -suffix.length);
    const bases = suffix === "ung" ? [`${raw}en`, `${raw}n`, raw] : [raw, `${raw}e`, `${raw}en`, `${raw}n`];
    const base = bases.find((candidate) => {
      const baseEntry = entriesByKey.get(candidate);
      if (!baseEntry) return false;
      return suffix !== "ung" || isVerb(baseEntry);
    });
    if (base) return { form: suffix, base };
  }
  return null;
};

const findCompound = (entry) => {
  if (!isNoun(entry)) return null;
  const term = bareTerm(entry.term);
  const lower = term.toLocaleLowerCase("de-DE");
  const candidates = [];
  for (let index = 3; index <= lower.length - 3; index += 1) {
    const left = lower.slice(0, index);
    const right = lower.slice(index);
    if (entriesByKey.has(left) && entriesByKey.has(right)) candidates.push([left, right]);
    if (left.endsWith("s") && entriesByKey.has(left.slice(0, -1)) && entriesByKey.has(right)) candidates.push([left.slice(0, -1), right]);
  }
  if (!candidates.length) return null;
  const [left, right] = candidates.sort((a, b) => b[1].length - a[1].length)[0];
  return [{ form: left, meaning: meaningOf(left) }, { form: right, meaning: meaningOf(right) }];
};

const valencyFor = (entry) => {
  const reflexive = isReflexive(entry);
  const termKey = key(entry.term).replace(/^sich\s+/i, "");
  const lookup = `${reflexive ? "sich_" : ""}${termKey}`;
  if (VALENCY[lookup]) return VALENCY[lookup];
  if (VALENCY[termKey]) return VALENCY[termKey];
  const governed = String(entry.usagePattern || "").match(/支配：([^；]+)/);
  if (governed) return governed[1].trim();
  return entry.usagePattern ? `常用结构：${entry.usagePattern}` : "当前词卡未标注固定格支配，请结合例句掌握";
};

let ipaCoverage = 0;
let conjugationCoverage = 0;
let transparentMorphology = 0;

for (const entry of data.items) {
  const prefix = findPrefix(entry);
  const suffix = findSuffix(entry);
  const compound = findCompound(entry);
  const entryKey = key(entry.term);
  const standardKey = entryKey
    .replace(/schliessen/g, "schließen")
    .replace(/heissen/g, "heißen")
    .replace(/geniessen/g, "genießen")
    .replace(/fliessen/g, "fließen")
    .replace(/giessen/g, "gießen")
    .replace(/stossen/g, "stoßen")
    .replace(/ausser/g, "außer")
    .replace(/mäss/g, "mäß")
    .replace(/^gross$/g, "groß")
    .replace(/^fuss$/g, "fuß")
    .replace(/^weiss$/g, "weiß");
  const ipa = ipaMap.get(entryKey) || ipaMap.get(standardKey) || (entryKey.includes("ss") ? ipaMap.get(entryKey.replace(/ss/g, "ß")) : "") || "";
  if (ipa) ipaCoverage += 1;

  let morphology;
  if (compound) {
    transparentMorphology += 1;
    morphology = {
      type: "compound",
      prefix: null,
      stem: null,
      suffix: null,
      components: compound,
      logic: `${compound.map((part) => `${part.form}（${part.meaning}）`).join(" + ")}，组合后指“${shortMeaning(entry)}”。`,
      note: "现代德语透明复合词分析；不是历史词源断言"
    };
  } else if (suffix) {
    transparentMorphology += 1;
    morphology = {
      type: "suffix",
      prefix: null,
      stem: { form: suffix.base, meaning: meaningOf(suffix.base) },
      suffix: { form: `-${suffix.form}`, meaning: SUFFIXES[suffix.form] },
      components: [],
      logic: `${suffix.base} 提供“${meaningOf(suffix.base)}”这一核心，-${suffix.form} 用来${SUFFIXES[suffix.form]}，因此形成“${shortMeaning(entry)}”。`,
      note: "现代德语构词分析"
    };
  } else if (prefix) {
    transparentMorphology += 1;
    morphology = {
      type: "prefix",
      prefix: { form: `${prefix.form}-`, meaning: PREFIXES[prefix.form], separable: prefix.separable },
      stem: { form: prefix.base, meaning: meaningOf(prefix.base) },
      suffix: null,
      components: [],
      logic: `${prefix.form}- 提供“${PREFIXES[prefix.form]}”这一方向，${prefix.base} 表示“${meaningOf(prefix.base)}”；二者在这个词中共同聚焦为“${shortMeaning(entry)}”。`,
      note: "现代构词联想；前缀在具体词中的意义可能已经固化"
    };
  } else {
    morphology = {
      type: "simple",
      prefix: null,
      stem: { form: bareTerm(entry.term), meaning: shortMeaning(entry) },
      suffix: null,
      components: [],
      logic: `这是一个在现代德语中不宜继续硬拆的基础词。直接把词形、核心义“${shortMeaning(entry)}”和例句连在一起记忆，比编造谐音更可靠。`,
      note: "未作未经证实的历史词源拆分"
    };
  }

  const conjugation = isVerb(entry) ? conjugationFor(entry, prefix?.separable ? prefix.form : "") : null;
  if (conjugation?.source === "german_verbs_dict") conjugationCoverage += 1;
  const reflexive = isVerb(entry) && isReflexive(entry);
  if (conjugation && reflexive) {
    const addPronoun = (form, pronoun) => {
      const particle = conjugation.particle || (prefix?.separable ? prefix.form : "");
      if (particle && form.endsWith(` ${particle}`)) return `${form.slice(0, -(particle.length + 1))} ${pronoun} ${particle}`;
      return `${form} ${pronoun}`;
    };
    conjugation.present.ich = addPronoun(conjugation.present.ich, "mich");
    conjugation.present.du = addPronoun(conjugation.present.du, "dich");
    conjugation.present.er = addPronoun(conjugation.present.er, "sich");
    conjugation.preterite = addPronoun(conjugation.preterite, "sich");
  }

  const nounTitle = [entry.article, bareTerm(entry.term)].filter(Boolean).join(" ");
  const title = conjugation
    ? `${reflexive && !/^sich\b/i.test(entry.term) ? `sich ${entry.term}` : entry.term}, ${conjugation.preterite}, ${conjugation.participle}`
    : isNoun(entry) ? `${nounTitle}, ${entry.plural || "—"}` : entry.term;
  const valency = isVerb(entry) ? valencyFor(entry) : "";
  const memory = memoryFor(entry, valency);
  if (morphology.type === "simple") {
    morphology.logic = `这个词不适合硬拆。把它钉在生活画面里：${memory.scene} 然后直接复述下面的开口句，建立“场景 → 德语”的检索路线。`;
  } else {
    morphology.logic = `${morphology.logic} 记忆时先还原词的结构，再落回这个生活画面：${memory.scene}`;
  }

  entry.cia = {
    title,
    ipa,
    pronunciationStatus: ipa ? "open_ipa_verified" : "ipa_pending_review",
    core: { zh: entry.meaning, en: entry.englishGloss || "" },
    morphology,
    memory,
    application: {
      conjugation,
      valency,
      nounForms: isNoun(entry) ? { article: entry.article || "", plural: entry.plural || "—", genitive: entry.genitive || "—" } : null,
      example: entry.example,
      translation: entry.exampleTranslation
    }
  };
}

data.ciaCoverage = {
  ipa: ipaCoverage,
  conjugationDictionary: conjugationCoverage,
  transparentMorphology,
  total: data.items.length
};
data.licenses = data.licenses || [];
if (!data.licenses.some((item) => item.name === "open-dict-data/ipa-dict German")) {
  data.licenses.push({ name: "open-dict-data/ipa-dict German", license: "CC BY-SA", use: "IPA pronunciation and stress" });
}
if (!data.licenses.some((item) => item.name === "german-verbs-dict")) {
  data.licenses.push({ name: "german-verbs-dict / LanguageTool german-pos-dict", license: "CC BY-SA 4.0", use: "German verb conjugation" });
}

fs.writeFileSync(indexPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify(data.ciaCoverage));
