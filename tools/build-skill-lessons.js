const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mcq = (id, prompt, answer, distractors, explanation) => ({ id, type: "mcq", prompt, options: [answer, ...distractors], answer: 0, explanation });
const open = (id, prompt, modelAnswer, checklist) => ({ id, type: "open", prompt, modelAnswer, checklist });
const lesson = (id, title, level, duration, objective, contentTitle, content, summary, glossary, questions, extra = {}) => ({
  id, title, level, duration, objective, contentTitle, content, summary, glossary, questions, takeaway: "把本课中的关键词和句型放进下一次输出练习，比只记住答案更重要。", ...extra
});

const modules = [
  {
    id: "listening-news", skill: "听力", title: "新闻与资讯听力", lessons: [lesson(
      "campus-library-news", "校园新闻：图书馆延长开放时间", "B2", 12,
      "抓住新闻导语、数字、原因和不同说话者的立场。", "Die Bibliothek bleibt länger geöffnet",
      ["Die Universitätsbibliothek verlängert ab dem kommenden Montag ihre Öffnungszeiten. Von Montag bis Freitag können Studierende die Arbeitsplätze künftig bis Mitternacht nutzen. Bisher schloss das Gebäude bereits um 22 Uhr.", "Nach Angaben der Hochschulleitung reagiert die Universität damit auf die gestiegene Nachfrage während der Prüfungszeit. Zunächst gilt die Regelung für drei Monate. Danach soll ausgewertet werden, wie viele Studierende das Angebot tatsächlich nutzen. Die Studierendenvertretung begrüßt den Versuch, fordert jedoch zusätzlich mehr ruhige Gruppenräume. Für die längeren Öffnungszeiten werden zwei weitere Sicherheitskräfte eingesetzt."],
      "先听主旨，再记录时间变化、试行期限、原因和学生代表的补充诉求。",
      [["die Öffnungszeiten", "开放时间"], ["die Nachfrage", "需求"], ["auswerten", "评估、分析"], ["die Studierendenvertretung", "学生代表机构"]],
      [mcq("q1", "图书馆工作日将开放到几点？", "午夜十二点", ["晚上十点", "晚上十一点", "全天开放"], "原文使用 bis Mitternacht。"), mcq("q2", "新规定首先试行多久？", "三个月", ["三周", "一个学期", "一年"], "原文明确说 zunächst gilt die Regelung für drei Monate。"), mcq("q3", "学生代表还提出了什么要求？", "增加安静的小组空间", ["取消安全人员", "周末闭馆", "减少座位"], "学生代表欢迎试行，同时要求更多 ruhige Gruppenräume。"), open("q4", "用两句德语概括这条新闻。", "Die Universitätsbibliothek bleibt werktags künftig bis Mitternacht geöffnet. Nach einer dreimonatigen Testphase wird geprüft, wie stark das Angebot genutzt wurde.", ["包含时间变化", "包含试行期限", "使用完整句子"])],
      { mode: "listening" }
    )]
  },
  {
    id: "listening-interview", skill: "听力", title: "采访与讨论听力", lessons: [lesson(
      "four-day-interview", "采访：四天工作制是否可行", "B2-C1", 14,
      "区分采访者问题、受访者立场、保留意见和建议。", "Ein Gespräch über die Vier-Tage-Woche",
      ["Moderatorin: In Ihrem Unternehmen arbeiten die Beschäftigten seit sechs Monaten an vier Tagen. Ist das Experiment gelungen?", "Personalchefin: Insgesamt ja. Die Zahl der bearbeiteten Aufträge ist nahezu gleich geblieben, während die Krankmeldungen zurückgingen. Allerdings haben wir nicht einfach einen Arbeitstag gestrichen. Wir haben Besprechungen verkürzt und Zuständigkeiten klarer verteilt.", "Moderatorin: Lässt sich dieses Modell auf jede Branche übertragen?", "Personalchefin: Das bezweifle ich. In der Pflege oder im Einzelhandel müssen Öffnungs- und Betreuungszeiten gesichert bleiben. Dort wären zusätzliche Teams nötig. Ich empfehle deshalb keine allgemeine Vorschrift, sondern zeitlich begrenzte Versuche mit klaren Kriterien."],
      "受访者总体肯定试验，但强调组织调整，并反对把结果不加区分地推广到所有行业。",
      [["die Krankmeldung", "病假报告"], ["die Zuständigkeit", "职责"], ["übertragen auf", "推广、适用于"], ["zeitlich begrenzt", "有时间限制的"]],
      [mcq("q1", "哪些指标在试验中发生了变化？", "订单量基本稳定，病假减少", ["订单量大幅下降", "病假增加", "工作时间恢复为五天"], "受访者对比了稳定的订单量和下降的病假。"), mcq("q2", "企业为试验做了什么组织调整？", "缩短会议并明确职责", ["降低工资", "取消团队合作", "增加每日工时"], "她强调并非简单删掉一天。"), mcq("q3", "受访者对全面推广持什么态度？", "谨慎，主张先做有标准的试验", ["完全支持立即立法", "完全反对任何试验", "认为行业差异不重要"], "她使用 Das bezweifle ich 并提出 begrenzte Versuche。"), open("q4", "用德语写出受访者的核心保留意见。", "Das Modell lässt sich nicht ohne Weiteres auf Branchen übertragen, in denen Öffnungs- oder Betreuungszeiten dauerhaft gesichert werden müssen.", ["指出不可直接推广", "提到行业条件", "使用正式表达"])],
      { mode: "listening" }
    )]
  },
  {
    id: "reading-press", skill: "阅读", title: "报刊与评论阅读", lessons: [lesson(
      "repair-reading", "评论阅读：维修权如何真正有效", "B2-C1", 15,
      "定位主旨、论据、限制条件和作者建议。", "Reparieren muss sich auch lohnen",
      ["Ein Recht auf Reparatur klingt überzeugend: Geräte sollen länger genutzt und wertvolle Rohstoffe geschont werden. Eine gesetzliche Regel allein reicht jedoch nicht aus. Wenn Ersatzteile fast so teuer wie ein neues Gerät sind oder technische Informationen fehlen, bleibt das Recht in der Praxis wirkungslos.", "Hersteller sollten deshalb bereits bei der Entwicklung berücksichtigen, ob einzelne Bauteile ausgetauscht werden können. Zugleich brauchen unabhängige Werkstätten einen verlässlichen Zugang zu Ersatzteilen und Anleitungen. Für Verbraucherinnen und Verbraucher wäre eine verständliche Kennzeichnung hilfreich, die Reparierbarkeit und voraussichtliche Kosten sichtbar macht. Nicht jede Reparatur ist ökologisch sinnvoll; bei sehr alten, energieintensiven Geräten kann ein Austausch die bessere Lösung sein. Entscheidend ist daher nicht eine einzige Vorschrift, sondern ein abgestimmtes System."],
      "文章支持维修权，但认为设计、备件、信息、价格和生态评估必须共同发挥作用。",
      [["sich lohnen", "值得、划算"], ["das Ersatzteil", "备件"], ["die Reparierbarkeit", "可维修性"], ["abgestimmt", "相互协调的"]],
      [mcq("q1", "作者的中心观点是什么？", "维修权需要一套相互配合的措施", ["所有旧设备都必须维修", "只需降低新设备价格", "独立维修店应被取消"], "末句用 ein abgestimmtes System 概括全文。"), mcq("q2", "哪种情况会让维修权失效？", "备件昂贵或缺少技术信息", ["设备可以拆卸", "维修费用透明", "消费者获得明确标识"], "第一段直接列出了两个障碍。"), mcq("q3", "作者为什么没有主张维修一切旧设备？", "部分老旧设备能耗过高", ["旧设备没有备件", "消费者不喜欢维修", "法律禁止维修"], "这是文章主动提出的限制条件。"), open("q4", "用不超过三句德语概括文章的论证结构。", "Der Text befürwortet ein Recht auf Reparatur, weist aber auf praktische Hindernisse hin. Er fordert reparierbare Produkte, zugängliche Ersatzteile und transparente Informationen. Bei sehr alten Geräten müsse dennoch der Energieverbrauch berücksichtigt werden.", ["观点与限制并存", "至少两项措施", "不照抄整段"])])]
  },
  {
    id: "reading-long-sentence", skill: "阅读", title: "长难句拆解", lessons: [lesson(
      "sentence-fields", "长句定位：先找谓语框架", "C1", 14,
      "识别有限动词、从句边界、关系词和句子主干。", "Ein Satz, vier Ebenen",
      ["Die Kommission, die im vergangenen Jahr eingesetzt wurde, um zu prüfen, unter welchen Bedingungen die bislang nur in einzelnen Städten erprobte Regelung auf das gesamte Bundesgebiet übertragen werden könnte, kommt zu dem Schluss, dass eine sofortige Einführung zwar politisch attraktiv wäre, wegen der erheblichen regionalen Unterschiede jedoch mehr Probleme schaffen als lösen würde."],
      "主句是 Die Kommission kommt zu dem Schluss；关系从句解释 Kommission，um-zu 结构说明目的，dass 从句给出结论。",
      [["eingesetzt werden", "被设立"], ["erproben", "试行"], ["übertragen", "推广"], ["zu dem Schluss kommen", "得出结论"]],
      [mcq("q1", "整句主句的有限动词是什么？", "kommt", ["wurde", "könnte", "würde"], "去掉插入成分后，主干是 Die Kommission kommt zu dem Schluss。"), mcq("q2", "um zu prüfen 表示什么功能？", "委员会成立的目的", ["规则的结果", "作者的让步", "地区差异的原因"], "um ... zu 标记目的。"), mcq("q3", "dass 从句中的核心判断是什么？", "立即实施可能制造更多问题", ["委员会尚未成立", "所有城市都已试行", "地区差异已经消失"], "zwar ... jedoch 连接吸引力与潜在问题。"), open("q4", "把长句拆成三至四个较短的德语句子。", "Die Kommission wurde im vergangenen Jahr eingesetzt. Sie prüfte die Voraussetzungen für eine bundesweite Übertragung der Regelung. Eine sofortige Einführung wäre politisch attraktiv. Wegen regionaler Unterschiede könnte sie jedoch mehr Probleme schaffen als lösen.", ["保留原意", "每句有明确谓语", "逻辑关系清楚"])])]
  },
  {
    id: "translation-de-zh", skill: "德译汉", title: "德译汉", lessons: [lesson(
      "translation-mediation", "德译汉：信息公开与公众理解", "B2-C1", 18,
      "处理长定语、被动态、逻辑连接和名词化表达。", "Ausgangstext",
      ["Die Veröffentlichung umfangreicher Datensätze führt nicht automatisch zu größerer Transparenz. Informationen können nur dann sinnvoll eingeordnet werden, wenn zugleich erklärt wird, nach welchen Kriterien sie erhoben wurden und welche Grenzen ihre Aussagekraft hat. Öffentliche Einrichtungen stehen daher vor der Aufgabe, Daten nicht lediglich bereitzustellen, sondern sie so aufzubereiten, dass auch Personen ohne Fachkenntnisse zentrale Zusammenhänge nachvollziehen können."],
      "翻译时先还原三个逻辑层次：否定自动关系、提出条件、说明公共机构的任务。",
      [["einordnen", "结合背景理解、归类"], ["die Aussagekraft", "说明力"], ["bereitstellen", "提供"], ["aufbereiten", "整理加工"]],
      [mcq("q1", "nur dann ..., wenn ... 表达什么关系？", "必要条件", ["单纯时间先后", "无条件让步", "目的"], "只有满足 wenn 从句中的条件，主句结果才成立。"), mcq("q2", "nicht lediglich ..., sondern ... 应如何处理？", "不仅……而且要……", ["虽然……但是……", "因为……所以……", "要么……要么……"], "结构对前项作补充和修正。"), open("q3", "完成整段中文翻译。", "公布大量数据并不会自动带来更高的透明度。只有同时说明数据依据何种标准收集、其说明力存在哪些局限，人们才能合理理解这些信息。因此，公共机构面临的任务不只是提供数据，还要对其进行整理说明，使不具备专业知识的人也能理解其中的核心联系。", ["三层逻辑完整", "被动态处理自然", "不逐词硬译"]), open("q4", "把第一句换一种简洁中文表达。", "数据公开的数量增加，并不必然意味着透明度提高。", ["保留否定必然关系", "中文表达自然"])])]
  },
  {
    id: "translation-zh-de", skill: "汉译德", title: "汉译德", lessons: [lesson(
      "translation-policy", "汉译德：高校学习支持", "B2-C1", 20,
      "把中文意合关系改写为清楚的德语从句与名词结构。", "待译文本",
      ["越来越多的高校开始为新生提供学习咨询。然而，咨询服务只有在学生能够方便地获取信息、预约流程足够简单并且反馈得到及时处理时，才能真正发挥作用。因此，高校不应只关注服务数量，还应定期评估学生是否从中受益。"],
      "先确定主干，再分别用 allerdings、nur wenn、sondern auch 处理转折、条件和递进。",
      [["die Studienberatung", "学习咨询"], ["niedrigschwellig", "易于获取的"], ["die Rückmeldung", "反馈"], ["regelmäßig evaluieren", "定期评估"]],
      [mcq("q1", "“只有在……时才……”最适合哪种结构？", "nur dann, wenn", ["obwohl", "sowohl ... als auch", "je ... desto"], "nur dann, wenn 明确必要条件。"), mcq("q2", "“不应只……还应……”最适合哪种结构？", "nicht nur ..., sondern auch", ["weder ... noch", "entweder ... oder", "zwar ... aber"], "该结构表达递进补充。"), open("q3", "完成整段德语翻译。", "Immer mehr Hochschulen bieten Studienanfängerinnen und Studienanfängern eine Lernberatung an. Die Angebote können jedoch nur dann wirksam werden, wenn Informationen leicht zugänglich sind, die Terminvereinbarung unkompliziert ist und Rückmeldungen rechtzeitig bearbeitet werden. Hochschulen sollten daher nicht nur auf die Zahl der Angebote achten, sondern auch regelmäßig prüfen, ob Studierende tatsächlich davon profitieren.", ["条件关系明确", "并列成分一致", "语体正式自然"]), open("q4", "用名词化方式改写“定期评估服务”。", "die regelmäßige Evaluation der Beratungsangebote", ["使用第二格或 von 结构", "名词首字母大写"])],
      { contentLang: "zh-CN" }
    )]
  },
  {
    id: "writing-argument", skill: "写作", title: "议论写作", lessons: [lesson(
      "argument-online-lecture", "议论写作：大型讲座是否应线上化", "B2-C1", 22,
      "写出立场、让步、限制条件和可执行建议。", "Schreibauftrag",
      ["An Ihrer Universität wird diskutiert, ob große Vorlesungen dauerhaft nur noch online angeboten werden sollen. Verfassen Sie eine Stellungnahme von etwa 160 Wörtern. Gehen Sie auf Zugänglichkeit, Austausch, Lernorganisation und technische Voraussetzungen ein."],
      "不要只列优缺点；先明确判断，再用条件限定自己的主张。",
      [["einerseits ... andererseits", "一方面……另一方面"], ["unter der Voraussetzung, dass", "在……前提下"], ["nicht außer Acht lassen", "不忽视"], ["abschließend", "最后、综上"]],
      [mcq("q1", "哪一句最适合作为有条件的中心论点？", "Online-Vorlesungen sind sinnvoll, sofern Austausch und Betreuung gesichert bleiben.", ["Online ist modern.", "Alle Vorlesungen müssen sofort digital werden.", "Dieses Thema hat Vor- und Nachteile."], "中心论点既表态又给出边界。"), mcq("q2", "正文最合理的组织顺序是什么？", "立场—理由—让步—建议", ["例子—标题—问候—结论", "反复陈述同一观点", "只写反方观点"], "议论文需要清晰推进。"), open("q3", "写一个包含让步关系的开头段。", "Digitale Großvorlesungen erleichtern vielen Studierenden den Zugang zu Lehrinhalten. Obwohl sie zeitliche und räumliche Flexibilität bieten, sollten sie Präsenzformate nicht vollständig ersetzen, weil unmittelbare Rückfragen und sozialer Austausch für den Lernerfolg wichtig bleiben.", ["明确主题", "使用让步结构", "包含自己的判断"]), open("q4", "写出一条可执行建议。", "Die Universität sollte Vorlesungen digital aufzeichnen, zugleich aber regelmäßige Präsenztermine für Fragen und Diskussionen anbieten.", ["措施具体", "兼顾两方面", "使用正式语体"])])]
  },
  {
    id: "writing-summary", skill: "写作", title: "摘要写作", lessons: [lesson(
      "summary-data", "摘要写作：数据与透明度", "B2-C1", 18,
      "删除例子和修饰，保留主张、条件与结论。", "Ausgangstext für eine Zusammenfassung",
      ["Öffentliche Datenportale werden häufig als Beweis für transparente Verwaltung dargestellt. Ihre bloße Existenz sagt jedoch wenig darüber aus, ob Bürgerinnen und Bürger die veröffentlichten Informationen tatsächlich nutzen können. Unübersichtliche Tabellen, fehlende Erläuterungen und unbekannte Erhebungsmethoden erschweren die Einordnung. Transparenz entsteht deshalb erst, wenn Daten verständlich erklärt, regelmäßig aktualisiert und mit klaren Zuständigkeiten verbunden werden. Portale sind somit ein wichtiges Werkzeug, aber kein Ersatz für nachvollziehbare Entscheidungen und direkte Auskunftsmöglichkeiten."],
      "摘要应保留“门户有价值但不充分”这一核心判断，以及实现透明度的三个条件。",
      [["die bloße Existenz", "仅仅存在"], ["die Erhebungsmethode", "采集方法"], ["die Einordnung", "理解、判断"], ["nachvollziehbar", "可理解、可追溯的"]],
      [mcq("q1", "哪一项不是摘要必须保留的信息？", "表格是一个具体例子", ["门户本身不足以保证透明", "数据需要解释和更新", "决策仍需可追溯"], "摘要可以删去用于说明障碍的具体例子。"), mcq("q2", "作者对数据门户的态度是什么？", "肯定其作用，但反对把它当成充分条件", ["完全否定", "认为门户能自动解决问题", "没有任何判断"], "末句明确给出有限肯定。"), open("q3", "用两至三句德语写出摘要。", "Der Text macht deutlich, dass öffentliche Datenportale allein noch keine Transparenz schaffen. Daten müssen verständlich erläutert, aktualisiert und klaren Zuständigkeiten zugeordnet werden. Digitale Portale können nachvollziehbare Entscheidungen und direkte Auskünfte daher ergänzen, aber nicht ersetzen.", ["不加入个人观点", "覆盖核心条件", "篇幅明显缩短"]), open("q4", "写一个合适的摘要开头。", "Der Beitrag untersucht, unter welchen Bedingungen öffentliche Datenportale zu transparenter Verwaltung beitragen können.", ["说明文本主题", "避免 Ich 形式"])])]
  },
  {
    id: "writing-register", skill: "写作", title: "正式语体写作", lessons: [lesson(
      "formal-email", "正式邮件：申请延长提交期限", "B2", 15,
      "用礼貌、具体且不过度卑微的方式提出请求。", "Kommunikative Situation",
      ["Sie können eine Seminararbeit wegen einer kurzfristigen Erkrankung nicht fristgerecht abgeben. Schreiben Sie der Dozentin eine formelle E-Mail. Nennen Sie den Anlass, schlagen Sie einen realistischen neuen Termin vor und bieten Sie einen Nachweis an."],
      "正式邮件需要明确主题、简短说明、具体请求、可行日期和礼貌结尾。",
      [["fristgerecht", "按时、在期限内"], ["um eine Fristverlängerung bitten", "请求延期"], ["der Nachweis", "证明"], ["mit freundlichen Grüßen", "谨致问候"]],
      [mcq("q1", "哪一句请求最得体？", "Ich möchte Sie daher um eine Verlängerung der Abgabefrist bis zum 18. Juni bitten.", ["Sie müssen mir mehr Zeit geben.", "Ich schaffe es halt nicht.", "Vielleicht irgendwann nächste Woche?"], "正式请求应具体、礼貌并说明日期。"), mcq("q2", "邮件主题最合适的是哪一项？", "Bitte um Verlängerung der Abgabefrist – Seminararbeit", ["Hallo", "Wichtig!!!", "Meine Krankheit"], "主题行应让收件人立即理解事项。"), open("q3", "写出完整邮件。", "Betreff: Bitte um Verlängerung der Abgabefrist – Seminararbeit\n\nSehr geehrte Frau Dr. Weber,\naufgrund einer kurzfristigen Erkrankung kann ich meine Seminararbeit leider nicht fristgerecht einreichen. Ich möchte Sie daher um eine Verlängerung der Abgabefrist bis zum 18. Juni bitten. Eine ärztliche Bescheinigung reiche ich auf Wunsch gern nach.\n\nVielen Dank für Ihr Verständnis.\nMit freundlichen Grüßen\nLi Ming", ["主题明确", "请求具体", "称呼与结尾正式"]), open("q4", "把“我病了，所以交不了”改成正式表达。", "Aufgrund einer kurzfristigen Erkrankung ist es mir leider nicht möglich, die Arbeit fristgerecht einzureichen.", ["使用 aufgrund", "避免口语化", "语气客观"])])]
  },
  {
    id: "country-politics", skill: "国情", title: "政治制度与公共生活", lessons: [lesson(
      "federal-system", "德国联邦制度：谁负责什么", "B2", 16,
      "理解联邦议院、联邦参议院、联邦政府和各州之间的基本关系。", "Bund und Länder",
      ["Deutschland ist ein Bundesstaat. Politische Aufgaben werden zwischen dem Bund und den sechzehn Ländern verteilt. Der Deutsche Bundestag wird vom Volk gewählt und beschließt gemeinsam mit dem Bundesrat einen großen Teil der Bundesgesetze. Im Bundesrat wirken die Regierungen der Länder an der Gesetzgebung mit.", "Die Bundesregierung leitet die Politik auf Bundesebene. Bildung und Kultur liegen dagegen weitgehend in der Verantwortung der Länder. Deshalb können sich Schulformen, Prüfungsregeln oder Hochschulgesetze regional unterscheiden. Das Bundesverfassungsgericht in Karlsruhe prüft, ob staatliches Handeln mit dem Grundgesetz vereinbar ist."],
      "关键不是死记机构名称，而是理解选举、立法、行政、州参与和宪法审查的分工。",
      [["der Bundesstaat", "联邦制国家"], ["der Bundesrat", "联邦参议院"], ["an der Gesetzgebung mitwirken", "参与立法"], ["vereinbar mit", "与……相符"]],
      [mcq("q1", "哪个机构由选民直接选举？", "德国联邦议院", ["联邦参议院", "联邦宪法法院", "联邦政府"], "Bundestag wird vom Volk gewählt。"), mcq("q2", "联邦参议院由谁参与组成？", "各州政府", ["大学校长", "联邦法院法官", "各城市市长"], "它代表各州政府参与联邦立法。"), mcq("q3", "教育和文化主要由谁负责？", "各州", ["欧盟", "联邦宪法法院", "联邦总统个人"], "因此不同州的教育规定可能不同。"), open("q4", "用三句德语解释联邦议院与联邦参议院的区别。", "Der Bundestag wird vom Volk gewählt und berät Bundesgesetze. Im Bundesrat sind die Regierungen der Länder vertreten. Über den Bundesrat wirken die Länder an der Gesetzgebung des Bundes mit.", ["说明选举方式", "说明代表对象", "说明立法作用"])])]
  },
  {
    id: "country-history", skill: "国情", title: "历史脉络", lessons: [lesson(
      "postwar-history", "1945 年后的德国：分裂与统一", "B2", 16,
      "建立第二次世界大战后至德国统一的基本时间线。", "Von der Teilung zur Einheit",
      ["Nach dem Ende des Zweiten Weltkriegs wurde Deutschland 1945 in Besatzungszonen aufgeteilt. 1949 entstanden zwei deutsche Staaten: die Bundesrepublik Deutschland im Westen und die Deutsche Demokratische Republik im Osten. Berlin blieb ein besonderer Brennpunkt der Teilung.", "1961 ließ die DDR die Berliner Mauer errichten. Sie trennte West-Berlin vom Ostteil der Stadt und vom Umland. Im Herbst 1989 führten friedliche Proteste und politische Veränderungen zur Öffnung der Grenze. Am 9. November fiel die Mauer. Am 3. Oktober 1990 trat die DDR der Bundesrepublik bei; dieser Tag wird als Tag der Deutschen Einheit gefeiert."],
      "时间线：1945 占领区，1949 两国，1961 柏林墙，1989 开放边境，1990 统一。",
      [["die Besatzungszone", "占领区"], ["die Teilung", "分裂"], ["die friedliche Revolution", "和平革命"], ["beitreten", "加入"]],
      [mcq("q1", "两个德国国家成立于哪一年？", "1949", ["1945", "1961", "1990"], "1949 年分别成立联邦德国和民主德国。"), mcq("q2", "柏林墙开放发生于何时？", "1989 年 11 月 9 日", ["1961 年 8 月", "1990 年 10 月 3 日", "1949 年 5 月"], "原文将其与 1989 年秋季和平抗议相连。"), mcq("q3", "10 月 3 日纪念什么？", "德国统一", ["柏林墙建立", "欧盟成立", "基本法通过"], "这是 Tag der Deutschen Einheit。"), open("q4", "用德语写出五个关键年份及其事件。", "1945: Aufteilung in Besatzungszonen; 1949: Gründung von BRD und DDR; 1961: Bau der Berliner Mauer; 1989: Öffnung der Mauer; 1990: deutsche Einheit.", ["年份正确", "事件对应", "表达简洁"])])]
  },
  {
    id: "country-dach", skill: "国情", title: "德语国家与地区", lessons: [lesson(
      "dach-comparison", "D-A-CH：共同语言与地区差异", "B2", 15,
      "认识德国、奥地利、瑞士的制度与语言差异，避免把德语区等同于德国。", "Deutsch ist plurizentrisch",
      ["Deutsch ist eine plurizentrische Sprache. Deutschland, Österreich und die Schweiz verfügen jeweils über eigene Standardvarianten. So heißt ein Brötchen in Österreich häufig Semmel, während in der Schweiz das Wort Gipfeli für ein Croissant üblich ist. Solche Unterschiede sind keine Fehler, sondern regional etablierte Formen.", "Auch die politischen Systeme unterscheiden sich. Österreich ist wie Deutschland eine Bundesrepublik. Die Schweiz ist ein Bundesstaat mit starker direkter Demokratie und vier Landessprachen: Deutsch, Französisch, Italienisch und Rätoromanisch. In der deutschsprachigen Schweiz wird im Alltag häufig Dialekt gesprochen, während die Standardsprache vor allem schriftlich und in formellen Situationen verwendet wird."],
      "德语是多中心语言；标准变体、日常词汇和语言使用场景存在地区差异。",
      [["plurizentrisch", "多中心的"], ["die Standardvariante", "标准变体"], ["die direkte Demokratie", "直接民主"], ["Rätoromanisch", "罗曼什语"]],
      [mcq("q1", "plurizentrisch 在这里是什么意思？", "存在多个被认可的标准中心", ["只有德国标准正确", "所有地区只说方言", "德语没有书面标准"], "德国、奥地利、瑞士均有自己的标准变体。"), mcq("q2", "瑞士共有几种国家语言？", "四种", ["一种", "两种", "三种"], "原文列出德、法、意和罗曼什语。"), mcq("q3", "瑞士德语区的标准德语主要用于什么场景？", "书面和正式场景", ["只在家庭使用", "完全不用", "只在国外使用"], "日常口语常用方言。"), open("q4", "用德语解释地区变体为什么不是错误。", "Regionale Varianten sind keine Fehler, weil sie in ihrer jeweiligen Sprachgemeinschaft etabliert sind und dort zur Standardsprache oder zum üblichen Wortschatz gehören.", ["指出社群认可", "避免价值判断", "使用因果关系"])])]
  },
  {
    id: "society-current", skill: "主题知识", title: "当代社会议题", lessons: [lesson(
      "housing-debate", "社会议题：城市住房负担", "B2-C1", 17,
      "用德语理解住房政策讨论中的因果、利益冲突与政策组合。", "Bezahlbares Wohnen",
      ["In vielen wachsenden Städten steigen die Mieten schneller als die Einkommen. Besonders Haushalte mit niedrigem oder mittlerem Einkommen müssen einen großen Teil ihres Budgets für Wohnkosten ausgeben. Die Ursachen sind vielfältig: Es fehlen Wohnungen, Bauland ist knapp, Baukosten steigen und Genehmigungsverfahren dauern lange.", "Einzelne Maßnahmen lösen das Problem kaum. Neue Wohnungen können das Angebot erhöhen, benötigen aber Zeit und geeignete Flächen. Mietregeln schützen bestehende Haushalte, schaffen jedoch nicht automatisch zusätzlichen Wohnraum. Fachleute schlagen deshalb häufig eine Kombination vor: schnelleres Bauen, langfristige Bodenpolitik, gezielte Unterstützung und bessere Verkehrsanbindungen zwischen Zentrum und Umland."],
      "文章拒绝单一答案，主张把住房建设、租户保护、土地政策、补贴和交通结合起来。",
      [["der Wohnraum", "住房空间"], ["das Bauland", "建设用地"], ["das Genehmigungsverfahren", "审批程序"], ["das Umland", "城市周边地区"]],
      [mcq("q1", "文中没有把房租上涨归因于什么？", "居民不愿搬家", ["住房不足", "建设用地紧张", "建设成本提高"], "原文没有讨论居民搬家意愿。"), mcq("q2", "作者如何评价单一政策？", "通常不足以解决问题", ["总能立即见效", "应该全部取消", "只需要租金规定"], "第二段首句直接概括。"), mcq("q3", "建议的政策组合包括什么？", "建设、土地、补贴与交通", ["只建设豪宅", "取消公共交通", "停止所有审批"], "结尾列出多项相互补充的措施。"), open("q4", "用德语写一段平衡住房建设与租户保护的建议。", "Städte sollten den Wohnungsbau beschleunigen, ohne den Schutz bestehender Mieterinnen und Mieter zu schwächen. Ergänzend sind eine langfristige Bodenpolitik und bessere Verkehrsverbindungen nötig, damit nicht nur zentrale Stadtteile als Wohnorte infrage kommen.", ["提出至少两项措施", "体现平衡", "使用 ohne 或 damit"])])]
  },
  {
    id: "literature-language", skill: "专业拓展", title: "文学与语言学基础", lessons: [lesson(
      "narrative-perspective", "文学阅读：叙述视角如何改变信息", "B2-C1", 18,
      "区分第一人称、人物视角与全知叙述，并分析其阅读效果。", "Wer weiß was?",
      ["Die Erzählperspektive bestimmt, welche Informationen Leserinnen und Leser erhalten und wie sicher diese Informationen wirken. Ein Ich-Erzähler berichtet aus der eigenen Wahrnehmung. Er kann glaubwürdig erscheinen, kennt aber nicht automatisch die Gedanken anderer Figuren und kann sich irren.", "Bei einer personalen Erzählweise folgt der Text meist einer Figur, ohne dass diese selbst als Ich spricht. Eine auktoriale Erzählinstanz kann dagegen Figuren, Zeiten und Orte überblicken und das Geschehen kommentieren. Moderne Texte wechseln Perspektiven häufig bewusst. Dadurch können Widersprüche entstehen, die nicht als Fehler, sondern als Teil der literarischen Gestaltung gelesen werden müssen."],
      "分析叙述视角时要问：谁在说、谁在感知、谁知道什么、文本是否评论事件。",
      [["die Erzählperspektive", "叙述视角"], ["glaubwürdig", "可信的"], ["auktorial", "全知叙述的"], ["die Gestaltung", "艺术构造、表现方式"]],
      [mcq("q1", "第一人称叙述者有什么基本限制？", "不一定知道其他人物的思想", ["不能描述过去", "必须说真话", "不能表达感受"], "第一人称只拥有自身感知范围。"), mcq("q2", "全知叙述最典型的能力是什么？", "跨人物、时间和地点进行观察评论", ["只复述对话", "完全不作评价", "只能跟随一个人物"], "auktoriale Erzählinstanz 可以 überblicken und kommentieren。"), mcq("q3", "视角矛盾应当如何理解？", "可能是有意的文学构造", ["必然是印刷错误", "证明作者不懂语法", "与阅读无关"], "现代文本可能用矛盾制造不可靠性或多重解释。"), open("q4", "用德语说明分析叙述视角时应提出的两个问题。", "Man sollte fragen, wer das Geschehen wahrnimmt und über welches Wissen diese Instanz verfügt. Außerdem ist zu prüfen, ob der Text die Ereignisse kommentiert oder nur aus der Sicht einer Figur darstellt.", ["至少两个分析问题", "使用专业词汇", "表达完整"])])]
  }
];

const sourceModules = JSON.parse(fs.readFileSync(path.join(root, "data", "skills-library.json"), "utf8")).modules;
for (const module of modules) {
  if (!sourceModules.some((source) => source.id === module.id)) throw new Error(`Unknown skill module: ${module.id}`);
  for (const item of module.lessons) {
    if (!item.content.length || item.questions.length < 4) throw new Error(`Incomplete lesson: ${item.id}`);
  }
}
if (modules.length !== sourceModules.length) throw new Error(`Expected ${sourceModules.length} modules, got ${modules.length}`);

const result = {
  version: "1.0.0",
  copyrightNote: "全部训练文本、题目、参考表达与中文说明均为本站原创；浏览器语音仅用于朗读本站原创听力稿。",
  modules
};
fs.writeFileSync(path.join(root, "data", "skill-lessons.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ modules: modules.length, lessons: modules.reduce((sum, module) => sum + module.lessons.length, 0), questions: modules.flatMap((module) => module.lessons).reduce((sum, item) => sum + item.questions.length, 0) }, null, 2));
