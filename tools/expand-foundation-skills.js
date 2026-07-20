const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const lessonsPath = path.join(root, "data", "skill-lessons.json");
const libraryPath = path.join(root, "data", "skills-library.json");
const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, "utf8"));
const libraryData = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

const dictations = [
  ["新学期的第一周", "In der ersten Woche des Semesters lernen die neuen Studierenden nicht nur ihre Lehrkräfte kennen. Sie müssen auch den Stundenplan verstehen, die Bibliothekskarte beantragen und sich auf der Lernplattform anmelden. Viele Informationen kommen gleichzeitig. Deshalb empfiehlt die Studienberaterin, wichtige Termine sofort in einen Kalender einzutragen. Wer eine Aufgabe nicht versteht, sollte früh nachfragen. Kleine Fragen lassen sich am Anfang meist schnell klären, während vergessene Fristen später unnötigen Stress verursachen.", "第一周有哪些任务，为什么要记录期限？"],
  ["合租生活", "Lina wohnt seit drei Monaten in einer Wohngemeinschaft. Am Anfang gab es häufig Streit, weil niemand genau wusste, wer einkaufen oder die Küche putzen sollte. Inzwischen haben die vier Bewohner einen Wochenplan erstellt. Jeder übernimmt zwei Aufgaben und trägt ein, wann er nicht zu Hause ist. Einmal im Monat sprechen sie über gemeinsame Ausgaben. Seitdem ist das Zusammenleben ruhiger. Lina hat gelernt, dass klare Absprachen viele kleine Konflikte verhindern können.", "合租矛盾如何得到解决？"],
  ["校园自行车站", "Die Universität hat vor dem Hauptgebäude eine neue Fahrradstation eröffnet. Dort können Studierende kleine Reparaturen selbst durchführen und kostenlos Werkzeug ausleihen. Zweimal pro Woche hilft außerdem ein Mechaniker bei schwierigeren Problemen. Das Angebot soll mehr Menschen dazu bewegen, mit dem Fahrrad zur Hochschule zu kommen. In den ersten Tagen war die Station besonders am Nachmittag gut besucht. Die Universität plant deshalb bereits längere Öffnungszeiten für das nächste Semester.", "自行车站提供什么服务，学校下一步计划什么？"],
  ["语言交换", "Jeden Mittwoch findet im Kulturzentrum ein Sprachtandem statt. Deutsche und internationale Studierende treffen sich dort für neunzig Minuten. In der ersten Hälfte sprechen alle Deutsch, danach wechseln sie in die Sprache des Partners. Die Teilnehmenden sollen Fehler nicht ständig unterbrechen, sondern zunächst wichtige Ausdrücke notieren. Am Ende besprechen sie gemeinsam zwei oder drei typische Probleme. So bleibt das Gespräch flüssig, und trotzdem erhalten beide Seiten hilfreiche Rückmeldungen.", "语言交换如何安排，怎样纠错？"],
  ["兼职与学习", "Viele Studierende arbeiten neben dem Studium, um ihre Miete und andere Ausgaben zu bezahlen. Eine Beschäftigung kann praktische Erfahrungen bringen, kostet aber auch Zeit und Energie. Wer regelmäßig mehr als zwanzig Stunden pro Woche arbeitet, hat oft Schwierigkeiten, alle Seminare vorzubereiten. Die Beratungsstelle empfiehlt deshalb, Arbeitszeiten früh mit dem Stundenplan abzustimmen. In Prüfungsphasen sollte außerdem rechtzeitig geklärt werden, ob weniger Schichten möglich sind.", "兼职的好处、风险和建议分别是什么？"],
  ["减少食物浪费", "In der Mensa bleiben jeden Tag Lebensmittel übrig. Seit diesem Monat können Studierende kurz vor der Schließung bestimmte Gerichte günstiger kaufen. Speisen, die nicht mehr verkauft werden, gehen an eine soziale Einrichtung. Gleichzeitig wurden die Portionen verändert: Gäste wählen nun zwischen drei Größen. Nach vier Wochen soll geprüft werden, ob weniger Essen weggeworfen wird. Die Mensaleitung betont, dass niedrige Preise allein das Problem nicht lösen, wenn weiterhin zu große Portionen bestellt werden.", "食堂采取了哪些措施？"],
  ["数字化讲义", "Eine Fakultät stellt ihre Vorlesungsunterlagen künftig nur noch digital bereit. Damit möchte sie Papier sparen und Änderungen schneller veröffentlichen. Einige Studierende begrüßen die Entscheidung, weil sie alle Texte auf einem Gerät mitnehmen können. Andere lernen lieber mit ausgedruckten Seiten und machen sich Sorgen wegen der zusätzlichen Bildschirmzeit. Die Fakultät richtet deshalb Druckstationen ein, an denen notwendige Materialien zu einem niedrigen Preis ausgedruckt werden können.", "数字化讲义有哪些不同观点？"],
  ["社区花园", "Auf einer früheren Parkfläche ist ein Gemeinschaftsgarten entstanden. Bewohnerinnen und Bewohner aus dem Viertel bauen dort Gemüse und Kräuter an. Die Stadt stellt Wasser und einige Geräte zur Verfügung, während die Gruppe Pflege und Organisation übernimmt. Ein Teil der Ernte wird gemeinsam gekocht, ein anderer Teil geht an eine nahegelegene Suppenküche. Das Projekt verbessert nicht nur die Umwelt. Menschen, die vorher kaum miteinander gesprochen haben, planen nun regelmäßig gemeinsame Aktivitäten.", "社区花园由谁负责，产生了哪些作用？"],
  ["实习申请", "Jonas möchte im Sommer ein Praktikum bei einem Verlag machen. Bevor er seine Bewerbung abschickt, informiert er sich genau über das Unternehmen. Im Anschreiben nennt er nicht nur seine Studienfächer, sondern beschreibt auch ein Seminarprojekt, das zur ausgeschriebenen Stelle passt. Eine Freundin liest den Text Korrektur und entdeckt mehrere lange Sätze. Jonas überarbeitet sie und achtet darauf, dass jede Aussage einen klaren Bezug zur Stelle hat. Erst danach sendet er die Unterlagen ab.", "Jonas如何改进实习申请？"],
  ["公共交通调查", "Die Stadt untersucht, warum viele Beschäftigte weiterhin mit dem Auto zur Arbeit fahren. In einer Onlinebefragung nennen die meisten nicht den Fahrpreis, sondern unzuverlässige Anschlüsse und fehlende Verbindungen am Abend. Die Verkehrsplanung will deshalb zunächst zwei Buslinien häufiger fahren lassen. Nach sechs Monaten werden Fahrgastzahlen und Verspätungen verglichen. Erst dann soll entschieden werden, ob das Angebot dauerhaft erweitert wird. Für die Stadt ist wichtig, Maßnahmen anhand tatsächlicher Nutzung zu bewerten.", "调查发现什么，措施将如何评估？"],
  ["修理而不是丢弃", "Ein neues Reparaturcafé öffnet jeden zweiten Samstag. Freiwillige helfen dabei, kaputte Lampen, Radios und kleine Haushaltsgeräte zu untersuchen. Sie reparieren die Gegenstände nicht einfach allein, sondern erklären jeden Schritt. Dadurch lernen Besucherinnen und Besucher, einfache Fehler später selbst zu beheben. Ersatzteile müssen bezahlt werden, Beratung und Werkzeug sind kostenlos. Geräte mit gefährlichen Schäden werden aus Sicherheitsgründen nicht geöffnet. Das Team möchte so Abfall vermeiden und technisches Wissen weitergeben.", "维修咖啡馆如何运作，有什么限制？"],
  ["考试前的睡眠", "Kurz vor Prüfungen lernen manche Studierende bis spät in die Nacht. Forschende weisen jedoch darauf hin, dass Schlaf für das Speichern neuer Informationen wichtig ist. Wer dauerhaft zu wenig schläft, kann sich schlechter konzentrieren und macht häufiger Flüchtigkeitsfehler. Die Lernberatung empfiehlt, große Stoffmengen über mehrere Wochen zu verteilen. Am Abend vor der Prüfung sollten nur noch zentrale Punkte wiederholt werden. Ein klarer Plan und regelmäßige Pausen sind meist wirksamer als eine einzige sehr lange Lernnacht.", "为什么睡眠重要，考前应怎样安排？"]
];

const writingTasks = [
  ["给教师写延期邮件", "你因短期生病无法按时提交课程作业。写一封正式邮件，说明情况、提出一个具体的新日期并礼貌致谢。", "Sehr geehrte Frau Professorin Keller,\n\naufgrund einer kurzfristigen Erkrankung kann ich meine Hausaufgabe leider nicht bis Freitag fertigstellen. Ich möchte Sie daher höflich bitten, mir eine Abgabe bis zum kommenden Dienstag zu ermöglichen. Falls erforderlich, kann ich eine ärztliche Bescheinigung vorlegen.\n\nVielen Dank für Ihr Verständnis.\n\nMit freundlichen Grüßen\nLi Ming", ["称呼和落款正式", "说明原因但不过度展开", "提出具体日期"]],
  ["描述第一学期", "写一段约100词的短文，描述第一学期最大的困难、你采取的办法和结果。", "Mein erstes Semester war vor allem wegen der vielen neuen Termine schwierig. Anfangs vergaß ich häufig kleine Aufgaben und begann zu spät mit der Vorbereitung. Deshalb trug ich alle Fristen in einen digitalen Kalender ein und plante jeden Sonntag die folgende Woche. Außerdem lernte ich zweimal pro Woche mit einer kleinen Gruppe. Nach einigen Wochen konnte ich meine Zeit besser einteilen. Ich hatte zwar weiterhin viel zu tun, aber ich arbeitete ruhiger und gab meine Aufgaben pünktlich ab.", ["困难具体", "措施与结果有因果关系", "时态前后一致"]],
  ["是否保留线下课", "围绕“大学课程是否应全部线上化”写约120词，给出立场、两个理由和一个让步。", "Digitale Lehrveranstaltungen bieten zeitliche Flexibilität und erleichtern den Zugang zu Materialien. Trotzdem sollten Universitäten Präsenzkurse nicht vollständig ersetzen. Erstens können Studierende im Seminar unmittelbar nachfragen und gemeinsam Lösungen entwickeln. Zweitens hilft der feste Lernort vielen dabei, ihren Alltag zu strukturieren. Zwar sind Onlineangebote für lange Wege oder Krankheit sehr nützlich, doch nicht jede Lernform funktioniert am Bildschirm gleich gut. Sinnvoll ist deshalb eine Kombination: Vorlesungen können aufgezeichnet werden, während Übungen und Diskussionen regelmäßig vor Ort stattfinden.", ["立场明确", "至少两个理由", "包含让步和结论"]],
  ["图表趋势描述", "假设一张图显示骑车上学的学生比例从30%升至48%。用约90词描述变化、可能原因和局限。", "Die Grafik zeigt, dass der Anteil der Studierenden, die mit dem Fahrrad zur Hochschule fahren, innerhalb von drei Jahren von 30 auf 48 Prozent gestiegen ist. Ein möglicher Grund ist der Ausbau sicherer Fahrradwege. Auch höhere Fahrpreise könnten eine Rolle spielen. Aus der Grafik geht jedoch nicht hervor, ob dieselben Personen jedes Jahr befragt wurden oder wie groß die Stichprobe war. Daher lässt sich zwar ein deutlicher Trend erkennen, seine Ursachen können aber nicht sicher bestimmt werden.", ["准确写出数字变化", "原因使用可能性表达", "指出数据局限"]],
  ["概括一项措施", "用80至100词概括：学校延长图书馆开放时间，先试行三个月，之后根据使用数据决定是否保留。", "Die Universität verlängert die Öffnungszeiten der Bibliothek zunächst für drei Monate. Studierende können die Arbeitsplätze an Werktagen länger nutzen. Mit dieser Testphase reagiert die Hochschulleitung auf die hohe Nachfrage während der Prüfungszeit. Nach Abschluss des Versuchs werden die Besucherzahlen ausgewertet. Auf dieser Grundlage entscheidet die Universität, ob die längeren Öffnungszeiten dauerhaft gelten. Die Maßnahme verbindet somit ein zusätzliches Angebot mit einer späteren Überprüfung seiner tatsächlichen Nutzung.", ["不加入个人观点", "包含试行期限", "写清评估与决定关系"]],
  ["投诉宿舍噪音", "向宿舍管理部门写一封正式邮件，说明夜间噪音问题、已持续多久及你希望采取的措施。", "Sehr geehrte Damen und Herren,\n\nseit etwa zwei Wochen kommt es im Gemeinschaftsraum unseres Wohnheims regelmäßig nach 23 Uhr zu erheblichem Lärm. Mehrere Bewohnerinnen und Bewohner können deshalb nachts nicht schlafen. Ein persönliches Gespräch hat bisher keine dauerhafte Verbesserung gebracht. Ich möchte Sie bitten, auf die geltenden Ruhezeiten hinzuweisen und die Situation am kommenden Wochenende zu kontrollieren.\n\nVielen Dank für Ihre Unterstützung.\n\nMit freundlichen Grüßen\nWang Yue", ["事实和时间明确", "诉求可执行", "语气客观礼貌"]],
  ["支持社区花园", "就“学校是否应建立社区花园”写一段论证，包含好处、现实困难和解决建议。", "Ein Gemeinschaftsgarten auf dem Campus wäre sinnvoll, weil Studierende dort praktische Umweltbildung mit sozialen Kontakten verbinden könnten. Das Projekt könnte außerdem einen kleinen Beitrag zur Artenvielfalt leisten. Allerdings benötigen Pflanzen auch während der Semesterferien Pflege, und Wasser sowie Werkzeuge verursachen Kosten. Deshalb sollte die Universität nicht nur eine Fläche bereitstellen, sondern gemeinsam mit einer festen studentischen Gruppe einen Pflegeplan entwickeln. Kleine Mitgliedsbeiträge und Kooperationen mit lokalen Gärtnereien könnten die Finanzierung ergänzen.", ["好处具体", "承认现实困难", "建议回应困难"]],
  ["学习方法反思", "写约100词，比较独自学习和小组学习，并说明你会如何组合两种方式。", "Beim alleinigen Lernen kann ich mein Tempo selbst bestimmen und mich gezielt auf persönliche Schwächen konzentrieren. In einer Gruppe erhalte ich dagegen schneller Rückmeldungen und muss meine Gedanken verständlich erklären. Beide Formen haben jedoch Grenzen: Allein übersieht man leichter Fehler, während Gruppentreffen ohne klare Ziele Zeit kosten können. Deshalb bereite ich neue Inhalte zunächst selbstständig vor. Danach treffe ich mich einmal pro Woche mit zwei Kommilitonen, um Fragen zu klären und uns gegenseitig kurze Aufgaben zu stellen.", ["比较双方特点", "使用转折连接", "给出个人组合方案"]]
];

const dictationLessons = dictations.map(([title, text, focus], index) => ({
  id: `foundation-dictation-${String(index + 1).padStart(2, "0")}`,
  title: `基础听写 ${index + 1}：${title}`,
  level: index < 4 ? "A2" : "B1",
  duration: 18,
  objective: "完成整段听写，并检查漏词、词尾、名词大写和标点。",
  contentTitle: title,
  content: [text],
  summary: focus,
  glossary: [],
  questions: [{ id: "summary", type: "open", prompt: `听写后用两句德语回答：${focus}`, modelAnswer: text.split(". ").slice(0, 2).join(". ") + ".", targetWords: 35, checklist: ["回答问题", "使用完整句", "检查动词位置"] }],
  takeaway: "保存本次最常见的三类错误，下次听写前先复习它们。",
  mode: "dictation"
}));

const writingLessons = writingTasks.map(([title, prompt, modelAnswer, checklist], index) => ({
  id: `foundation-writing-${String(index + 1).padStart(2, "0")}`,
  title: `基础写作 ${index + 1}：${title}`,
  level: index < 2 ? "A2" : "B1",
  duration: 25,
  objective: "独立完成短文，再根据任务完成度、结构、语法和语体四项标准复核。",
  contentTitle: title,
  content: [prompt],
  contentLang: "zh",
  summary: "先列三点提纲，再写完整句；完成后检查动词位置、格、词尾和标点。",
  glossary: [],
  questions: [{ id: "draft", type: "open", prompt, modelAnswer, targetWords: index === 0 || index === 5 ? 80 : 110, checklist }],
  takeaway: "把本次出现频率最高的一类错误写入复盘，下一篇只重点消灭这一类。",
  mode: "writing"
}));

const lessonModules = [
  { id: "foundation-dictation", skill: "听写", title: "基础阶段系统听写", stage: "foundation", lessons: dictationLessons },
  { id: "foundation-writing", skill: "写作", title: "基础阶段写作工坊", stage: "foundation", lessons: writingLessons }
];
const libraryModules = [
  { id: "foundation-dictation", skill: "听写", priority: "P0", title: "基础阶段系统听写", units: ["完整听写", "词序相似度", "名词大写", "词尾与标点", "听后概括"], original_task_types: ["逐段听写", "机器初检", "对照原文纠错"] },
  { id: "foundation-writing", skill: "写作", priority: "P0", title: "基础阶段写作工坊", units: ["正式邮件", "叙事描述", "议论表达", "图表描述", "摘要写作"], original_task_types: ["限时写作", "结构初检", "量表自评"] }
];

lessonsData.modules = lessonsData.modules.filter((module) => !lessonModules.some((item) => item.id === module.id)).concat(lessonModules);
libraryData.modules = libraryData.modules.filter((module) => !libraryModules.some((item) => item.id === module.id)).concat(libraryModules);
fs.writeFileSync(lessonsPath, `${JSON.stringify(lessonsData, null, 2)}\n`);
fs.writeFileSync(libraryPath, `${JSON.stringify(libraryData, null, 2)}\n`);
console.log(`Added ${dictationLessons.length} dictation lessons and ${writingLessons.length} writing lessons.`);
