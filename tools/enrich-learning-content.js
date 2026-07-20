const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const writeJson = (relativePath, value) => fs.writeFileSync(
  path.join(root, relativePath),
  `${JSON.stringify(value, null, 2)}\n`,
  "utf8"
);

const vocab = readJson("data/vocab-library.json");
const advanced = vocab.stages.find((stage) => stage.id === "advanced");
const exampleFrames = [
  (phrase) => [`Der Ausdruck „${phrase}“ wird häufig in wissenschaftlichen Texten verwendet.`, `“${phrase}”这一表达经常用于学术文本。`],
  (phrase) => [`In formellen Diskussionen begegnet man oft der Wendung „${phrase}“.`, `在正式讨论中经常会遇到“${phrase}”这一说法。`],
  (phrase) => [`Die Formulierung „${phrase}“ eignet sich besonders für eine präzise Argumentation.`, `“${phrase}”这一表述尤其适合严谨论证。`],
  (phrase) => [`Beim Schreiben kann „${phrase}“ einen Zusammenhang klarer ausdrücken.`, `写作时，“${phrase}”可以更清楚地表达关系。`],
  (phrase) => [`Wer differenziert formulieren möchte, kann „${phrase}“ verwenden.`, `想进行有层次的表达时，可以使用“${phrase}”。`],
  (phrase) => [`Die Wendung „${phrase}“ gehört zum gehobenen schriftsprachlichen Wortschatz.`, `“${phrase}”属于较高级的书面语词汇。`]
];

const collocationCorrections = new Map([
  ["prüfen inwiefern etwas gilt", "prüfen, inwiefern etwas gilt"],
  ["unter der Voraussetzung dass", "unter der Voraussetzung, dass"]
]);

const advancedExamples = {
  argumentation: [
    ["In ihrer Stellungnahme vertritt die Autorin die Auffassung, dass Hochschulen mehr Beratungsangebote benötigen.", "作者在声明中认为，高校需要提供更多咨询服务。"],
    ["Die Behauptung, digitale Lehre sei grundsätzlich unpersönlich, greift zu kurz.", "认为数字教学必然缺乏人情味的主张过于片面。"],
    ["Für die Reform lieferte die Kommission eine überzeugende Begründung.", "委员会为这项改革给出了令人信服的理由。"],
    ["Mehrere Fachverbände erhoben Einwand gegen die geplante Verkürzung der Frist.", "多个专业协会对缩短期限的计划提出异议。"],
    ["Aus den vorliegenden Daten lässt sich noch keine eindeutige Schlussfolgerung ziehen.", "根据现有数据还无法得出明确结论。"],
    ["Die Entscheidung ist nachvollziehbar, weil alle Kriterien offengelegt wurden.", "由于所有标准都已公开，这一决定是可以理解的。"],
    ["Für diese These fehlen bislang stichhaltige Argumente.", "目前还缺少支持这一论点的有力论据。"],
    ["Neue Messungen konnten die ursprüngliche These eindeutig widerlegen.", "新的测量结果能够明确驳斥最初的论点。"],
    ["Die Projektleitung räumte Fehler bei der Datenerhebung ein.", "项目负责人承认数据采集过程中存在错误。"],
    ["Der Bericht hebt die Bedeutung langfristiger Finanzierung hervor.", "报告强调长期资金保障的重要性。"],
    ["Die Studie prüft, inwiefern kleinere Hochschulen von der Regelung profitieren.", "该研究考察规模较小的高校能在何种程度上从这一规定中受益。"],
    ["Wir stimmen dem Vorschlag unter der Voraussetzung zu, dass die Kosten transparent bleiben.", "我们同意该建议，前提是费用保持透明。"]
  ],
  "logical-connectors": [
    ["Die Nachfrage stieg deutlich; infolgedessen wurden zusätzliche Kurse angeboten.", "需求明显上升，因此增开了课程。"],
    ["Die Großstädte wachsen weiter; demgegenüber verlieren manche ländlichen Regionen Einwohner.", "大城市继续增长，与此相对，一些农村地区正在失去人口。"],
    ["Die Stichprobe ist klein; gleichwohl liefert die Untersuchung wichtige Hinweise.", "样本虽然较小，但该研究仍提供了重要线索。"],
    ["Alle Kriterien wurden erfüllt; demnach kann der Antrag bewilligt werden.", "所有标准均已满足，据此可以批准申请。"],
    ["Eine Verschiebung wäre riskant, zumal bereits mehrere Verträge geschlossen wurden.", "推迟会有风险，尤其是已经签订了多份合同。"],
    ["Die Daten dürfen verwendet werden, sofern alle Betroffenen eingewilligt haben.", "只要所有相关人员均已同意，这些数据就可以使用。"],
    ["Die erste Gruppe befürwortet die Reform, wohingegen die zweite weitere Prüfungen verlangt.", "第一组赞成改革，而第二组要求进一步审查。"],
    ["Die Maßnahme war erfolgreich, wenngleich ihre Wirkung regional unterschiedlich ausfiel.", "该措施取得了成效，尽管其影响因地区而异。"],
    ["Ohne Wörterbuch konnte er den Text kaum lesen, geschweige denn präzise übersetzen.", "没有词典，他几乎无法阅读该文本，更不用说准确翻译了。"],
    ["Das Projekt überzeugt nicht zuletzt wegen seiner klaren Erfolgskriterien.", "该项目很有说服力，尤其是因为它制定了明确的成功标准。"],
    ["Die erste Studie untersucht Kosten; im Gegensatz dazu konzentriert sich die zweite auf soziale Folgen.", "第一项研究考察成本，与此相反，第二项研究关注社会影响。"],
    ["Die Verhandlungen dauern an; unterdessen bereiten die Fachgruppen einen Kompromiss vor.", "谈判仍在继续；与此同时，专业小组正在准备折中方案。"]
  ],
  "society-demography": [
    ["Der demografische Wandel verändert den Bedarf an Pflege und öffentlichem Nahverkehr.", "人口结构变化正在改变养老护理和公共交通方面的需求。"],
    ["Die Alterung der Gesellschaft stellt Kommunen vor neue Aufgaben.", "社会老龄化给地方政府带来了新的任务。"],
    ["Eine dauerhaft niedrige Geburtenrate wirkt sich langfristig auf den Arbeitsmarkt aus.", "长期低出生率会对劳动力市场产生长远影响。"],
    ["Gezielte Weiterbildung kann dazu beitragen, dem Fachkräftemangel entgegenzuwirken.", "有针对性的继续教育有助于缓解专业人才短缺。"],
    ["Kostenlose Lernmaterialien können die Chancengleichheit im Studium fördern.", "免费的学习资料可以促进大学学习中的机会平等。"],
    ["Hohe Wohnkosten verschärfen die soziale Ungleichheit in wachsenden Städten.", "高昂的住房成本加剧了成长型城市中的社会不平等。"],
    ["Barrierefreie Angebote ermöglichen Menschen mit Behinderungen gesellschaftliche Teilhabe.", "无障碍服务使残障人士能够参与社会生活。"],
    ["Flexible Arbeitszeiten verbessern die Vereinbarkeit von Familie und Beruf.", "灵活的工作时间有助于兼顾家庭与职业。"],
    ["Viele Studierende müssen ihren Lebensunterhalt durch Nebenjobs bestreiten.", "许多大学生必须通过兼职维持生活。"],
    ["Die Stadt unterstützt bedürftige Haushalte mit einem Heizkostenzuschuss.", "该市通过取暖补贴帮助有需要的家庭。"],
    ["Ein undurchsichtiges Auswahlverfahren kann bestimmte Gruppen benachteiligen.", "不透明的选拔程序可能使某些群体处于不利地位。"],
    ["Kleine Gemeinden sind häufig auf die Zusammenarbeit mit Nachbarorten angewiesen.", "小型市镇往往需要依赖与邻近地区的合作。"]
  ],
  "migration-integration": [
    ["Die Debatte über Zuwanderung sollte zwischen kurzfristigem Bedarf und langfristiger Integration unterscheiden.", "关于移民流入的讨论应区分短期需求与长期融入。"],
    ["Sprachkurse und ein früher Zugang zum Arbeitsmarkt können die Integration erleichtern.", "语言课程和尽早进入劳动力市场可以促进融入。"],
    ["Die Förderung wird unabhängig von Herkunft und Staatsangehörigkeit vergeben.", "该资助不论出身和国籍均可申请。"],
    ["Internationale Studierende müssen ihre Aufenthaltserlaubnis rechtzeitig verlängern.", "国际学生必须及时延长居留许可。"],
    ["Für die Einbürgerung gelten unter anderem sprachliche und rechtliche Voraussetzungen.", "入籍需要满足语言和法律等方面的条件。"],
    ["Viele Schulen betrachten Mehrsprachigkeit zunehmend als wertvolle Ressource.", "越来越多的学校把多语能力视为宝贵资源。"],
    ["Gemeinsame Projekte können ein Gefühl der Zugehörigkeit entstehen lassen.", "共同项目能够培养归属感。"],
    ["Eine aktive Nachbarschaftspolitik kann sozialer Ausgrenzung entgegenwirken.", "积极的社区政策可以防止社会排斥。"],
    ["Nach einigen Monaten hatte sie sich in der neuen Umgebung gut eingelebt.", "几个月后，她已经很好地适应了新环境。"],
    ["Kulturvereine vermitteln häufig zwischen neu Zugewanderten und örtlichen Einrichtungen.", "文化协会经常在新移民与当地机构之间发挥沟通作用。"],
    ["Eine vielfältige Gesellschaft braucht gemeinsame Regeln und Raum für Unterschiede.", "多元社会既需要共同规则，也需要为差异留出空间。"],
    ["Im Seminar lernen die Teilnehmenden, vorurteilsfrei miteinander umzugehen.", "参加者在研讨课中学习以无偏见的态度相处。"]
  ],
  "education-research": [
    ["Mehr Bildungsgerechtigkeit entsteht nicht allein durch einen kostenlosen Hochschulzugang.", "教育公平并不会仅靠免费接受高等教育而自动实现。"],
    ["Die Voraussetzungen der Hochschulzulassung unterscheiden sich je nach Studiengang.", "大学入学要求因专业而异。"],
    ["Vor der Bewerbung sollten Interessierte prüfen, welcher Studiengang zu ihren Zielen passt.", "申请前，有意向者应确认哪个专业符合自己的目标。"],
    ["Im Ausland erbrachte Studienleistungen können nach einer fachlichen Prüfung anerkannt werden.", "在国外取得的学业成果经专业审核后可以获得认可。"],
    ["Die Untersuchung gelangt zu neuen Erkenntnissen über das Lernverhalten Erwachsener.", "该研究对成年人的学习行为得出了新的认识。"],
    ["Ein unabhängiges Team führt derzeit eine Untersuchung zur Studienzufriedenheit durch.", "一个独立团队正在开展关于学习满意度的调查。"],
    ["Für verlässliche Aussagen benötigt die Studie eine repräsentative Stichprobe.", "为了得出可靠结论，该研究需要具有代表性的样本。"],
    ["Die Auswertung der Interviews wird voraussichtlich mehrere Wochen dauern.", "对访谈内容的分析预计将持续数周。"],
    ["Die Forschenden konnten ihre These mit mehreren Datensätzen empirisch belegen.", "研究人员能够利用多组数据对其论点进行实证证明。"],
    ["Vor der Veröffentlichung wurden zusätzliche Daten erhoben.", "发表前又收集了补充数据。"],
    ["Wegen der geringen Fallzahl sind die Ergebnisse nur begrenzt aussagekräftig.", "由于案例数量较少，研究结果的说明力有限。"],
    ["Politische Empfehlungen sollten auf wissenschaftlich fundierten Aussagen beruhen.", "政策建议应建立在有科学依据的陈述之上。"]
  ],
  "economy-work": [
    ["Sinkende Energiepreise könnten die Konjunktur im kommenden Jahr beleben.", "能源价格下降可能会在明年提振经济景气。"],
    ["Kleine Unternehmen stehen zunehmend im internationalen Wettbewerb.", "小型企业越来越多地参与国际竞争。"],
    ["Regionale Lieferketten können die lokale Wertschöpfung erhöhen.", "区域供应链能够提高当地的价值创造。"],
    ["Die Investition soll langfristig qualifizierte Beschäftigung sichern.", "这项投资旨在长期保障高质量就业。"],
    ["Gute Arbeitsbedingungen sind ein wichtiger Faktor bei der Gewinnung von Fachkräften.", "良好的工作条件是吸引专业人才的重要因素。"],
    ["Für die zusätzliche Verantwortung wurde eine angemessene Vergütung vereinbart.", "针对额外责任，双方商定了合理报酬。"],
    ["Beschäftigte können berufliche Qualifikationen auch in modularen Kursen erwerben.", "员工也可以通过模块化课程取得职业资格。"],
    ["Das Unternehmen konnte seinen Umsatz trotz schwacher Nachfrage leicht steigern.", "尽管需求疲软，该企业仍略微提高了营业额。"],
    ["Viele Betriebe investieren in energiesparende Produktionsverfahren.", "许多企业正在投资节能生产工艺。"],
    ["Mit dem neuen Geschäftsmodell konnte die Genossenschaft erstmals Gewinne erwirtschaften.", "借助新的商业模式，该合作社首次实现盈利。"],
    ["Die Anlage ist nur rentabel, wenn sie über viele Jahre zuverlässig betrieben wird.", "这套设施只有在多年可靠运行的情况下才有盈利能力。"],
    ["Die neue Regelung tritt nach einer sechsmonatigen Übergangsfrist in Kraft.", "新规定将在六个月过渡期后生效。"]
  ],
  "politics-institutions": [
    ["Die Länder wirken über den Bundesrat an der Gesetzgebung des Bundes mit.", "各州通过联邦参议院参与联邦立法。"],
    ["Die Finanzierung der Schulen fällt überwiegend in die Zuständigkeit der Länder.", "学校经费主要属于各州的职权范围。"],
    ["Die Pressefreiheit ist im Grundgesetz verankert.", "新闻自由被写入德国基本法。"],
    ["Der Entwurf erhielt im Parlament keine ausreichende Mehrheit.", "该草案未在议会中获得足够多数。"],
    ["Die Opposition verlangte eine unabhängige Untersuchung der Vorwürfe.", "反对党要求对相关指控开展独立调查。"],
    ["Der überarbeitete Entwurf enthält strengere Regeln für Lobbykontakte.", "修订后的草案包含更严格的游说接触规定。"],
    ["Der Antrag wird am Freitag im Bundestag zur Abstimmung gestellt.", "该动议将于周五提交德国联邦议院表决。"],
    ["Nach langer Debatte verabschiedete das Parlament das Gesetz mit knapper Mehrheit.", "经过长时间辩论，议会以微弱多数通过了该法律。"],
    ["Die Kommunen benötigen zusätzliche Mittel, um die beschlossenen Maßnahmen umzusetzen.", "地方政府需要额外资金来落实已通过的措施。"],
    ["Mehrere Verbände befürworten den Vorschlag grundsätzlich, verlangen aber Änderungen im Detail.", "多个协会原则上支持该建议，但要求修改细节。"],
    ["Der Ausschuss lehnte den Antrag wegen ungeklärter Finanzierung ab.", "委员会因资金问题尚未解决而否决了该动议。"],
    ["Öffentliche Einrichtungen müssen über die Verwendung der Mittel Rechenschaft ablegen.", "公共机构必须说明资金的使用情况并接受问责。"]
  ],
  "law-rights": [
    ["Studierende haben unter bestimmten Voraussetzungen Anspruch auf finanzielle Unterstützung.", "学生在满足特定条件时有权获得经济援助。"],
    ["Mit der Unterschrift geht der Anbieter eine verbindliche Verpflichtung ein.", "服务提供方通过签字承担具有约束力的义务。"],
    ["Ein Verstoß gegen den Datenschutz kann erhebliche Folgen haben.", "违反数据保护规定可能造成严重后果。"],
    ["Alle Beschäftigten müssen die geltenden Sicherheitsvorschriften beachten.", "所有员工都必须遵守现行安全规定。"],
    ["Für Schäden, die durch grobe Fahrlässigkeit entstehen, haftet der Betreiber.", "对于因重大过失造成的损失，运营方承担赔偿责任。"],
    ["Die Behörde erteilte die Genehmigung erst nach einer Umweltprüfung.", "主管部门在环境审查后才颁发许可。"],
    ["Die Daten dürfen nur für einen rechtmäßigen Zweck verarbeitet werden.", "这些数据只能出于合法目的进行处理。"],
    ["Mündliche Zusagen sind in diesem Verfahren nicht verbindlich.", "口头承诺在这一程序中不具有约束力。"],
    ["Klare Zuständigkeiten sollen die Sicherheit aller Beteiligten gewährleisten.", "明确的职责分工旨在保障所有参与者的安全。"],
    ["Nutzende können ihre Einwilligung jederzeit widerrufen.", "用户可以随时撤销其同意。"],
    ["Die Beratung kann auch anonym in Anspruch genommen werden.", "咨询服务也可以匿名使用。"],
    ["Bei vorsätzlicher Täuschung können Verantwortliche persönlich zur Verantwortung gezogen werden.", "如存在故意欺骗，相关责任人可能被追究个人责任。"]
  ],
  "environment-climate": [
    ["Die Folgen des Klimawandels sind bereits in vielen Regionen sichtbar.", "气候变化的后果已经在许多地区显现。"],
    ["Ohne zusätzliche Maßnahmen lässt sich die Erderwärmung kaum wirksam begrenzen.", "如果不采取额外措施，就很难有效限制全球变暖。"],
    ["Der Verkehrssektor muss seine Emissionen in den kommenden Jahren deutlich senken.", "交通部门必须在未来几年大幅减少排放。"],
    ["Reparierbare Produkte helfen dabei, natürliche Ressourcen zu schonen.", "可维修产品有助于节约自然资源。"],
    ["Intensive Landwirtschaft kann die Artenvielfalt erheblich beeinträchtigen.", "集约化农业可能严重损害生物多样性。"],
    ["Der Ausbau der Netze ist notwendig, um die Energiewende zu beschleunigen.", "扩建电网是加快能源转型所必需的。"],
    ["Ökologische Nachhaltigkeit muss bereits bei der Planung berücksichtigt werden.", "生态可持续性必须从规划阶段就予以考虑。"],
    ["Der Anteil erneuerbarer Energien am Stromverbrauch ist weiter gestiegen.", "可再生能源在电力消费中的占比继续上升。"],
    ["Die Stadt setzt auf eine möglichst umweltverträgliche Beschaffung.", "该市注重尽可能环保的采购方式。"],
    ["Gut gedämmte Gebäude verbrauchen deutlich weniger Energie.", "保温良好的建筑消耗的能源明显更少。"],
    ["Mehrwegverpackungen können große Mengen an Abfall vermeiden.", "可重复使用的包装能够避免产生大量废物。"],
    ["Die Regierung muss wirksame Maßnahmen gegen den hohen Flächenverbrauch ergreifen.", "政府必须采取有效措施应对过高的土地占用。"]
  ],
  "technology-innovation": [
    ["Viele Verwaltungen wollen die Digitalisierung ihrer Dienstleistungen vorantreiben.", "许多行政机构希望推动服务数字化。"],
    ["Beim Einsatz künstlicher Intelligenz müssen Entscheidungen überprüfbar bleiben.", "使用人工智能时，决策必须保持可核查性。"],
    ["Ein klarer Datenschutz stärkt das Vertrauen der Nutzenden.", "明确的数据保护措施能够增强用户信任。"],
    ["Regelmäßige Sicherheitsprüfungen sollen die Datensicherheit erhöhen.", "定期安全检查旨在提高数据安全性。"],
    ["Technischer Fortschritt führt nicht automatisch zu sozialem Fortschritt.", "技术进步并不会自动带来社会进步。"],
    ["Die neue Methode findet bereits in mehreren Laboren praktische Anwendung.", "这种新方法已经在多个实验室得到实际应用。"],
    ["Nicht alle Haushalte verfügen über einen zuverlässigen Zugang zum schnellen Internet.", "并非所有家庭都能可靠接入高速互联网。"],
    ["Standardisierte Abläufe lassen sich leichter automatisieren als kreative Entscheidungen.", "标准化流程比创造性决策更容易实现自动化。"],
    ["Ein interdisziplinäres Team entwickelt derzeit eine datensparsame Anwendung.", "一个跨学科团队正在开发一款尽量少收集数据的应用。"],
    ["Digitale Technik sollte gezielt eingesetzt werden, wenn sie einen klaren Nutzen bietet.", "数字技术应在能够带来明确益处时有针对性地使用。"],
    ["Die Entdeckung gilt als bahnbrechend, muss aber noch unabhängig bestätigt werden.", "这一发现被认为具有突破性，但仍需独立验证。"],
    ["Die Einführung des Systems kann mit neuen Datenschutzrisiken einhergehen.", "该系统的引入可能伴随新的数据保护风险。"]
  ],
  "media-information": [
    ["Eine ausgewogene Berichterstattung trennt Nachricht, Analyse und Kommentar.", "平衡的新闻报道会区分消息、分析和评论。"],
    ["Die Behörde informierte die Öffentlichkeit erst mehrere Tage nach dem Vorfall.", "主管部门在事件发生数日后才通知公众。"],
    ["Widersprüchliche Angaben können die Glaubwürdigkeit einer Quelle beschädigen.", "相互矛盾的信息可能损害信息源的可信度。"],
    ["Kurze Videos erzielen häufig eine hohe Reichweite, vermitteln aber wenig Kontext.", "短视频往往传播范围很广，却提供很少背景信息。"],
    ["Vor dem Zitieren sollte man die ursprüngliche Quelle überprüfen.", "引用之前应核查原始来源。"],
    ["Medienkompetenz hilft dabei, gezielte Desinformation zu erkennen.", "媒体素养有助于识别蓄意虚假信息。"],
    ["Das Forschungsteam veröffentlichte seine Ergebnisse zusammen mit den Rohdaten.", "研究团队在发表结果时同时公布了原始数据。"],
    ["Soziale Netzwerke können unbestätigte Informationen innerhalb weniger Minuten verbreiten.", "社交网络可以在几分钟内传播未经证实的信息。"],
    ["Der Artikel stellt den Sachverhalt differenziert und ohne unnötige Zuspitzung dar.", "该文章以有层次且不过度渲染的方式呈现事实。"],
    ["Ein ungewöhnlicher Bildausschnitt kann die Wahrnehmung eines Ereignisses verzerren.", "不寻常的画面裁切可能歪曲人们对事件的认知。"],
    ["Die Aussage bleibt umstritten, weil belastbare Belege fehlen.", "由于缺少可靠证据，这一说法仍有争议。"],
    ["Die Ministerin nahm ausführlich zu den Vorwürfen Stellung.", "部长就相关指控作出了详细回应。"]
  ],
  "health-life": [
    ["Auch in ländlichen Regionen muss eine verlässliche medizinische Versorgung sichergestellt werden.", "即使在农村地区，也必须保障可靠的医疗服务。"],
    ["Aufklärung und frühe Untersuchungen spielen in der Prävention eine wichtige Rolle.", "健康宣传和早期检查在预防中发挥重要作用。"],
    ["Dauerhafte psychische Belastungen können die Leistungsfähigkeit erheblich verringern.", "长期心理压力可能显著降低工作和学习能力。"],
    ["Regelmäßige Bewegung kann das körperliche und seelische Wohlbefinden steigern.", "规律运动能够提升身心健康感。"],
    ["Chronische Erkrankungen erfordern häufig eine langfristige Begleitung.", "慢性疾病往往需要长期随访。"],
    ["Die steigende Lebenserwartung erhöht den Bedarf an altersgerechten Angeboten.", "预期寿命上升增加了对适老服务的需求。"],
    ["Die Erkrankung lässt sich gut behandeln, wenn sie früh erkannt wird.", "如果及早发现，这种疾病可以得到良好治疗。"],
    ["Mit Impfungen kann schweren Krankheitsverläufen wirksam vorgebeugt werden.", "接种疫苗能够有效预防重症病程。"],
    ["Klare Arbeitsabläufe helfen dem Personal, hohe Belastungen besser zu bewältigen.", "清晰的工作流程有助于工作人员更好地应对高负荷。"],
    ["Ständiger Schlafmangel kann die Gesundheit langfristig beeinträchtigen.", "长期睡眠不足可能损害健康。"],
    ["Eine flächendeckende Versorgung ist ohne ausreichend Fachpersonal kaum möglich.", "如果没有足够的专业人员，就很难实现全面覆盖的医疗服务。"],
    ["Für die Beratung steht rund um die Uhr geschultes Personal zur Verfügung.", "全天都有受过培训的人员提供咨询服务。"]
  ],
  "culture-literature": [
    ["Archive und Museen tragen dazu bei, das kulturelle Erbe zu bewahren.", "档案馆和博物馆有助于保护文化遗产。"],
    ["Die deutsche Erinnerungskultur wird in jeder Generation neu diskutiert.", "德国的历史记忆文化在每一代人中都会被重新讨论。"],
    ["Kants Essay über die Aufklärung fordert zum selbstständigen Gebrauch der Vernunft auf.", "康德关于启蒙的文章倡导独立运用理性。"],
    ["An Sprache und Form lässt sich ein Werk häufig einer literarischen Epoche zuordnen.", "通过语言和形式往往可以把作品归入某个文学时期。"],
    ["Der Roman wechselt mehrfach die Erzählperspektive und erzeugt dadurch Unsicherheit.", "这部小说多次转换叙述视角，从而制造不确定感。"],
    ["Die Reise erscheint im Gedicht als wiederkehrendes Motiv.", "旅行在这首诗中作为反复出现的意象。"],
    ["Die Darstellung der Hauptfigur bleibt bewusst widersprüchlich.", "对主人公的描写有意保持矛盾性。"],
    ["Eine überzeugende Interpretation muss ihre Aussagen am Text belegen.", "有说服力的阐释必须以文本为依据。"],
    ["Die Figur verkörpert sowohl den Wunsch nach Freiheit als auch die Angst vor Veränderung.", "这一人物既体现了对自由的渴望，也体现了对变化的恐惧。"],
    ["Der Roman setzt sich kritisch mit gesellschaftlicher Ausgrenzung auseinander.", "这部小说深入而批判地探讨社会排斥。"],
    ["Zeitgenössische Literatur greift häufig Fragen digitaler Identität auf.", "当代文学经常涉及数字身份问题。"],
    ["Die Begegnung mit einer anderen Sprache wurde für die Autorin zu einer prägenden Erfahrung.", "与另一种语言的相遇成为对这位作者影响深远的经历。"]
  ],
  intercultural: [
    ["Viele Missverständnisse lassen sich durch eine kurze Rückfrage vermeiden.", "许多误解可以通过简短确认来避免。"],
    ["Dieselbe Gesprächspause kann in verschiedenen Kulturen unterschiedlich wahrgenommen werden.", "同一段谈话停顿在不同文化中可能被以不同方式感知。"],
    ["Gesellschaftliche Wertvorstellungen verändern sich und sind innerhalb eines Landes nicht einheitlich.", "社会价值观会发生变化，在一个国家内部也并不统一。"],
    ["Vor einer Geschäftsreise sollte man sich über übliche Umgangsformen informieren.", "商务出行前应了解常见交往礼仪。"],
    ["Der Austausch zeigte, wie stark Selbst- und Fremdwahrnehmung voneinander abweichen können.", "这次交流显示了自我认知与他者认知可能存在多大差异。"],
    ["Kulturelle Anpassung bedeutet nicht, die eigene Identität vollständig aufzugeben.", "文化适应并不意味着完全放弃自身身份。"],
    ["Bei der Planung sollten unterschiedliche religiöse und kulturelle Bedürfnisse berücksichtigt werden.", "规划时应考虑不同的宗教和文化需求。"],
    ["Eine ironische Äußerung kann ohne gemeinsamen Kontext leicht missverstanden werden.", "如果缺少共同语境，带有讽刺意味的表达很容易被误解。"],
    ["Das Training soll Beschäftigte für unterschiedliche Kommunikationsstile sensibilisieren.", "该培训旨在提高员工对不同沟通风格的敏感度。"],
    ["In Konflikten ist es wichtig, der Situation angemessen und nicht vorschnell zu reagieren.", "发生冲突时，重要的是作出符合情境而非草率的反应。"],
    ["Die Formulierung ist mehrdeutig und sollte im Vertrag präzisiert werden.", "这一表述含义不明确，应在合同中加以澄清。"],
    ["Wer im Team arbeitet, muss auf unterschiedliche Arbeitsweisen Rücksicht nehmen.", "团队合作时必须顾及不同的工作方式。"]
  ],
  "translation-language": [
    ["Für den Fachbegriff gibt es im Deutschen keine vollständig passende Entsprechung.", "这一专业术语在德语中没有完全对应的表达。"],
    ["Die lexikalische Mehrdeutigkeit lässt sich erst durch den Kontext auflösen.", "词汇歧义只有结合语境才能消除。"],
    ["Die beiden Wörter haben einen unterschiedlichen Bedeutungsumfang und sind nicht immer austauschbar.", "这两个词的意义范围不同，并非总能互换。"],
    ["Eine präzise Wortwahl ist besonders bei rechtlichen Texten entscheidend.", "准确选词对于法律文本尤为关键。"],
    ["Bei der Übersetzung wurde die komplexe Satzstruktur in zwei Hauptsätze aufgelöst.", "翻译时，复杂句子结构被拆成了两个主句。"],
    ["Übersetzende müssen die Konventionen der jeweiligen Textsorte berücksichtigen.", "译者必须考虑相应文本类型的惯例。"],
    ["Die Metapher sollte sinngemäß und nicht Wort für Wort übersetzt werden.", "这个比喻应按意义翻译，而不是逐字翻译。"],
    ["Wer die Aussage wortwörtlich versteht, übersieht ihren ironischen Ton.", "如果逐字理解这一表达，就会忽略其讽刺语气。"],
    ["Eine gute Übersetzung gibt nicht nur den Inhalt, sondern auch das Register präzise wieder.", "好的翻译不仅准确传达内容，也准确再现语体。"],
    ["Wenn ein Fachwort fehlt, kann man den Begriff zunächst verständlich umschreiben.", "如果缺少专业术语，可以先用易懂的方式解释该概念。"],
    ["Am Ende des Kapitels fasst die Autorin die wichtigsten Ergebnisse zusammen.", "作者在章节末尾概括了最重要的结果。"],
    ["Der letzte Satz bringt die zentrale Aussage des gesamten Textes auf den Punkt.", "最后一句简明扼要地表达了全文的核心观点。"]
  ]
};

let enrichedWords = 0;
advanced.themes.forEach((theme, themeIndex) => {
  const specificExamples = advancedExamples[theme.id];
  if (!specificExamples || specificExamples.length !== theme.entries.length) throw new Error(`Expected ${theme.entries.length} examples for ${theme.id}`);
  theme.entries.forEach((entry, entryIndex) => {
    entry.collocation = collocationCorrections.get(entry.collocation) || entry.collocation;
    if (specificExamples[entryIndex]) {
      [entry.example, entry.translation] = specificExamples[entryIndex];
      entry.sourceType = "original_context_example";
      enrichedWords += 1;
    } else if (!entry.example) {
      const frame = exampleFrames[(themeIndex + entryIndex) % exampleFrames.length];
      const [example, translation] = frame(entry.collocation || entry.term);
      entry.example = example;
      entry.translation = translation;
      enrichedWords += 1;
    }
    entry.cefr = entry.cefr || "B2-C1";
    entry.difficulty = entry.difficulty || 3 + ((themeIndex + entryIndex) % 3);
    entry.reviewStatus = "词形、释义、搭配与教学例句已完成结构复核；正式课程使用前仍建议德语教师抽样审校。";
  });
});
vocab.stages.find((stage) => stage.id === "foundation").themes.forEach((theme, themeIndex) => {
  theme.entries.forEach((entry, entryIndex) => {
    entry.cefr = entry.cefr || "A1-B1";
    entry.difficulty = entry.difficulty || 1 + ((themeIndex + entryIndex) % 3);
  });
});
writeJson("data/vocab-library.json", vocab);

const grammarExamples = {
  "advanced-passive-process-state": ["Die Tür wird geschlossen; danach ist sie geschlossen.｜门正在被关上；随后门处于关闭状态。"],
  "advanced-passive-alternatives": ["Das Problem lässt sich ohne zusätzliche Daten nicht lösen.｜没有补充数据，这个问题无法解决。"],
  "advanced-konjunktiv-two": ["Wenn mehr Zeit zur Verfügung stünde, könnten wir die Daten genauer prüfen.｜如果有更多时间，我们就能更仔细地检查数据。"],
  "advanced-konjunktiv-one": ["Die Sprecherin erklärte, die Ergebnisse seien noch vorläufig.｜发言人表示，结果仍是初步的。"],
  "advanced-modal-subjective": ["Die Verhandlungen sollen bereits abgeschlossen sein.｜据说谈判已经结束。"],
  "advanced-modal-particles": ["Das ist ja eine überraschende Entwicklung.｜这确实是一个令人意外的发展。"],
  "advanced-relative-advanced": ["Die Studie, deren Ergebnisse veröffentlicht wurden, stößt auf großes Interesse.｜那项结果已经公布的研究引起了广泛关注。"],
  "advanced-infinitive-clauses": ["Statt die Unsicherheit zu verschweigen, sollte man ihre Ursachen erklären.｜与其掩盖不确定性，不如解释其原因。"],
  "advanced-result-consequence": ["Die Daten sind zu lückenhaft, als dass man daraus sichere Schlüsse ziehen könnte.｜数据缺漏过多，无法据此得出可靠结论。"],
  "advanced-concession": ["Obwohl der Einwand berechtigt ist, bleibt die Grundidee überzeugend.｜尽管这一异议有道理，基本思路仍有说服力。"],
  "advanced-condition": ["Sofern alle Beteiligten zustimmen, kann das Projekt im Herbst beginnen.｜只要所有参与者同意，项目就能在秋季启动。"],
  "advanced-temporal-relations": ["Nachdem die Daten ausgewertet worden waren, wurde der Bericht veröffentlicht.｜数据分析完毕后，报告得以发表。"],
  "advanced-participial-attributes": ["Die gestern veröffentlichte Studie berücksichtigt regionale Unterschiede.｜昨天发表的研究考虑了地区差异。"],
  "advanced-nominalization": ["Die Kommission prüft den Antrag. → Die Prüfung des Antrags dauert zwei Wochen.｜委员会审核申请。→ 对申请的审核持续两周。"],
  "advanced-register-style": ["Die Ergebnisse deuten darauf hin, dass weitere Untersuchungen erforderlich sind.｜结果表明仍需进一步研究。"],
  "advanced-functional-verbs": ["Die neue Regelung tritt am ersten Januar in Kraft.｜新规定于一月一日生效。"],
  "advanced-verb-government": ["Die Entscheidung hängt von der Qualität der Daten ab.｜这一决定取决于数据质量。"],
  "advanced-prepositions-register": ["Aufgrund der hohen Nachfrage wurde das Angebot erweitert.｜由于需求旺盛，服务范围得到了扩大。"],
  "advanced-connectors": ["Die Kosten sind gestiegen; dennoch wird das Projekt fortgesetzt.｜成本有所上升；尽管如此，项目仍将继续。"],
  "advanced-correlative-connectors": ["Sowohl die Methode als auch die Ergebnisse werden kritisch geprüft.｜研究方法和结果都会受到严格检验。"],
  "advanced-reported-speech": ["Nach Angaben der Behörde sei die Versorgung gesichert.｜据主管部门称，供应已有保障。"],
  "advanced-word-order-fields": ["Im kommenden Semester | wird | die Universität neue Beratungsangebote | einführen.｜下学期，大学将推出新的咨询服务。"],
  "advanced-middle-field-order": ["Die Universität hat den Studierenden gestern aus organisatorischen Gründen die Änderung mitgeteilt.｜大学昨天出于组织原因向学生通知了这一变动。"],
  "advanced-noun-phrase-chains": ["Die Ergebnisse der langfristigen Untersuchung der regionalen Arbeitsmärkte liegen vor.｜关于地区劳动力市场的长期研究结果已经公布。"],
  "advanced-substitute-forms": ["Die Nachfrage ist gestiegen. Darauf hat die Hochschule mit zusätzlichen Kursen reagiert.｜需求上升了。对此，高校增加了课程。"],
  "advanced-tense-text": ["Als die Reform begann, hatten mehrere Hochschulen bereits Pilotprojekte durchgeführt.｜改革开始时，多所高校已经开展过试点项目。"],
  "advanced-word-formation": ["nachhaltig → die Nachhaltigkeit; entscheiden → die Entscheidung｜可持续的 → 可持续性；决定 → 决定（名词）"],
  "advanced-valency-transform": ["Die Maßnahme erleichtert den Studierenden den Zugang. → Der Zugang wird den Studierenden erleichtert.｜该措施方便学生获得服务。→ 学生获得服务变得更加容易。"],
  "advanced-negation-scope": ["Nicht alle Befragten lehnen den Vorschlag ab.｜并非所有受访者都反对这一建议。"],
  "advanced-punctuation": ["Die Autorin betont, dass Transparenz notwendig ist, warnt aber vor vorschnellen Schlüssen.｜作者强调透明度的重要性，但也警告不要仓促下结论。"]
};

const advancedGrammarExercises = {
  "advanced-passive-process-state": { question: "哪一组正确区分了过程被动态和状态被动态？", options: ["Die Tür wird geschlossen. / Die Tür ist geschlossen.", "Die Tür ist schließen. / Die Tür wird geschlossen sein.", "Die Tür hat geschlossen. / Die Tür wurde schließen."], answer: 0, explanation: "werden + Partizip II 描述过程，sein + Partizip II 描述动作完成后的状态。" },
  "advanced-passive-alternatives": { question: "哪一句可以自然改写为“Das Problem kann gelöst werden”？", options: ["Das Problem lässt sich lösen.", "Das Problem hat zu lösen.", "Das Problem wird sich gelöst."], answer: 0, explanation: "sich lassen + Infinitiv 可以表达被动意义的可能性。" },
  "advanced-konjunktiv-two": { question: "请选择符合非现实条件的句子。", options: ["Wenn mehr Zeit zur Verfügung stünde, könnten wir genauer prüfen.", "Wenn mehr Zeit steht, können wir genauer geprüft.", "Wenn mehr Zeit gestanden hätte, wir prüfen genauer."], answer: 0, explanation: "非现实现在条件使用第二虚拟式：stünde 与 könnten 相互呼应。" },
  "advanced-konjunktiv-one": { question: "哪一句正确使用第一虚拟式转述他人说法？", options: ["Die Sprecherin erklärte, die Ergebnisse seien vorläufig.", "Die Sprecherin erklärte, die Ergebnisse sind vorläufig gewesen.", "Die Sprecherin erklärte, seien die Ergebnisse vorläufig."], answer: 0, explanation: "间接引语中 seien 是 sein 的第一虚拟式复数形式。" },
  "advanced-modal-subjective": { question: "“Die Verhandlungen sollen abgeschlossen sein.”表达什么？", options: ["据称谈判已经结束", "谈判有义务结束", "谈判被允许结束"], answer: 0, explanation: "sollen + Infinitiv II 在主观用法中表示来自他人的、尚未证实的信息。" },
  "advanced-modal-particles": { question: "“Wie heißt du denn?”中的 denn 主要起什么作用？", options: ["使提问更自然，并体现说话者的兴趣或语境联系", "表示时间先后", "把疑问句变成被动态"], answer: 0, explanation: "情态小品词 denn 不改变命题内容，而是调整语气和互动关系。" },
  "advanced-relative-advanced": { question: "请选择正确的关系代词：Die Studie, ___ Ergebnisse veröffentlicht wurden, wird diskutiert.", options: ["deren", "dessen", "denen"], answer: 0, explanation: "先行词 Studie 为阴性，关系从句表达所属关系，因此使用 deren。" },
  "advanced-infinitive-clauses": { question: "哪一句正确使用了不定式结构压缩目的从句？", options: ["Die Hochschule erweitert das Angebot, um mehr Studierende zu erreichen.", "Die Hochschule erweitert das Angebot, damit mehr Studierende zu erreichen.", "Die Hochschule erweitert das Angebot, um erreicht mehr Studierende."], answer: 0, explanation: "主句和目的结构的逻辑主语一致时可以使用 um ... zu。" },
  "advanced-result-consequence": { question: "请选择正确表达“数据太少，无法得出可靠结论”的句子。", options: ["Die Daten sind zu knapp, als dass man zuverlässige Schlüsse ziehen könnte.", "Die Daten sind so knapp, um zuverlässige Schlüsse zu ziehen.", "Die Daten sind zu knapp, dass man zuverlässige Schlüsse zieht."], answer: 0, explanation: "zu ... als dass + Konjunktiv II 表示程度过高，以致预期结果无法实现。" },
  "advanced-concession": { question: "哪一句正确表达让步关系？", options: ["Obwohl der Einwand berechtigt ist, bleibt die These überzeugend.", "Obwohl der Einwand berechtigt ist, aber bleibt die These überzeugend.", "Wegen der Einwand berechtigt ist, bleibt die These überzeugend."], answer: 0, explanation: "obwohl 已经标记让步关系，主句不再额外使用 aber。" },
  "advanced-condition": { question: "请选择正确的条件表达。", options: ["Sofern alle Beteiligten zustimmen, kann das Projekt beginnen.", "Sofern stimmen alle Beteiligten zu, das Projekt kann beginnen.", "Sofern alle Beteiligten zuzustimmen, beginnt das Projekt."], answer: 0, explanation: "sofern 引导尾语序条件从句。" },
  "advanced-temporal-relations": { question: "哪一句正确表达“数据分析之后，报告才发表”？", options: ["Nachdem die Daten ausgewertet worden waren, wurde der Bericht veröffentlicht.", "Nachdem die Daten wurden ausgewertet, der Bericht wurde veröffentlicht.", "Nachdem die Daten ausgewertet hatten, veröffentlichte der Bericht."], answer: 0, explanation: "先发生的动作可用过去完成时被动态；前置从句后主句发生倒装。" },
  "advanced-participial-attributes": { question: "请选择正确的扩展分词定语。", options: ["die gestern veröffentlichte Studie", "die gestern veröffentlichende Studie", "die gestern wurde veröffentlichte Studie"], answer: 0, explanation: "研究是被发表的，因此使用第二分词 veröffentlichte。" },
  "advanced-nominalization": { question: "“Die Kommission prüft den Antrag.”最自然的名词化是什么？", options: ["die Prüfung des Antrags durch die Kommission", "das Prüfen den Antrag von der Kommission", "die geprüfte des Antrags Kommission"], answer: 0, explanation: "动作名词 Prüfung 后可用第二格表示对象，并用 durch 引出执行者。" },
  "advanced-register-style": { question: "哪一句最符合谨慎的学术语体？", options: ["Die Ergebnisse deuten darauf hin, dass weitere Untersuchungen erforderlich sind.", "Die Ergebnisse beweisen total, dass alles stimmt.", "Man sieht halt, dass noch mehr gemacht werden muss."], answer: 0, explanation: "deuten darauf hin 和 erforderlich 保持审慎、正式且可验证的语气。" },
  "advanced-functional-verbs": { question: "请选择正确的功能动词结构。", options: ["Die neue Regelung tritt im Januar in Kraft.", "Die neue Regelung macht im Januar Kraft.", "Die neue Regelung wird im Januar in Kraft treten lassen."], answer: 0, explanation: "in Kraft treten 是表示“生效”的固定功能动词结构。" },
  "advanced-verb-government": { question: "请选择正确的介词支配：Der Erfolg hängt ___ mehreren Faktoren ab.", options: ["von", "auf", "für"], answer: 0, explanation: "abhängen von 支配第三格。" },
  "advanced-prepositions-register": { question: "请选择符合书面语介词支配的句子。", options: ["Aufgrund der hohen Nachfrage wurde das Angebot erweitert.", "Aufgrund die hohe Nachfrage wurde das Angebot erweitert.", "Aufgrund von die hohe Nachfrage wurde das Angebot erweitert."], answer: 0, explanation: "aufgrund 在正式书面语中通常支配第二格。" },
  "advanced-connectors": { question: "请选择连接词与语序均正确的句子。", options: ["Die Kosten sind gestiegen; dennoch wird das Projekt fortgesetzt.", "Die Kosten sind gestiegen; dennoch das Projekt wird fortgesetzt.", "Die Kosten sind gestiegen; obwohl wird das Projekt fortgesetzt."], answer: 0, explanation: "dennoch 是连接副词，占据第一位时有限动词紧随其后。" },
  "advanced-correlative-connectors": { question: "请选择结构平行的成对连接句。", options: ["Sowohl die Methode als auch die Ergebnisse werden geprüft.", "Sowohl die Methode aber auch die Ergebnisse werden geprüft.", "Die Methode sowohl als auch werden die Ergebnisse geprüft."], answer: 0, explanation: "sowohl ... als auch ... 连接语法地位相同的两个成分。" },
  "advanced-reported-speech": { question: "哪一句正确标记了消息来源和间接引语？", options: ["Nach Angaben der Behörde sei die Versorgung gesichert.", "Nach Angaben der Behörde ist die Versorgung sei gesichert.", "Nach Angaben der Behörde wäre die Versorgung sichern."], answer: 0, explanation: "nach Angaben 标明来源，sei 用第一虚拟式保持转述距离。" },
  "advanced-word-order-fields": { question: "句子“Im kommenden Semester wird die Universität neue Kurse anbieten.”中的左括号是什么？", options: ["wird", "Im kommenden Semester", "anbieten"], answer: 0, explanation: "前场是 Im kommenden Semester，有限动词 wird 构成左括号，不定式 anbieten 构成右括号。" },
  "advanced-middle-field-order": { question: "哪一句的中场排序最自然？", options: ["Die Universität hat den Studierenden gestern aus organisatorischen Gründen die Änderung mitgeteilt.", "Die Universität hat die Änderung aus organisatorischen Gründen gestern den Studierenden mitgeteilt.", "Die Universität den Studierenden hat gestern die Änderung mitgeteilt."], answer: 0, explanation: "代词或较短的与格成分通常较早出现；时间通常位于原因和方式之前。" },
  "advanced-noun-phrase-chains": { question: "“地区劳动力市场长期研究的结果”最符合正式书面语的表达是哪一项？", options: ["die Ergebnisse der langfristigen Untersuchung der regionalen Arbeitsmärkte", "die Ergebnisse von langfristig untersuchen die regionalen Arbeitsmärkte", "die regionalen Arbeitsmärkte ihre langfristige Untersuchung Ergebnisse"], answer: 0, explanation: "多个第二格结构可以形成长名词短语，但分析时应从核心名词 Ergebnisse 开始。" },
  "advanced-substitute-forms": { question: "请选择正确的指代表达：Die Nachfrage ist gestiegen. ___ reagiert die Hochschule mit zusätzlichen Kursen.", options: ["Darauf", "Daran", "Dafürhin"], answer: 0, explanation: "reagieren auf 对应代副词 darauf。" },
  "advanced-tense-text": { question: "哪一句正确表达“改革开始前，试点已经完成”？", options: ["Als die Reform begann, waren die Pilotprojekte bereits abgeschlossen worden.", "Als die Reform begann, wurden die Pilotprojekte bereits abschließen.", "Als die Reform begonnen hatte, sind die Pilotprojekte bereits abschloss."], answer: 0, explanation: "过去叙述中的先行动作可用过去完成时被动态 waren ... worden。" },
  "advanced-word-formation": { question: "哪一组派生关系正确？", options: ["nachhaltig → Nachhaltigkeit", "entscheiden → Entscheidkeit", "möglich → Mögliching"], answer: 0, explanation: "后缀 -keit 可以把部分形容词转化为阴性抽象名词。" },
  "advanced-valency-transform": { question: "“Die Maßnahme erleichtert den Studierenden den Zugang.”的正确被动转换是什么？", options: ["Der Zugang wird den Studierenden durch die Maßnahme erleichtert.", "Den Studierenden werden der Zugang durch die Maßnahme erleichtert.", "Die Studierenden werden den Zugang durch die Maßnahme erleichtern."], answer: 0, explanation: "原句第四格宾语 der Zugang 在被动态中成为主语，与 wird 保持一致；第三格宾语保留。" },
  "advanced-negation-scope": { question: "“Nicht alle Befragten lehnen den Vorschlag ab.”表示什么？", options: ["有些受访者不反对该建议", "所有受访者都反对该建议", "没有受访者反对该建议"], answer: 0, explanation: "nicht 位于 all 之前，否定的是全称范围，而不是整个谓语。" },
  "advanced-punctuation": { question: "请选择逗号使用正确的句子。", options: ["Die Autorin betont, dass Transparenz notwendig ist, warnt aber vor vorschnellen Schlüssen.", "Die Autorin betont dass Transparenz notwendig ist warnt, aber vor vorschnellen Schlüssen.", "Die Autorin, betont, dass Transparenz notwendig ist warnt aber vor vorschnellen Schlüssen."], answer: 0, explanation: "dass 从句两侧需要逗号；主句中 aber 连接谓语时不必额外切断主语和动词。" }
};

const grammar = readJson("data/grammar-library.json");
let enrichedGrammar = 0;
grammar.structure.flatMap((group) => group.topics).forEach((topic) => {
  if ((!topic.examples || topic.examples.length === 0) && grammarExamples[topic.id]) {
    topic.examples = grammarExamples[topic.id];
    enrichedGrammar += 1;
  }
  topic.cefr = topic.cefr || (topic.id.startsWith("advanced-") ? "B2-C1" : "A1-B1");
  if (advancedGrammarExercises[topic.id]) topic.exercise = advancedGrammarExercises[topic.id];
  if (topic.id.startsWith("advanced-")) topic.reviewStatus = "规则、例句、易错点与自测已完成结构复核；正式课程使用前仍建议德语教师抽样审校。";
});
writeJson("data/grammar-library.json", grammar);

const quotes = {
  version: "1.0.0",
  copyrightNote: "仅收录已进入公版的德语作品短句。中文释义为本站原创，个别历史拼写按现行正字法现代化；短句用于语言观察，不替代作品原文。",
  items: [
    { id: "goethe-faust-streben", author: "Johann Wolfgang von Goethe", work: "Faust I", quote: "Es irrt der Mensch, so lang er strebt.", translation: "人只要仍在追求，就难免犯错。", focus: "so lang 引导时间关系；streben 表示持续追求。" },
    { id: "goethe-faust-mensch", author: "Johann Wolfgang von Goethe", work: "Faust I", quote: "Hier bin ich Mensch, hier darf ich's sein!", translation: "在这里，我是一个真正的人；在这里，我可以如此生活。", focus: "前置地点成分触发动词第二位；ich's 是 ich es 的缩合。" },
    { id: "goethe-faust-theorie", author: "Johann Wolfgang von Goethe", work: "Faust I", quote: "Grau, teurer Freund, ist alle Theorie, und grün des Lebens goldner Baum.", translation: "亲爱的朋友，一切理论都是灰色的，而生命的金树常青。", focus: "表语前置；des Lebens 是第二格定语。" },
    { id: "kant-aufklaerung", author: "Immanuel Kant", work: "Beantwortung der Frage: Was ist Aufklärung?", quote: "Habe Mut, dich deines eigenen Verstandes zu bedienen!", translation: "要有勇气运用你自己的理性。", focus: "sich einer Sache bedienen 支配第二格。" },
    { id: "schiller-spiel", author: "Friedrich Schiller", work: "Über die ästhetische Erziehung des Menschen", quote: "Der Mensch ist nur da ganz Mensch, wo er spielt.", translation: "只有在游戏时，人才是完整的人。", focus: "wo 引导表示情境的从句。" },
    { id: "lessing-muessen", author: "Gotthold Ephraim Lessing", work: "Nathan der Weise", quote: "Kein Mensch muss müssen.", translation: "没有人必须被迫做什么。", focus: "情态动词 müssen 在另一个情态动词后使用不定式。" },
    { id: "heine-nachtgedanken", author: "Heinrich Heine", work: "Nachtgedanken", quote: "Denk ich an Deutschland in der Nacht, dann bin ich um den Schlaf gebracht.", translation: "当我在夜里想到德国，我便难以入眠。", focus: "省略 wenn 的条件结构使用动词第一位。" },
    { id: "rilke-leben", author: "Rainer Maria Rilke", work: "Archaischer Torso Apollos", quote: "Du musst dein Leben ändern.", translation: "你必须改变你的生活。", focus: "情态动词后使用不带 zu 的不定式。" }
  ]
};
writeJson("data/classic-quotes.json", quotes);

console.log(JSON.stringify({ enrichedWords, enrichedGrammar, quotes: quotes.items.length }, null, 2));
