const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "data", "questions-advanced");
fs.mkdirSync(outputDir, { recursive: true });

let seed = 20260719;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};
const shuffled = (values) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

const modules = new Map();
const passages = [];
const counters = new Map();
const add = ({ module, type, subtopic, difficulty, prompt, options = [], answer, acceptableAnswers = [], explanation, passageId = null, blankNo = null, tags = [] }) => {
  const number = (counters.get(module) || 0) + 1;
  counters.set(module, number);
  const item = {
    id: `DS-A-${module.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}-${String(number).padStart(4, "0")}`,
    module,
    type,
    subtopic,
    difficulty,
    prompt,
    options: type === "mcq" ? shuffled(options) : [],
    answer,
    acceptableAnswers,
    explanation,
    passageId,
    blankNo,
    tags,
    reviewStatus: "template_validated"
  };
  if (!modules.has(module)) modules.set(module, []);
  modules.get(module).push(item);
};

const settings = [
  "Im Forschungskolloquium", "In einem wissenschaftlichen Bericht", "Während einer Podiumsdiskussion",
  "In der Redaktionssitzung", "Bei der Auswertung einer Studie", "In einem politischen Kommentar",
  "Im Seminar zur Gegenwartssprache", "In einer offiziellen Stellungnahme", "Bei einer Projektpräsentation",
  "In der Besprechung mit der Projektleitung"
];
const textFunctions = ["bei der Einordnung", "in der Zusammenfassung", "bei der Argumentation", "in der Replik", "im Fazit"];
const contexts50 = settings.flatMap((setting) => textFunctions.map((fn) => `${setting}, ${fn}`));

const grammarCores = [
  ["Indirekte Rede", "Die Sprecherin erklärte, die Maßnahme ___ sorgfältig geprüft worden.", "sei", ["ist", "wäre", "werde"], "In der indirekten Rede steht das Perfekt Passiv hier mit Konjunktiv I von sein."],
  ["Indirekte Rede", "Der Bericht stellt fest, die Nachfrage ___ im Vorjahr deutlich gestiegen.", "sei", ["ist", "habe", "wäre"], "Steigen bildet das Perfekt mit sein; in der indirekten Rede lautet die Form sei gestiegen."],
  ["Indirekte Rede", "Die Forschenden betonten, sie ___ keine personenbezogenen Daten gespeichert.", "hätten", ["haben", "seien", "würden"], "Wenn Konjunktiv I mit dem Indikativ zusammenfällt, kann Konjunktiv II die Distanz markieren."],
  ["Subjektive Modalität", "Die Verhandlungen ___ bereits abgeschlossen sein; eine Bestätigung liegt jedoch noch nicht vor.", "sollen", ["müssen", "dürfen", "wollen"], "Sollen gibt eine nicht bestätigte Information aus fremder Quelle wieder."],
  ["Subjektive Modalität", "Nach Einschätzung der Fachleute ___ die Ursache in einem Messfehler liegen.", "dürfte", ["darf", "soll", "will"], "Dürfte drückt eine vorsichtige, relativ wahrscheinliche Vermutung aus."],
  ["Subjektive Modalität", "Er ___ die Unterlagen rechtzeitig abgeschickt haben, doch im System fehlen sie.", "will", ["muss", "darf", "sollte"], "Wollen in subjektiver Bedeutung kennzeichnet eine Behauptung des Subjekts über sich selbst."],
  ["Ersatzinfinitiv", "Die Kommission hätte früher auf die Risiken hinweisen ___.", "müssen", ["gemusst", "zu müssen", "müsste"], "Bei Modalverb plus Vollverb steht im Perfekt und Plusquamperfekt der Ersatzinfinitiv."],
  ["Ersatzinfinitiv", "Niemand hat die Entwicklung zuverlässig vorhersagen ___.", "können", ["gekonnt", "zu können", "könnte"], "Nach einem Vollverb wird das Modalverb im Perfekt als Ersatzinfinitiv verwendet."],
  ["Ersatzinfinitiv", "Sie sagte, dass sie den Termin nicht habe verschieben ___.", "wollen", ["gewollt", "zu wollen", "wollte"], "Im Nebensatz mit Ersatzinfinitiv steht die finite Form vor der Infinitivgruppe."],
  ["Passiv und Alternativen", "Die Ergebnisse lassen sich nicht ohne weitere Daten ___.", "verallgemeinern", ["verallgemeinert", "zu verallgemeinern", "verallgemeinernd"], "Sich lassen plus Infinitiv ist eine Passiversatzform mit modaler Bedeutung."],
  ["Passiv und Alternativen", "Bei diesem Material handelt es sich um eine leicht ___ Oberfläche.", "zu reinigende", ["gereinigte", "reinigende", "zu reinigen"], "Zu plus Partizip I als Attribut drückt eine passive Notwendigkeit oder Möglichkeit aus."],
  ["Passiv und Alternativen", "Der Antrag bedarf noch der Prüfung, bevor er bewilligt ___.", "werden kann", ["kann werden", "worden kann", "können wird"], "Im Nebensatz steht beim Modalverbpassiv der Infinitiv werden vor dem finiten Modalverb."],
  ["Partizipialattribute", "Die auf mehreren Datensätzen ___ Analyse kommt zu einem vorsichtigen Ergebnis.", "beruhende", ["beruhte", "beruhende auf", "beruht"], "Das Partizip-I-Attribut übernimmt die Rektion von beruhen auf."],
  ["Partizipialattribute", "Die erst gestern ___ Richtlinie tritt im kommenden Monat in Kraft.", "veröffentlichte", ["veröffentlichende", "zu veröffentlichte", "veröffentlicht"], "Das Partizip-II-Attribut bezeichnet hier einen abgeschlossenen Vorgang."],
  ["Partizipialattribute", "Die von der Mehrheit nicht ___ Folgen wurden später sichtbar.", "vorhergesehenen", ["vorhersehenden", "vorhergesehene", "vorausgesehen"], "Nach bestimmtem Artikel im Plural erhält das attributive Partizip die Endung -en."],
  ["Nominalstil", "___ der Daten wurde das Verfahren angepasst.", "Nach Auswertung", ["Nachdem Auswertung", "Nach ausgewertet", "Bei auswerten"], "Die temporale Nebensatzinformation wird korrekt durch nach plus substantivierten Vorgang verdichtet."],
  ["Nominalstil", "Die Fachleute fordern, dass die Regeln transparenter gestaltet werden. Die passende Nominalisierung lautet: Sie fordern eine transparentere ___.", "Gestaltung der Regeln", ["Gestaltung von transparent", "gestaltete Regeln", "Regelgestaltung transparent"], "Gestaltung übernimmt das Objekt als Genitivattribut oder von-Gruppe."],
  ["Nominalstil", "Die Entscheidung wurde verschoben, weil belastbare Daten fehlten. Nominal: Die Entscheidung wurde ___ belastbarer Daten verschoben.", "mangels", ["trotz", "anlässlich", "mittels"], "Mangels plus Genitiv bezeichnet einen fehlenden Grund oder eine fehlende Voraussetzung."],
  ["Konnektoren", "Die Stichprobe ist klein; ___ lassen die Ergebnisse eine klare Tendenz erkennen.", "dennoch", ["demzufolge", "zumal", "insofern"], "Dennoch markiert einen konzessiven Gegensatz zwischen Einwand und Ergebnis."],
  ["Konnektoren", "Die Methode ist aufwendig, ___ sie besonders zuverlässige Ergebnisse liefert.", "zumal", ["geschweige denn", "sofern", "indem"], "Zumal führt einen zusätzlichen, besonders gewichtigen Grund an."],
  ["Konnektoren", "Die Daten sind nur eingeschränkt vergleichbar, ___ die Erhebungszeiträume voneinander abweichen.", "insofern als", ["als dass", "ohne dass", "je nachdem"], "Insofern als präzisiert den Umfang einer vorherigen Aussage."],
  ["Rektion", "Die Reform zielt ___, den Zugang zu vereinfachen.", "darauf ab", ["daran ab", "darüber hin", "dafür zu"], "Abzielen auf wird vor einem Infinitivsatz durch das Korrelat darauf ab vertreten."],
  ["Rektion", "Es fehlt bislang ___ einer überzeugenden Erklärung für die Abweichung.", "an", ["auf", "über", "gegen"], "Fehlen an regiert den Dativ; bei einer unpersönlichen Konstruktion steht es fehlt an."],
  ["Rektion", "Die Autorin setzt sich kritisch ___ der bisherigen Forschung auseinander.", "mit", ["an", "auf", "für"], "Sich auseinandersetzen mit regiert den Dativ."],
  ["Relativstrukturen", "Das ist ein Problem, ___ Tragweite häufig unterschätzt wird.", "dessen", ["deren", "dem", "welches"], "Dessen ist das Genitivattribut zu einem maskulinen Bezugswort."],
  ["Relativstrukturen", "Die Bedingungen, ___ das Projekt fortgesetzt werden kann, sind noch unklar.", "unter denen", ["unter die", "worunter", "deren unter"], "Die Präposition gehört zum Relativpronomen; bei einer statischen Bedingung steht Dativ Plural."],
  ["Relativstrukturen", "Die Studie liefert genau das, ___ die Debatte bisher vermissen ließ.", "was", ["das", "welches", "wessen"], "Nach dem neutralen Demonstrativpronomen das steht häufig ein Relativsatz mit was."],
  ["Infinitivkonstruktionen", "Die Behörde änderte das Verfahren, ohne die Betroffenen rechtzeitig ___.", "informiert zu haben", ["zu informieren gehabt", "informieren zu haben", "informiert haben"], "Der Infinitiv Perfekt markiert, dass die unterlassene Handlung vorher hätte erfolgen müssen."],
  ["Infinitivkonstruktionen", "Die Daten sind zu uneinheitlich, ___ daraus eindeutige Schlüsse gezogen werden könnten.", "als dass", ["sodass", "damit", "ohne dass"], "Zu ... als dass bezeichnet eine Folge, die wegen des hohen Grades nicht eintreten kann."],
  ["Funktionsverbgefüge", "Die neuen Befunde stellen die bisherige Annahme grundsätzlich ___.", "in Frage", ["zur Frage", "unter Frage", "auf die Frage"], "In Frage stellen ist ein festes Funktionsverbgefüge und bedeutet bezweifeln."],
];

grammarCores.forEach((core, coreIndex) => contexts50.forEach((context, variant) => {
  const [subtopic, prompt, answer, distractors, explanation] = core;
  add({
    module: "advanced_grammar",
    type: "mcq",
    subtopic,
    difficulty: 3 + ((coreIndex + variant) % 3),
    prompt: `${context}: ${prompt}`,
    options: [answer, ...distractors],
    answer,
    explanation,
    tags: ["c1", "grammar", subtopic]
  });
}));

const vocabCores = [
  ["学术论证", "Die Autorin ___ die These mit drei unabhängigen Datensätzen.", "untermauert", ["unterstellt", "unterbricht", "unterliegt"], "Eine These untermauern bedeutet, sie durch Belege zu stützen."],
  ["学术论证", "Aus den Befunden lässt sich keine eindeutige Schlussfolgerung ___.", "ableiten", ["einleiten", "zuleiten", "umleiten"], "Eine Schlussfolgerung aus Daten ableiten ist eine feste wissenschaftssprachliche Verbindung."],
  ["学术论证", "Der Beitrag ___ eine Forschungslücke, ohne sie vollständig zu schließen.", "zeigt auf", ["weist ab", "führt aus", "legt um"], "Eine Lücke aufzeigen bedeutet, auf ihr Bestehen aufmerksam zu machen."],
  ["环境与气候", "Die Stadt will den Flächenverbrauch deutlich ___.", "eindämmen", ["einfassen", "einholen", "einprägen"], "Eindämmen bedeutet, eine unerwünschte Entwicklung zu begrenzen."],
  ["环境与气候", "Die Maßnahme soll einen Beitrag zur Senkung der Emissionen ___.", "leisten", ["stellen", "führen", "tragen"], "Einen Beitrag leisten ist die feste Verbindung."],
  ["环境与气候", "Fachleute warnen vor unumkehrbaren ___ für das Ökosystem.", "Folgen", ["Anlässen", "Vorgaben", "Vorkommen"], "Unumkehrbare Folgen bezeichnet nicht rückgängig zu machende Konsequenzen."],
  ["政治与社会", "Der Vorschlag stieß in der Öffentlichkeit auf breite ___.", "Zustimmung", ["Zusage", "Zuständigkeit", "Zumutung"], "Auf Zustimmung stoßen bedeutet positiv aufgenommen werden."],
  ["政治与社会", "Die Regelung soll gesellschaftliche Teilhabe ___.", "ermöglichen", ["erledigen", "ermitteln", "ermahnen"], "Teilhabe ermöglichen bezeichnet das Schaffen realer Beteiligungschancen."],
  ["政治与社会", "Die Entscheidung löste eine kontroverse Debatte ___.", "aus", ["ein", "ab", "vor"], "Eine Debatte auslösen ist eine feste Verb-Nomen-Verbindung."],
  ["经济与劳动", "Das Unternehmen sieht sich mit steigenden Kosten ___.", "konfrontiert", ["konzipiert", "konsolidiert", "kompensiert"], "Sich mit etwas konfrontiert sehen bedeutet, einem Problem gegenüberzustehen."],
  ["经济与劳动", "Die Nachfrage ist im vergangenen Quartal merklich ___.", "zurückgegangen", ["zurückgekehrt", "zurückgelegt", "zurückgeführt"], "Nachfrage geht zurück, wenn weniger Güter oder Leistungen verlangt werden."],
  ["经济与劳动", "Flexible Modelle können zur Vereinbarkeit von Beruf und Familie ___.", "beitragen", ["beibringen", "beitreten", "beifügen"], "Zu etwas beitragen bedeutet eine positive Wirkung auf ein Ziel haben."],
  ["媒体与信息", "Die Meldung ließ sich zunächst nicht unabhängig ___.", "überprüfen", ["überholen", "übergeben", "übersehen"], "Informationen überprüfen bedeutet ihre Richtigkeit kontrollieren."],
  ["媒体与信息", "Die verkürzte Darstellung kann einen falschen Eindruck ___.", "erwecken", ["erheben", "erlernen", "erlangen"], "Einen Eindruck erwecken ist eine feste Kollokation."],
  ["媒体与信息", "Seriöse Beiträge legen ihre Quellen offen und ordnen Behauptungen ___.", "ein", ["an", "um", "aus"], "Etwas einordnen heißt, es in einen größeren Zusammenhang zu stellen."],
  ["教育与研究", "Die Ergebnisse sind nur bedingt auf andere Gruppen ___.", "übertragbar", ["übertrieben", "übertragen", "übergreifend"], "Übertragbar auf beschreibt die begrenzte Generalisierbarkeit von Ergebnissen."],
  ["教育与研究", "Die Studie trägt der sozialen Vielfalt nicht ausreichend ___.", "Rechnung", ["Bilanz", "Zahlung", "Summe"], "Einer Sache Rechnung tragen bedeutet, sie angemessen zu berücksichtigen."],
  ["教育与研究", "Das Modell hat sich in mehreren Untersuchungen als belastbar ___.", "erwiesen", ["bewiesen", "verwiesen", "angewiesen"], "Sich als etwas erweisen bedeutet, sich bei Prüfung als so beschaffen zu zeigen."],
  ["科技与数据", "Die Daten wurden vor der Analyse vollständig ___.", "anonymisiert", ["automatisiert", "autorisiert", "aktualisiert"], "Anonymisieren entfernt oder verändert personenbezogene Identifikatoren."],
  ["科技与数据", "Der Nutzen des Systems muss gegen mögliche Risiken ___ werden.", "abgewogen", ["abgeleitet", "abgelöst", "abgerufen"], "Etwas gegen etwas abwägen bedeutet Vor- und Nachteile vergleichend beurteilen."],
  ["科技与数据", "Der Algorithmus kann bestehende Verzerrungen ___.", "verstärken", ["verstetigen", "verstellen", "verstreichen"], "Verzerrungen verstärken bedeutet ihre Wirkung zu vergrößern."],
  ["健康与伦理", "Die Empfehlung beruht auf einer sorgfältigen Nutzen-Risiko-___.", "Abwägung", ["Abwicklung", "Abstufung", "Abschreibung"], "Nutzen-Risiko-Abwägung ist ein etablierter Ausdruck in Medizin und Ethik."],
  ["健康与伦理", "Die Betroffenen müssen der Verwendung ihrer Daten ausdrücklich ___.", "zustimmen", ["zustehen", "zuschreiben", "zutrauen"], "Einer Verwendung zustimmen verlangt den Dativ."],
  ["健康与伦理", "Der Schutz persönlicher Daten hat hohe ___.", "Priorität", ["Prämisse", "Proportion", "Prognose"], "Hohe Priorität haben bedeutet besonders wichtig sein."],
  ["Kultur und Erinnerung", "Das Museum will unterschiedliche Perspektiven sichtbar ___.", "machen", ["stellen", "führen", "geben"], "Etwas sichtbar machen ist eine feste Verbindung."],
  ["Kultur und Erinnerung", "Die Ausstellung setzt sich kritisch mit kolonialen Kontinuitäten ___.", "auseinander", ["zusammen", "entgegen", "gegenüber"], "Sich mit etwas auseinandersetzen bedeutet es gründlich und kritisch behandeln."],
  ["Kultur und Erinnerung", "Das Werk wird häufig als Wendepunkt in der Literaturgeschichte ___.", "angesehen", ["vorgesehen", "nachgesehen", "zugesehen"], "Als etwas angesehen werden bedeutet entsprechend bewertet oder eingeordnet werden."],
  ["Recht und Verwaltung", "Die Behörde ist an geltendes Recht ___.", "gebunden", ["befunden", "begriffen", "gelegen"], "An Recht gebunden sein bedeutet, nur innerhalb der gesetzlichen Vorgaben handeln zu dürfen."],
  ["Recht und Verwaltung", "Gegen den Bescheid kann innerhalb eines Monats Widerspruch ___ werden.", "eingelegt", ["eingestellt", "eingeleitet", "eingetragen"], "Widerspruch einlegen ist die feste verwaltungsrechtliche Verbindung."],
  ["Recht und Verwaltung", "Die neue Vorschrift tritt zum Monatsbeginn in ___.", "Kraft", ["Macht", "Wirkung", "Geltung"], "In Kraft treten bedeutet rechtlich wirksam werden."],
];

vocabCores.forEach((core, coreIndex) => contexts50.forEach((context, variant) => {
  const [subtopic, prompt, answer, distractors, explanation] = core;
  add({
    module: "advanced_vocab",
    type: "mcq",
    subtopic,
    difficulty: 3 + ((coreIndex * 2 + variant) % 3),
    prompt: `${context}: ${prompt}`,
    options: [answer, ...distractors],
    answer,
    explanation,
    tags: ["c1", "vocabulary", subtopic]
  });
}));

const topicVariants = [
  { theme: "digitale Lehre", themeDative: "digitaler Lehre", actor: "Hochschulen", measure: "ein hybrides Lehrangebot", goal: "mehr zeitliche Flexibilität", goalDative: "mehr zeitlicher Flexibilität" },
  { theme: "städtische Mobilität", themeDative: "städtischer Mobilität", actor: "Kommunen", measure: "ein dichteres Radwegenetz", goal: "weniger Verkehrslärm", goalDative: "weniger Verkehrslärm" },
  { theme: "wissenschaftliche Kommunikation", themeDative: "wissenschaftlicher Kommunikation", actor: "Forschungseinrichtungen", measure: "ein offenes Datenportal", goal: "größere Nachvollziehbarkeit", goalDative: "größerer Nachvollziehbarkeit" },
  { theme: "betriebliche Weiterbildung", themeDative: "betrieblicher Weiterbildung", actor: "Unternehmen", measure: "ein festes Lernzeitmodell", goal: "langfristige Beschäftigungsfähigkeit", goalDative: "langfristiger Beschäftigungsfähigkeit" },
  { theme: "nachhaltige Ernährung", themeDative: "nachhaltiger Ernährung", actor: "öffentliche Kantinen", measure: "ein regionaler Speiseplan", goal: "eine bessere Klimabilanz", goalDative: "einer besseren Klimabilanz" },
  { theme: "kulturelle Teilhabe", themeDative: "kultureller Teilhabe", actor: "Museen", measure: "eine mehrsprachige Vermittlung", goal: "ein leichterer Zugang", goalDative: "einem leichteren Zugang" },
  { theme: "Datenschutz im Alltag", themeDative: "Datenschutz im Alltag", actor: "Plattformbetreiber", measure: "eine verständliche Einwilligung", goal: "mehr Kontrolle für Nutzende", goalDative: "mehr Kontrolle für Nutzende" },
  { theme: "bezahlbares Wohnen", themeDative: "bezahlbarem Wohnen", actor: "Städte", measure: "eine langfristige Bodenpolitik", goal: "ein stabileres Mietniveau", goalDative: "einem stabileren Mietniveau" },
  { theme: "psychische Gesundheit", themeDative: "psychischer Gesundheit", actor: "Universitäten", measure: "eine niedrigschwellige Beratung", goal: "frühzeitige Unterstützung", goalDative: "frühzeitiger Unterstützung" },
  { theme: "Energieeffizienz", themeDative: "Energieeffizienz", actor: "Gebäudeeigentümer", measure: "eine gezielte Sanierung", goal: "ein geringerer Verbrauch", goalDative: "einem geringeren Verbrauch" }
];

const clozeFrames = [
  {
    title: "Zwischen Anspruch und Umsetzung",
    text: "Über {theme} wird seit Jahren intensiv diskutiert. Viele {actor} haben inzwischen erkannt, [[1]] einzelne Pilotprojekte nicht ausreichen. Sie setzen deshalb auf {measure}. Diese Veränderung ist jedoch anspruchsvoller, [[2]] es auf den ersten Blick erscheint. Zum einen fehlen häufig verlässliche Daten, zum anderen sind Zuständigkeiten nicht eindeutig geregelt. [[3]] die Ziele allgemein Zustimmung finden, entstehen bei der konkreten Umsetzung Konflikte. Fachleute empfehlen daher, Betroffene früh einzubeziehen, [[4]] praktische Hindernisse sichtbar werden. Ein solches Vorgehen kostet zunächst Zeit, kann spätere Korrekturen [[5]] vermeiden. Entscheidend ist außerdem, dass Erfolge nicht nur angekündigt, [[6]] anhand transparenter Kriterien überprüft werden. Erst dann lässt sich beurteilen, [[7]] {goal} tatsächlich erreicht wird. Die Erfahrungen zeigen: Je klarer Verantwortlichkeiten benannt sind, [[8]] eher werden vereinbarte Schritte umgesetzt. Maßnahmen sollten zudem angepasst werden können, [[9]] sich die Rahmenbedingungen ändern. Nachhaltig ist der Wandel nur, [[10]] Lernen und Nachsteuern ausdrücklich vorgesehen sind.",
    blanks: [
      ["dass", ["obwohl", "indem", "sodass"], "Dass leitet einen Inhaltssatz ein."], ["als", ["wie", "wenn", "denn"], "Nach einem Komparativ steht als."],
      ["Obwohl", ["Damit", "Sobald", "Weil"], "Obwohl markiert den Gegensatz zwischen Zustimmung und Konflikten."], ["damit", ["ob", "während", "anstatt"], "Damit drückt den Zweck der frühen Beteiligung aus."],
      ["aber", ["sondern", "denn", "oder"], "Aber verbindet Kosten und möglichen Nutzen adversativ."], ["sondern", ["aber", "noch", "beziehungsweise"], "Nicht nur wird mit sondern kontrastiv fortgesetzt."],
      ["ob", ["dass", "weil", "als"], "Ob leitet eine indirekte Entscheidungsfrage ein."], ["desto", ["als", "dennoch", "soweit"], "Je wird durch desto ergänzt."],
      ["falls", ["zumal", "obgleich", "sodass"], "Falls bezeichnet eine mögliche Bedingung."], ["wenn", ["während", "obwohl", "indem"], "Wenn formuliert die notwendige Bedingung für nachhaltigen Wandel."]
    ]
  },
  {
    title: "Was Kennzahlen leisten können",
    text: "Bei {themeDative} spielen Kennzahlen eine wachsende Rolle. Sie versprechen Übersicht, [[1]] komplexe Entwicklungen auf wenige Werte reduziert werden. Gerade darin liegt jedoch auch ein Risiko: Was leicht messbar ist, muss nicht zwangsläufig das sein, [[2]] für die Betroffenen besonders wichtig ist. {actor} sollten Kennzahlen deshalb nicht isoliert verwenden, [[3]] sie durch qualitative Beobachtungen ergänzen. Eine Zahl gewinnt erst Bedeutung, [[4]] klar ist, wie sie erhoben wurde und welche Annahmen dahinterstehen. Vergleiche sind außerdem nur sinnvoll, [[5]] dieselben Kriterien angewandt werden. Werden Daten ohne Kontext veröffentlicht, können sie Fehlinterpretationen eher fördern [[6]] verhindern. Transparenz bedeutet daher nicht, möglichst viele Tabellen bereitzustellen, [[7]] Auswahl und Grenzen verständlich zu erklären. {measure} kann hierzu beitragen, sofern die Informationen regelmäßig aktualisiert werden. Auf diese Weise entsteht kein vollkommenes Bild, wohl [[8]] eine belastbarere Grundlage für Entscheidungen. Ziel sollte sein, Kennzahlen so einzusetzen, [[9]] sie Diskussionen strukturieren, ohne Urteilskraft zu ersetzen. Nur unter dieser Voraussetzung lässt sich {goal} [[10]].",
    blanks: [
      ["indem", ["obwohl", "sobald", "falls"], "Indem beschreibt das Mittel der Reduktion."], ["was", ["das", "dessen", "wie"], "Nach das steht ein freier Relativsatz mit was."],
      ["sondern", ["oder", "denn", "jedoch"], "Nicht isoliert, sondern ergänzt formuliert eine Korrektur."], ["wenn", ["ob", "als", "während"], "Wenn nennt die Bedingung für interpretierbare Zahlen."],
      ["sofern", ["zumal", "obwohl", "damit"], "Sofern bezeichnet eine Voraussetzung."], ["als", ["wie", "denn", "sondern"], "Nach eher steht im Vergleich als."],
      ["sondern", ["aber", "und", "beziehungsweise"], "Nicht ..., sondern ... korrigiert die erste Vorstellung."], ["aber", ["auch", "noch", "gar"], "Wohl aber verstärkt einen eingeschränkten Gegensatz."],
      ["dass", ["als ob", "während", "weshalb"], "So ..., dass beschreibt die beabsichtigte Art und Folge."], ["erreichen", ["erreicht", "zu erreicht", "erreichend"], "Nach sich lassen steht der reine Infinitiv."]
    ]
  },
  {
    title: "Beteiligung ist mehr als Zustimmung",
    text: "Wenn {actor} über {theme} entscheiden, wird häufig mehr Beteiligung gefordert. Der Begriff bleibt allerdings unscharf, [[1]] nicht geklärt wird, worüber tatsächlich mitentschieden werden kann. Eine Befragung schafft noch keine Mitwirkung, [[2]] ihre Ergebnisse folgenlos bleiben. Glaubwürdig wird das Verfahren erst, wenn Verantwortliche offenlegen, welche Vorschläge übernommen werden und [[3]] andere nicht umgesetzt werden können. Dazu gehört auch, Zielkonflikte sichtbar zu machen, [[4]] einfache Lösungen zu versprechen. {measure} bietet eine Chance, unterschiedliche Erfahrungen einzubeziehen. Es sollte jedoch vermieden werden, immer nur diejenigen zu hören, [[5]] ohnehin über Zeit und Ressourcen verfügen. Je vielfältiger die Gruppe zusammengesetzt ist, [[6]] breiter ist die Wissensbasis. Gleichzeitig braucht Beteiligung klare Fristen, damit Entscheidungen nicht unbegrenzt [[7]]. Werden Erwartungen früh geklärt, lässt sich Enttäuschung zwar nicht völlig ausschließen, [[8]] deutlich verringern. Beteiligung ist somit kein Ersatz für Verantwortung, [[9]] eine Form, Entscheidungen besser zu begründen. Sie kann zu {goalDative} beitragen, vorausgesetzt, dass Rückmeldungen nachvollziehbar [[10]].",
    blanks: [
      ["solange", ["obwohl", "indem", "sobald"], "Solange beschreibt einen andauernden unzureichenden Zustand."], ["wenn", ["als", "damit", "ob"], "Wenn nennt die Bedingung, unter der die Befragung wirkungslos bleibt."],
      ["warum", ["wann", "ob", "wo"], "Warum fragt nach der Begründung nicht umgesetzter Vorschläge."], ["anstatt", ["ohne", "um", "seit"], "Anstatt zu stellt die bessere Alternative gegenüber."],
      ["die", ["denen", "deren", "was"], "Das Relativpronomen ist Subjekt im Plural."], ["desto", ["als", "während", "dennoch"], "Je verlangt desto oder umso."],
      ["aufgeschoben werden", ["werden aufgeschoben", "aufgeschoben worden", "zu aufschieben"], "Im damit-Satz steht das Passiv am Satzende."], ["aber", ["sondern", "denn", "oder"], "Zwar wird mit aber fortgesetzt."],
      ["sondern", ["doch", "noch", "beziehungsweise"], "Kein Ersatz, sondern eine Form ist eine kontrastive Korrektur."], ["bearbeitet werden", ["werden bearbeitet", "bearbeitet worden", "zu bearbeiten"], "Nach dass steht die Passivgruppe am Ende."]
    ]
  },
  {
    title: "Die Grenzen schneller Lösungen",
    text: "In Debatten über {theme} wächst der Druck, rasch sichtbare Ergebnisse zu liefern. Schnelligkeit kann sinnvoll sein, [[1]] akute Probleme nicht weiter verschärft werden. Sie darf jedoch nicht dazu führen, dass Nebenwirkungen übersehen werden. Eine Maßnahme wie {measure} entfaltet ihre Wirkung nur, [[2]] sie in eine längerfristige Strategie eingebettet ist. Andernfalls besteht die Gefahr, Symptome zu behandeln, [[3]] strukturelle Ursachen bestehen bleiben. {actor} müssen deshalb kurzfristige Entlastung und nachhaltige Veränderung miteinander [[4]]. Das setzt voraus, dass Ziele priorisiert und Ressourcen realistisch eingeschätzt werden. Nicht jede Verzögerung ist ein Zeichen mangelnden Willens; manchmal ist sie erforderlich, [[5]] Betroffene anzuhören oder rechtliche Fragen zu klären. Zugleich kann der Hinweis auf Komplexität als Vorwand dienen, [[6]] überhaupt nicht zu handeln. Eine überzeugende Strategie benennt daher sowohl den nächsten Schritt [[7]] auch die Kriterien für spätere Anpassungen. Sie erklärt, welche Unsicherheiten bestehen, [[8]] aus Fehlern gelernt werden soll. So wird Tempo nicht zum Selbstzweck, sondern zu einem Faktor, [[9]] neben Qualität und Akzeptanz abgewogen wird. {goal} ist nur erreichbar, wenn schnelle Entscheidungen und sorgfältige Prüfung nicht als Gegensätze [[10]].",
    blanks: [
      ["damit", ["obwohl", "sobald", "indem"], "Damit nennt den Zweck schnellen Handelns."], ["wenn", ["als", "ob", "während"], "Wenn formuliert eine notwendige Bedingung."],
      ["während", ["damit", "zumal", "sodass"], "Während kontrastiert Symptombehandlung und fortbestehende Ursachen."], ["verbinden", ["verbunden", "zu verbinden", "verbindlich"], "Miteinander verbinden verlangt den Infinitiv nach müssen."],
      ["um", ["ohne", "statt", "seit"], "Um ... zu drückt einen Zweck aus."], ["um", ["ohne", "als", "bei"], "Als Vorwand dienen, um nicht zu handeln beschreibt den verdeckten Zweck."],
      ["als", ["wie", "und", "oder"], "Sowohl wird mit als auch fortgesetzt."], ["und wie", ["sowie", "oder ob", "anstatt"], "Die Aufzählung verbindet Unsicherheiten mit der Art des Lernens."],
      ["der", ["den", "dessen", "dem"], "Der Relativsatz bezieht sich auf Faktor und hat ein maskulines Subjekt."], ["behandelt werden", ["werden behandelt", "behandelt worden", "zu behandeln"], "Im wenn-Satz steht das Passiv am Satzende."]
    ]
  },
  {
    title: "Vertrauen durch nachvollziehbare Verfahren",
    text: "Vertrauen entsteht bei {theme} selten durch einzelne Versprechen. Wichtiger ist, [[1]] Entscheidungen nachvollziehbar zustande kommen. {actor} sollten daher früh erklären, welche Ziele sie verfolgen und nach welchen Kriterien Alternativen bewertet werden. Transparenz bedeutet allerdings nicht, [[2]] jede interne Überlegung sofort veröffentlicht wird. Sie verlangt vielmehr, relevante Informationen so aufzubereiten, [[3]] auch fachfremde Personen sie verstehen können. {measure} kann dabei helfen, darf persönliche Beratung aber nicht vollständig [[4]]. Besonders sensibel sind Situationen, in denen Daten fehlen oder Prognosen unsicher sind. Wer diese Unsicherheit verschweigt, riskiert später einen größeren Vertrauensverlust, [[5]] wer Grenzen offen benennt. Ebenso wichtig ist ein Verfahren für Beschwerden, damit Fehler nicht nur festgestellt, sondern auch [[6]] werden. Je schneller eine begründete Rückmeldung erfolgt, [[7]] eher fühlen sich Betroffene ernst genommen. Vertrauen lässt sich zwar nicht anordnen, wohl aber durch verlässliches Handeln [[8]]. Dazu gehört, Zusagen einzuhalten und Abweichungen zu begründen. Wird Kritik lediglich als Störung betrachtet, bleibt {goal} außer Reichweite. Sieht man sie dagegen als Informationsquelle, können Verfahren verbessert werden, [[9]] ihre grundlegenden Ziele aufzugeben. Glaubwürdigkeit zeigt sich letztlich darin, [[10]] Organisationen mit Einwänden umgehen.",
    blanks: [
      ["dass", ["ob", "weil", "indem"], "Dass leitet den Inhaltssatz nach wichtig ist ein."], ["dass", ["obwohl", "damit", "sobald"], "Dass ergänzt die verneinte Gleichsetzung von Transparenz."],
      ["dass", ["als", "während", "zumal"], "So ..., dass beschreibt eine verständliche Aufbereitung."], ["ersetzen", ["ersetzt", "zu ersetzen", "ersetzend"], "Nach dürfen steht der reine Infinitiv."],
      ["als", ["wie", "denn", "sobald"], "Nach größer steht als."], ["korrigiert", ["korrigieren", "korrigierend", "zu korrigiert"], "Nach sondern auch steht parallel zum Partizip festgestellt ein Partizip II."],
      ["desto", ["als", "dennoch", "sodass"], "Je wird mit desto fortgeführt."], ["fördern", ["gefördert", "zu fördern", "fördernd"], "Nach sich lassen steht der Infinitiv."],
      ["ohne", ["statt", "um", "seit"], "Ohne ... zu bezeichnet eine nicht eintretende Begleithandlung."], ["wie", ["dass", "ob", "wann"], "Wie leitet einen Modalsatz beziehungsweise eine indirekte Frage nach der Art ein."]
    ]
  }
];

const alternateClozeFrames = [
  {
    title: "Pilotprojekte richtig auswerten",
    text: "Pilotprojekte zu {themeDative} sind hilfreich, [[1]] sie liefern noch keinen Beweis für eine allgemeine Wirkung. Zunächst muss geklärt werden, [[2]] {measure} unter unterschiedlichen Bedingungen funktioniert. Geeignete Kriterien sollten feststehen, [[3]] der Versuch beginnt. Nur so lassen sich spätere Ergebnisse vergleichen. Ebenso wichtig ist eine ausreichend lange Laufzeit, [[4]] kurzfristige Schwankungen nicht mit dauerhaften Veränderungen verwechselt werden. Die Auswertung darf nicht nur Erfolge nennen, [[5]] muss auch unerwartete Nebenwirkungen dokumentieren. Ein Ergebnis ist besonders belastbar, [[6]] mehrere Datenquellen in dieselbe Richtung weisen. Darüber hinaus sollte erklärt werden, [[7]] aus dem Versuch gelernt wurde. Je transparenter Auswahl und Methode sind, [[8]] leichter können Außenstehende die Schlussfolgerungen prüfen. Pilotprojekte sollten erweitert werden, [[9]] offene Fragen zu verschweigen. Erst danach kann entschieden werden, ob {goal} auch in größerem Maßstab erreicht [[10]].",
    blanks: [
      ["aber", ["denn", "oder", "sondern"], "Aber begrenzt die Aussagekraft von Pilotprojekten."], ["ob", ["dass", "weil", "damit"], "Ob leitet eine indirekte Entscheidungsfrage ein."],
      ["bevor", ["nachdem", "obwohl", "sodass"], "Die Kriterien müssen vor Beginn feststehen."], ["damit", ["während", "falls", "zumal"], "Damit bezeichnet den Zweck der längeren Laufzeit."],
      ["sondern", ["aber", "noch", "oder"], "Nicht nur wird mit sondern fortgesetzt."], ["wenn", ["als", "ob", "seit"], "Wenn nennt eine Bedingung für Belastbarkeit."],
      ["was", ["dass", "wie viel", "dessen"], "Was fragt nach dem Inhalt des Gelernten."], ["desto", ["als", "dennoch", "soweit"], "Je verlangt desto oder umso."],
      ["ohne", ["um", "statt", "seit"], "Ohne ... zu bezeichnet eine vermiedene Begleithandlung."], ["werden kann", ["kann werden", "worden ist", "zu werden"], "Im ob-Satz steht das Modalverb am Ende."]
    ]
  },
  {
    title: "Zielkonflikte offen benennen",
    text: "Bei {themeDative} treffen unterschiedliche Interessen aufeinander. Ein Zielkonflikt verschwindet nicht, [[1]] man ihn sprachlich vereinfacht. Wer nur Vorteile verspricht, riskiert, [[2]] spätere Belastungen als Täuschung wahrgenommen werden. Verantwortliche sollten deshalb erklären, welche Gruppen profitieren und [[3]] zusätzliche Kosten tragen müssen. Das bedeutet nicht, jede Entscheidung so lange aufzuschieben, [[4]] alle Beteiligten vollständig zufrieden sind. Es bedeutet vielmehr, Kriterien zu nennen, [[5]] denen Prioritäten gesetzt werden. {measure} kann sinnvoll sein, vorausgesetzt, [[6]] seine Wirkungen regelmäßig überprüft werden. Zeigen sich Nachteile, müssen Anpassungen möglich sein, [[7]] das ursprüngliche Ziel sofort aufzugeben. Je früher Konflikte sichtbar werden, [[8]] sachlicher lässt sich über Alternativen sprechen. Transparenz schafft zwar keinen Konsens, [[9]] sie verbessert die Grundlage der Entscheidung. Auf diese Weise kann {goal} verfolgt werden, [[10]] berechtigte Einwände zu ignorieren.",
    blanks: [
      ["indem", ["obwohl", "sobald", "falls"], "Indem bezeichnet hier das unzureichende Mittel der Vereinfachung."], ["dass", ["ob", "damit", "während"], "Dass leitet den Inhalt nach riskieren ein."],
      ["wer", ["was", "wann", "wo"], "Wer fragt nach den betroffenen Gruppen."], ["bis", ["seit", "während", "obwohl"], "Bis markiert die zeitliche Grenze des Aufschubs."],
      ["nach", ["mit", "aus", "gegen"], "Prioritäten werden nach Kriterien gesetzt."], ["dass", ["ob", "als", "wenn auch"], "Vorausgesetzt, dass leitet eine Bedingung ein."],
      ["ohne", ["um", "statt", "seit"], "Ohne ... zu bezeichnet das nicht aufgegebene Ziel."], ["desto", ["als", "sodass", "dennoch"], "Je wird mit desto fortgeführt."],
      ["aber", ["sondern", "denn", "oder"], "Zwar wird durch aber ergänzt."], ["ohne", ["damit", "anstatt dass", "seit"], "Ohne ... zu beschreibt die zu vermeidende Begleithandlung."]
    ]
  },
  {
    title: "Verantwortung braucht Zuständigkeit",
    text: "Reformen zu {themeDative} scheitern häufig nicht an fehlenden Ideen, [[1]] an unklaren Zuständigkeiten. Wenn mehrere Stellen beteiligt sind, muss erkennbar bleiben, [[2]] eine Entscheidung trifft und wer ihre Umsetzung kontrolliert. {actor} sollten Aufgaben deshalb schriftlich festhalten, [[3]] Verantwortliche später nicht aufeinander verweisen. {measure} entfaltet nur dann Wirkung, [[4]] ausreichend Personal und Zeit vorgesehen sind. Außerdem braucht es eine Stelle, an [[5]] sich Betroffene mit Rückfragen wenden können. Zuständigkeit bedeutet jedoch nicht, [[6]] Entscheidungen ohne Austausch getroffen werden. Fachwissen sollte dort einbezogen werden, [[7]] es für die jeweilige Frage notwendig ist. Je klarer die Rollen verteilt sind, [[8]] schneller lassen sich Probleme bearbeiten. Fehler müssen dokumentiert werden, [[9]] sie sich nicht wiederholen. So steigt die Chance, [[10]] {goal} dauerhaft erreicht wird.",
    blanks: [
      ["sondern", ["aber", "denn", "oder"], "Nicht an ..., sondern an ... korrigiert die Ursache."], ["wer", ["was", "wo", "wann"], "Wer fragt nach der handelnden Person oder Stelle."],
      ["damit", ["obwohl", "während", "sobald"], "Damit nennt den Zweck der schriftlichen Festlegung."], ["wenn", ["als", "ob", "seit"], "Wenn formuliert eine notwendige Bedingung."],
      ["die", ["der", "deren", "was"], "An die bezieht sich auf die feminine Stelle."], ["dass", ["ob", "weil", "damit"], "Dass ergänzt die verneinte Gleichsetzung."],
      ["wo", ["wessen", "wann", "ob"], "Wo bezeichnet hier den sachlichen Bereich der Einbeziehung."], ["desto", ["als", "jedoch", "soweit"], "Je verlangt desto."],
      ["damit", ["obwohl", "indem", "falls"], "Damit bezeichnet den Zweck der Dokumentation."], ["dass", ["ob", "wie", "während"], "Dass leitet den Inhalt nach Chance ein."]
    ]
  },
  {
    title: "Vom Einzelfall zur tragfähigen Regel",
    text: "Ein erfolgreiches Beispiel zu {themeDative} wirkt überzeugend. Daraus folgt jedoch nicht, [[1]] dieselbe Lösung überall funktioniert. Regionen unterscheiden sich hinsichtlich ihrer Ressourcen, ihrer Infrastruktur und der Gruppen, [[2]] sie erreichen müssen. Bevor {measure} übertragen wird, sollte daher geprüft werden, welche Bedingungen im ursprünglichen Fall entscheidend [[3]]. Manche Elemente lassen sich direkt übernehmen, [[4]] andere angepasst werden müssen. Eine Übertragung ist besonders riskant, [[5]] nur sichtbare Ergebnisse, nicht aber ihre Ursachen betrachtet werden. Deshalb empfiehlt es sich, zunächst mehrere Varianten zu testen, [[6]] sofort eine einheitliche Regel einzuführen. Je größer die Unterschiede zwischen den Standorten sind, [[7]] vorsichtiger sollte der Vergleich ausfallen. Eine Regel kann trotzdem sinnvoll sein, [[8]] sie genügend Raum für begründete Abweichungen lässt. Ihr Erfolg zeigt sich nicht daran, dass jeder Ort identisch handelt, [[9]] daran, dass gemeinsame Ziele überprüfbar bleiben. Unter diesen Bedingungen lässt sich {goal} fördern, [[10]] lokale Erfahrung zu entwerten.",
    blanks: [
      ["dass", ["ob", "damit", "weil"], "Dass leitet den Inhalt der verneinten Folgerung ein."], ["die", ["denen", "deren", "was"], "Die ist Akkusativobjekt zu erreichen und bezieht sich auf Gruppen."],
      ["waren", ["wurden", "seien", "hätten"], "Im indirekten Fragesatz steht das Prädikat am Ende."], ["während", ["damit", "sodass", "zumal"], "Während kontrastiert Übernahme und Anpassung."],
      ["wenn", ["als", "ob", "seit"], "Wenn nennt die riskante Bedingung."], ["anstatt", ["ohne", "um", "seit"], "Anstatt ... zu stellt die Alternative gegenüber."],
      ["desto", ["als", "dennoch", "soweit"], "Je wird durch desto ergänzt."], ["sofern", ["obwohl", "zumal", "sodass"], "Sofern bezeichnet eine Voraussetzung."],
      ["sondern", ["aber", "oder", "denn"], "Nicht daran, sondern daran formuliert eine Korrektur."], ["ohne", ["um", "seit", "während"], "Ohne ... zu bezeichnet eine vermiedene Folge."]
    ]
  },
  {
    title: "Aus Rückmeldungen lernen",
    text: "Rückmeldungen zu {themeDative} sind mehr als eine abschließende Bewertung. Sie zeigen, [[1]] eine Maßnahme im Alltag tatsächlich erlebt wird. {actor} sollten deshalb nicht erst reagieren, [[2]] Beschwerden öffentlich werden. Regelmäßige Rückfragen helfen, Schwierigkeiten früh zu erkennen und Lösungen gemeinsam [[3]]. Dabei ist wichtig, nicht nur besonders laute Stimmen zu hören, [[4]] unterschiedliche Gruppen gezielt einzubeziehen. {measure} sollte anhand klarer Fragen bewertet werden, [[5]] allgemeine Zufriedenheit allein wenig über konkrete Probleme aussagt. Kritik ist besonders nützlich, wenn sie Beispiele nennt und erklärt, [[6]] eine Änderung nötig ist. Je schneller eine begründete Antwort erfolgt, [[7]] eher bleiben Beteiligte zum weiteren Austausch bereit. Nicht jeder Vorschlag kann umgesetzt werden; Verantwortliche sollten jedoch erläutern, [[8]] sie ihn übernehmen oder ablehnen. Auf diese Weise werden Rückmeldungen nicht gesammelt, [[9]] folgenlos zu bleiben. Sie tragen vielmehr dazu bei, [[10]] {goal} schrittweise erreicht wird.",
    blanks: [
      ["wie", ["dass", "ob", "wann"], "Wie fragt nach der Art des Erlebens."], ["wenn", ["als", "obwohl", "seit"], "Wenn bezeichnet den Zeitpunkt beziehungsweise die Bedingung der Reaktion."],
      ["zu entwickeln", ["entwickelt", "entwickeln zu", "entwickelnd"], "Helfen kann mit zu-Infinitiv verbunden werden."], ["sondern", ["aber", "oder", "denn"], "Nicht nur wird mit sondern fortgesetzt."],
      ["weil", ["obwohl", "damit", "sobald"], "Weil nennt den Grund für klare Fragen."], ["warum", ["wo", "wann", "dessen"], "Warum fragt nach der Begründung einer Änderung."],
      ["desto", ["als", "dennoch", "soweit"], "Je verlangt desto oder umso."], ["warum", ["ob", "wann", "dessen"], "Warum leitet die Begründung für Übernahme oder Ablehnung ein."],
      ["um", ["ohne", "statt", "seit"], "Nicht gesammelt, um folgenlos zu bleiben markiert den verneinten Zweck."], ["dass", ["ob", "wie", "während"], "Dazu beitragen, dass leitet einen Inhaltssatz ein."]
    ]
  }
];

const expandedClozeFrames = [...clozeFrames, ...alternateClozeFrames];
expandedClozeFrames.forEach((frame, frameIndex) => topicVariants.forEach((topic, variantIndex) => {
  const passageId = `DS-A-P-CLOZE-${String(frameIndex * topicVariants.length + variantIndex + 1).padStart(3, "0")}`;
  const text = Object.entries(topic).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), frame.text);
  passages.push({ id: passageId, module: "advanced_cloze", title: `${frame.title}: ${topic.theme}`, text, blankCount: 10 });
  frame.blanks.forEach(([answer, distractors, explanation], blankIndex) => add({
    module: "advanced_cloze",
    type: "mcq",
    subtopic: blankIndex < 3 ? "篇章衔接" : blankIndex < 7 ? "句法重构" : "语篇逻辑",
    difficulty: 3 + ((frameIndex + variantIndex + blankIndex) % 3),
    prompt: `请选择最适合第 ${blankIndex + 1} 空的表达。`,
    options: [answer, ...distractors],
    answer,
    explanation,
    passageId,
    blankNo: blankIndex + 1,
    tags: ["c1", "cloze", "discourse"]
  }));
}));

const readingTopics = [
  { title: "Vier-Tage-Woche", thesis: "Eine kürzere Arbeitswoche kann produktiv sein, wenn Abläufe zugleich neu organisiert werden.", evidence: "In Pilotbetrieben sanken Fehlzeiten, während die bearbeiteten Aufträge weitgehend stabil blieben.", limitation: "Die Ergebnisse lassen sich nicht ohne Weiteres auf Pflege, Handel oder saisonale Arbeit übertragen.", counter: "Kritiker warnen vor Arbeitsverdichtung und höheren Übergabekosten.", recommendation: "Betriebe sollten Arbeitszeit, Aufgabenverteilung und Erreichbarkeit gemeinsam erproben.", consequence: "Ohne organisatorische Änderungen wird freie Zeit leicht durch höheren Zeitdruck erkauft." },
  { title: "Offene Forschungsdaten", thesis: "Offene Daten erhöhen den wissenschaftlichen Nutzen, benötigen aber klare Qualitäts- und Datenschutzregeln.", evidence: "Gut dokumentierte Datensätze ermöglichen unabhängige Nachanalysen und neue Fragestellungen.", limitation: "Personenbezogene oder sicherheitsrelevante Daten können nicht vollständig geöffnet werden.", counter: "Manche Forschende fürchten zusätzlichen Aufwand und eine Nutzung ohne angemessene Anerkennung.", recommendation: "Förderinstitutionen sollten Dokumentation, sichere Zugänge und Zitierstandards finanzieren.", consequence: "Ohne Pflege und Kontext können veröffentlichte Dateien mehr Verwirrung als Transparenz erzeugen." },
  { title: "Begrünte Innenstädte", thesis: "Städtisches Grün wirkt am besten als zusammenhängende Infrastruktur und nicht als einzelne Dekoration.", evidence: "Baumreihen und entsiegelte Flächen senken lokal die Temperatur und nehmen Starkregen auf.", limitation: "In dicht bebauten Quartieren konkurrieren Grünflächen mit Verkehr, Leitungen und Wohnraum.", counter: "Gegner verweisen auf Pflegekosten und den Verlust von Parkplätzen.", recommendation: "Kommunen sollten besonders belastete Straßen priorisieren und Anwohnende früh beteiligen.", consequence: "Unkoordinierte Einzelprojekte bleiben ökologisch schwach und können soziale Konflikte verschärfen." },
  { title: "Künstliche Intelligenz in Prüfungen", thesis: "Neue Werkzeuge machen transparente Lernziele wichtiger als pauschale Verbote.", evidence: "Aufgaben mit Prozessdokumentation zeigen besser, welche Entscheidungen Lernende selbst getroffen haben.", limitation: "Nicht alle Studierenden verfügen über denselben Zugang oder dieselbe Erfahrung mit den Werkzeugen.", counter: "Ein Teil der Lehrenden befürchtet, eigenständiges Schreiben lasse sich kaum noch prüfen.", recommendation: "Hochschulen sollten erlaubte Hilfen definieren und Reflexion über den Arbeitsprozess bewerten.", consequence: "Unklare Regeln fördern Unsicherheit und begünstigen uneinheitliche Sanktionen." },
  { title: "Mehrsprachige Verwaltung", thesis: "Mehrsprachige Informationen erleichtern Zugang, ersetzen aber keine verständliche Verwaltungssprache.", evidence: "Pilotstellen verzeichneten weniger Rückfragen, nachdem zentrale Formulare sprachlich vereinfacht worden waren.", limitation: "Für seltene Sprachen stehen nicht überall qualifizierte Übersetzungen kurzfristig zur Verfügung.", counter: "Kritiker sehen hohe Kosten und befürchten widersprüchliche Fassungen.", recommendation: "Behörden sollten häufige Anliegen priorisieren und Übersetzungen fachlich prüfen lassen.", consequence: "Wer nur zusätzliche Sprachen anbietet, komplizierte Ausgangstexte aber beibehält, löst das Grundproblem nicht." },
  { title: "Reparieren statt Wegwerfen", thesis: "Reparatur wird erst attraktiv, wenn Produkte, Ersatzteile und Dienstleistungen gemeinsam betrachtet werden.", evidence: "Längere Garantiezeiten erhöhen bei Herstellern den Anreiz für austauschbare Bauteile.", limitation: "Bei sehr alten oder energieintensiven Geräten kann ein Austausch ökologisch sinnvoller sein.", counter: "Unternehmen warnen vor höheren Produktionskosten und längeren Lieferketten für Ersatzteile.", recommendation: "Politik sollte Reparierbarkeit messbar machen und unabhängigen Werkstätten Zugang zu Informationen geben.", consequence: "Ein Recht auf Reparatur bleibt wirkungslos, wenn Ersatzteile teurer als ein Neugerät sind." },
  { title: "Wissenschaftliche Podcasts", thesis: "Podcasts können Forschung zugänglich machen, müssen Unsicherheit und Quellen dennoch sichtbar halten.", evidence: "Erzählende Formate erreichen Gruppen, die klassische Fachtexte selten lesen.", limitation: "Komplexe Methoden lassen sich in kurzen Folgen nur vereinfacht erklären.", counter: "Forschende befürchten, Zuspitzungen könnten vorläufige Ergebnisse als Gewissheiten darstellen.", recommendation: "Redaktionen sollten Quellen verlinken und zwischen Befund, Deutung und Meinung unterscheiden.", consequence: "Fehlt diese Trennung, wächst zwar Reichweite, aber nicht unbedingt Verständnis." },
  { title: "Lebenslanges Lernen", thesis: "Weiterbildung braucht verlässliche Zeit und Beratung, nicht nur eine große Zahl digitaler Kurse.", evidence: "Beschäftigte schließen Angebote häufiger ab, wenn Lernzeiten als Arbeitszeit anerkannt werden.", limitation: "Kleine Betriebe können Ausfälle oft schwerer auffangen als große Organisationen.", counter: "Arbeitgeber verweisen auf Kosten und das Risiko, dass Qualifizierte anschließend wechseln.", recommendation: "Branchenfonds und modulare Angebote können Aufwand und Nutzen breiter verteilen.", consequence: "Ohne zeitliche Entlastung nutzen vor allem jene die Angebote, die bereits gute Voraussetzungen haben." },
  { title: "Bürgerhaushalte", thesis: "Bürgerhaushalte stärken Beteiligung nur, wenn Entscheidungsspielraum und Umsetzung sichtbar sind.", evidence: "Kommunen mit klaren Budgets erhalten konkretere und besser vergleichbare Vorschläge.", limitation: "Komplexe Pflichtausgaben lassen sich in kurzen Beteiligungsverfahren kaum vermitteln.", counter: "Kritiker bemängeln, aktive kleine Gruppen könnten die Auswahl dominieren.", recommendation: "Zufallsauswahl, offene Treffen und digitale Kanäle sollten kombiniert werden.", consequence: "Werden gewählte Projekte wiederholt nicht umgesetzt, sinkt das Vertrauen stärker als zuvor." },
  { title: "Digitale Archive", thesis: "Digitalisierung schützt kulturelles Erbe nur zusammen mit langfristiger Pflege und guter Erschließung.", evidence: "Durchsuchbare Metadaten machen verstreute Bestände erstmals gemeinsam auffindbar.", limitation: "Urheberrechte und empfindliche Originale begrenzen eine vollständige Online-Verfügbarkeit.", counter: "Einige Einrichtungen fürchten, digitale Angebote könnten Besuche vor Ort verdrängen.", recommendation: "Archive sollten offene Formate, dauerhafte Speicher und verständliche Kontextinformationen verwenden.", consequence: "Dateien ohne Metadaten bleiben trotz technischer Verfügbarkeit praktisch unsichtbar." }
];

const readingFrames = [
  ["Ein aktueller Diskussionsbeitrag vertritt folgende Position", "Als wichtigsten Hinweis nennt der Text", "Allerdings wird eine Grenze ausdrücklich benannt", "Dem steht ein Einwand gegenüber", "Daraus folgt die Empfehlung", "Bleibt sie unbeachtet, ergibt sich folgende Konsequenz"],
  ["In der öffentlichen Debatte wird häufig vereinfacht. Der vorliegende Beitrag argumentiert dagegen", "Zur Begründung verweist er darauf", "Die Aussage gilt jedoch nicht unbegrenzt", "Kritische Stimmen wenden ein", "Der Text schlägt deshalb vor", "Ohne diesen Schritt ist zu erwarten"],
  ["Der Text untersucht nicht, ob Veränderung nötig ist, sondern unter welchen Bedingungen sie gelingt. Seine These lautet", "Empirisch gestützt wird sie durch den Befund", "Bei der Übertragung ist zu beachten", "Ein verbreiteter Einwand lautet", "Als praktikabler Weg wird empfohlen", "Andernfalls besteht das Risiko"],
  ["Zwischen hohen Erwartungen und praktischer Umsetzung liegt oft eine Lücke. Der Beitrag fasst sie so", "Ein Beispiel liefert der Befund", "Zugleich schränkt der Autor ein", "Skeptiker betonen", "Um beide Seiten zu berücksichtigen, wird vorgeschlagen", "Fehlt diese Verbindung, dann gilt"],
  ["Die Frage wird im Text bewusst abwägend behandelt. Im Zentrum steht die Aussage", "Für diese Einschätzung spricht", "Nicht übersehen werden darf", "Dagegen lässt sich einwenden", "Die vorgeschlagene Lösung lautet", "Ein bloßes Weiter-so hätte zur Folge"],
  ["Ausgangspunkt ist eine verbreitete Hoffnung. Der Text präzisiert sie mit der These", "Als belastbarer Hinweis dient", "Der Geltungsbereich bleibt begrenzt, denn", "Gleichzeitig wird die Gegenposition genannt", "Der Autor empfiehlt", "Ohne diese Voraussetzung droht"],
  ["Der Kommentar warnt vor einfachen Antworten und hält fest", "Seine Begründung stützt sich auf", "Eine wichtige Einschränkung lautet", "Kritische Stimmen machen geltend", "Als nächster Schritt wird vorgeschlagen", "Geschieht das nicht, dann"],
  ["Der Bericht verbindet Nutzen und Bedingungen. Seine Kernaussage ist", "Besonders aussagekräftig ist", "Vorsicht ist dennoch nötig, weil", "Als Gegenargument erscheint", "Die Schlussfolgerung für die Praxis lautet", "Eine Vernachlässigung führt dazu"],
  ["Im Mittelpunkt steht die Qualität der Umsetzung. Der Text behauptet", "Diese Position wird konkretisiert durch", "Sie wird zugleich relativiert", "Der Einwand lautet", "Daraus wird folgende Empfehlung entwickelt", "Ohne Anpassung ist die Folge"],
  ["Der Beitrag ordnet mehrere Perspektiven. Zunächst formuliert er", "Anschließend nennt er als Beleg", "Danach markiert er die Grenze", "Die Gegenstimme lautet", "Im Ergebnis empfiehlt er", "Als negative Folge wird genannt"],
  ["Die Analyse beginnt mit einer Bedingung für Erfolg", "Ein beobachteter Zusammenhang lautet", "Die Autoren warnen jedoch vor Übertragung, denn", "Aus der Gegenposition wird angeführt", "Für die weitere Entwicklung schlagen sie vor", "Ohne diesen Schritt"],
  ["Das Thema wird weder euphorisch noch ablehnend behandelt. Der Grundgedanke ist", "Ein praktischer Befund unterstützt ihn", "Gleichzeitig gilt die Einschränkung", "Die skeptische Position betont", "Der Text sucht einen Mittelweg und empfiehlt", "Scheitert dieser Mittelweg, gilt"],
];

readingFrames.forEach((frame, frameIndex) => readingTopics.forEach((topic, topicIndex) => {
  const passageId = `DS-A-P-READ-${String(frameIndex * readingTopics.length + topicIndex + 1).padStart(3, "0")}`;
  const text = `${frame[0]}: ${topic.thesis} ${frame[1]}: ${topic.evidence} ${frame[2]}: ${topic.limitation} ${frame[3]}: ${topic.counter} ${frame[4]}: ${topic.recommendation} ${frame[5]}: ${topic.consequence}`;
  passages.push({ id: passageId, module: "advanced_reading", title: `${topic.title} · Analyse ${frameIndex + 1}`, text, blankCount: 0 });
  const questions = [
    ["Welche Aussage gibt die zentrale These des Textes wieder?", topic.thesis, [topic.counter, topic.limitation, topic.consequence], "Die zentrale These verbindet den möglichen Nutzen mit einer klaren Bedingung."],
    ["Welcher Befund dient im Text als Beleg?", topic.evidence, [topic.recommendation, topic.counter, topic.limitation], "Der genannte Befund stützt die These empirisch oder anhand einer Beobachtung."],
    ["Welche Einschränkung nennt der Text ausdrücklich?", topic.limitation, [topic.evidence, topic.thesis, topic.recommendation], "Die Einschränkung begrenzt den Geltungsbereich der Aussage."],
    ["Welches Gegenargument wird wiedergegeben?", topic.counter, [topic.thesis, topic.evidence, topic.consequence], "Der Text nimmt diese skeptische Position auf, ohne sie vollständig zu übernehmen."],
    ["Welche Maßnahme empfiehlt der Text?", topic.recommendation, [topic.limitation, topic.evidence, topic.counter], "Die Empfehlung übersetzt die Abwägung in einen praktischen nächsten Schritt."],
    ["Welche Folge erwartet der Text ohne Anpassung?", topic.consequence, [topic.thesis, topic.evidence, topic.recommendation], "Diese Folge wird als Risiko eines unzureichenden Vorgehens beschrieben."],
    ["Welche Haltung nimmt der Text insgesamt ein?", "abwägend und bedingungsorientiert", ["uneingeschränkt zustimmend", "grundsätzlich ablehnend", "rein unterhaltend"], "Der Text verbindet Chancen, Grenzen, Gegenargument und Empfehlung."],
    ["Welche Funktion hat das Gegenargument im Aufbau?", "Es prüft die Reichweite der These und bereitet die Empfehlung vor.", ["Es ersetzt sämtliche Belege.", "Es führt ein völlig neues Thema ein.", "Es widerlegt die These endgültig."], "Das Gegenargument dient der Abwägung und führt zur differenzierten Empfehlung."],
    ["Was lässt sich aus der genannten Einschränkung ableiten?", "Die Lösung muss an unterschiedliche Kontexte angepasst werden.", ["Die Maßnahme ist in jedem Kontext wirkungslos.", "Weitere Prüfung ist grundsätzlich unnötig.", "Nur die Gegenposition ist sachlich vertretbar."], "Eine begrenzte Übertragbarkeit verlangt Anpassung statt pauschaler Anwendung."],
    ["Welche Überschrift passt am besten?", topic.title, [readingTopics[(topicIndex + 3) % readingTopics.length].title, readingTopics[(topicIndex + 5) % readingTopics.length].title, readingTopics[(topicIndex + 7) % readingTopics.length].title], "Die Überschrift benennt den Gegenstand, den der gesamte Text abwägend behandelt."]
  ];
  questions.forEach(([prompt, answer, distractors, explanation], qIndex) => add({
    module: "advanced_reading",
    type: "mcq",
    subtopic: qIndex === 0 ? "中心思想" : qIndex < 6 ? "细节与论证" : "推断与篇章功能",
    difficulty: 3 + ((frameIndex + topicIndex + qIndex) % 3),
    prompt,
    options: [answer, ...distractors],
    answer,
    explanation,
    passageId,
    tags: ["c1", "reading", "argumentation"]
  }));
}));

const cultureFacts = [
  ["德国政治", "Grundgesetz", "Wie heißt die Verfassung der Bundesrepublik Deutschland?", ["Bundesordnung", "Reichsgesetz", "Ländervertrag"], "Das Grundgesetz ist die Verfassung der Bundesrepublik Deutschland."],
  ["德国政治", "Deutscher Bundestag", "Welches Verfassungsorgan wird auf Bundesebene unmittelbar vom Volk gewählt?", ["Bundesrat", "Bundesregierung", "Bundesverfassungsgericht"], "Der Deutsche Bundestag wird unmittelbar vom Wahlvolk gewählt."],
  ["德国政治", "die Regierungen der Länder", "Wessen Mitglieder bilden den Bundesrat?", ["der kommunalen Parlamente", "der Bundesgerichte", "der Universitäten"], "Der Bundesrat besteht aus Mitgliedern der Landesregierungen."],
  ["德国政治", "der Bundestag", "Welches Organ wählt die Bundeskanzlerin oder den Bundeskanzler?", ["der Bundesrat", "das Bundesverfassungsgericht", "die Bundesversammlung"], "Die Wahl der Regierungschefin oder des Regierungschefs gehört zu den Aufgaben des Bundestages."],
  ["德国政治", "Karlsruhe", "In welcher Stadt hat das Bundesverfassungsgericht seinen Sitz?", ["Bonn", "Leipzig", "Frankfurt am Main"], "Das Bundesverfassungsgericht hat seinen Sitz in Karlsruhe."],
  ["德国政治", "16", "Aus wie vielen Ländern besteht die Bundesrepublik Deutschland?", ["9", "12", "26"], "Deutschland ist ein Bundesstaat mit 16 Ländern."],
  ["德国政治", "Berlin", "Welche Stadt ist die Hauptstadt Deutschlands?", ["Bonn", "Frankfurt am Main", "Hamburg"], "Berlin ist die Bundeshauptstadt."],
  ["德国政治", "Bundespräsident", "Wie heißt das Staatsoberhaupt Deutschlands?", ["Bundeskanzler", "Bundestagspräsident", "Bundesratspräsident"], "Das Staatsoberhaupt ist der Bundespräsident beziehungsweise die Bundespräsidentin."],
  ["德国政治", "Gesetzgebung und Kontrolle der Regierung", "Welche Aufgaben gehören wesentlich zum Bundestag?", ["kommunale Verwaltung und Polizei", "Rechtsprechung und Strafvollzug", "Geldpolitik und Bankenaufsicht"], "Zu den Kernaufgaben zählen Gesetzgebung und Kontrolle der Regierungsarbeit."],
  ["德国政治", "die Würde des Menschen", "Welchen Grundsatz schützt Artikel 1 des Grundgesetzes besonders?", ["die Einheit der Währung", "die Schulpflicht", "die kommunale Selbstverwaltung"], "Artikel 1 beginnt mit dem Schutz der Menschenwürde."],
  ["奥地利与瑞士", "9", "Aus wie vielen Bundesländern besteht Österreich?", ["7", "16", "26"], "Österreich besteht aus neun Bundesländern."],
  ["奥地利与瑞士", "Wien", "Welche Stadt ist zugleich österreichische Hauptstadt und Bundesland?", ["Salzburg", "Graz", "Innsbruck"], "Wien ist Stadt und eines der neun Bundesländer."],
  ["奥地利与瑞士", "Nationalrat", "Welche Kammer des österreichischen Parlaments wird direkt gewählt?", ["Bundesrat", "Landeshauptleutekonferenz", "Verfassungsgerichtshof"], "Der Nationalrat wird von den Wahlberechtigten gewählt."],
  ["奥地利与瑞士", "Bundesrat", "Welches Organ vertritt in Österreich die Bundesländer auf Bundesebene?", ["Nationalrat", "Rechnungshof", "Ministerrat"], "Der Bundesrat wirkt als Länderkammer an der Bundesgesetzgebung mit."],
  ["奥地利与瑞士", "Deutsch", "Welche Sprache ist die allgemeine Amtssprache Österreichs?", ["Französisch", "Italienisch", "Niederländisch"], "Deutsch ist die allgemeine Amtssprache; Minderheitensprachen genießen regionalen Schutz."],
  ["奥地利与瑞士", "26", "Wie viele Kantone hat die Schweiz?", ["9", "16", "24"], "Die Schweizerische Eidgenossenschaft besteht aus 26 Kantonen."],
  ["奥地利与瑞士", "Bern", "Welche Stadt gilt als Bundesstadt der Schweiz?", ["Zürich", "Genf", "Lausanne"], "Bern ist die Bundesstadt und Sitz der Bundesbehörden."],
  ["奥地利与瑞士", "Deutsch, Französisch, Italienisch und Rätoromanisch", "Welche Sprachen sind Schweizer Landessprachen?", ["Deutsch, Englisch und Französisch", "Deutsch, Italienisch und Niederländisch", "Französisch, Spanisch und Deutsch"], "Die Schweiz kennt vier Landessprachen."],
  ["奥地利与瑞士", "Bundesrat", "Wie heißt die siebenköpfige Schweizer Landesregierung?", ["Nationalrat", "Ständerat", "Kantonsrat"], "Der Schweizer Bundesrat besteht aus sieben Mitgliedern."],
  ["奥地利与瑞士", "Nationalrat und Ständerat", "Aus welchen beiden Kammern besteht die Schweizer Bundesversammlung?", ["Bundestag und Bundesrat", "Nationalrat und Bundesrat", "Landtag und Ständerat"], "Die Bundesversammlung besteht aus Nationalrat und Ständerat."],
  ["地理", "Nordsee", "In welches Meer mündet der Rhein?", ["Ostsee", "Schwarzes Meer", "Mittelmeer"], "Der Rhein mündet in den Niederlanden in die Nordsee."],
  ["地理", "Schwarzes Meer", "In welches Meer mündet die Donau?", ["Nordsee", "Ostsee", "Adriatisches Meer"], "Die Donau mündet über ihr Delta in das Schwarze Meer."],
  ["地理", "Zugspitze", "Wie heißt der höchste Berg Deutschlands?", ["Brocken", "Feldberg", "Watzmann"], "Die Zugspitze ist der höchste Berg Deutschlands."],
  ["地理", "Deutschland, Österreich und die Schweiz", "Welche Staaten grenzen an den Bodensee?", ["Deutschland, Frankreich und Belgien", "Österreich, Italien und Slowenien", "Schweiz, Luxemburg und Deutschland"], "Deutschland, Österreich und die Schweiz liegen am Bodensee."],
  ["地理", "Nordrhein-Westfalen", "In welchem deutschen Land liegt der größte Teil des Ruhrgebiets?", ["Hessen", "Sachsen", "Bayern"], "Das Ruhrgebiet liegt überwiegend in Nordrhein-Westfalen."],
  ["地理", "die Alpen", "Welches Gebirge prägt den Süden des deutschsprachigen Raums?", ["die Pyrenäen", "der Ural", "die Karpaten"], "Die Alpen erstrecken sich unter anderem durch Deutschland, Österreich und die Schweiz."],
  ["文学与历史", "Johann Wolfgang von Goethe", "Wer schrieb den Faust?", ["Heinrich Heine", "Franz Kafka", "Bertolt Brecht"], "Faust ist eines der bekanntesten Werke Goethes."],
  ["文学与历史", "Friedrich Schiller", "Von wem stammt das Drama Die Räuber?", ["Thomas Mann", "Georg Büchner", "Hermann Hesse"], "Die Räuber ist ein Drama Friedrich Schillers."],
  ["文学与历史", "Prag", "Mit welcher Stadt ist Franz Kafkas Leben besonders eng verbunden?", ["Wien", "Hamburg", "Zürich"], "Kafka wurde in Prag geboren und lebte dort den größten Teil seines Lebens."],
  ["文学与历史", "Thomas Mann", "Wer schrieb den Roman Buddenbrooks?", ["Günter Grass", "Robert Musil", "Stefan Zweig"], "Buddenbrooks stammt von Thomas Mann."],
  ["文学与历史", "Bertolt Brecht", "Welcher Autor ist besonders mit dem epischen Theater verbunden?", ["Theodor Fontane", "Rainer Maria Rilke", "E. T. A. Hoffmann"], "Brecht entwickelte und prägte Formen des epischen Theaters."],
  ["文学与历史", "Jacob und Wilhelm Grimm", "Wer sammelte und veröffentlichte die Kinder- und Hausmärchen?", ["Heinrich und Thomas Mann", "August und Friedrich Schlegel", "Max und Moritz Weber"], "Die Brüder Grimm veröffentlichten die bekannte Märchensammlung."],
  ["文学与历史", "Martin Luther", "Wer prägte die Reformation im deutschsprachigen Raum und übersetzte die Bibel ins Deutsche?", ["Johannes Gutenberg", "Otto von Bismarck", "Alexander von Humboldt"], "Martin Luther war eine zentrale Figur der Reformation und Bibelübersetzer."],
  ["文学与历史", "Frankfurter Paulskirche", "Wo trat 1848 die deutsche Nationalversammlung zusammen?", ["Berliner Dom", "Kölner Rathaus", "Hambacher Schloss"], "Die Nationalversammlung tagte in der Frankfurter Paulskirche."],
  ["文学与历史", "1949", "In welchem Jahr wurde die Bundesrepublik Deutschland gegründet?", ["1918", "1945", "1990"], "Die Bundesrepublik Deutschland wurde 1949 gegründet."],
  ["文学与历史", "1990", "In welchem Jahr wurde die deutsche Einheit staatlich vollendet?", ["1961", "1972", "1989"], "Die staatliche Einheit Deutschlands wurde am 3. Oktober 1990 vollendet."],
  ["语言与文化", "Duden", "Welches Nachschlagewerk ist besonders mit der deutschen Rechtschreibung verbunden?", ["Brockhaus Musik", "Grimm Atlas", "Meyers Bühne"], "Der Duden ist ein zentrales Nachschlagewerk zur deutschen Sprache und Rechtschreibung."],
  ["语言与文化", "Hochdeutsch", "Wie nennt man die überregionale deutsche Standardsprache häufig?", ["Plattromanisch", "Mittelniederländisch", "Althochalemannisch"], "Hochdeutsch bezeichnet im Alltag häufig die Standardsprache."],
  ["语言与文化", "Berlinale", "Welches internationale Filmfestival findet in Berlin statt?", ["Documenta", "Salzburger Festspiele", "Bachfest Leipzig"], "Die Berlinale ist das internationale Filmfestival in Berlin."],
  ["语言与文化", "documenta", "Welche große Ausstellung zeitgenössischer Kunst ist mit Kassel verbunden?", ["Berlinale", "Bayreuther Festspiele", "Leipziger Buchmesse"], "Die documenta findet in Kassel statt."],
];

const cultureContexts = ["Im Landeskundekurs", "Bei einer Kulturpräsentation", "In einem Überblick zur DACH-Region", "Im Geschichtsseminar", "Bei der Prüfungsvorbereitung"];
const cultureFunctions = ["Grundwissen", "Zuordnung", "Begriffsklärung", "Kontextwissen"];
cultureFacts.forEach((fact, factIndex) => cultureContexts.flatMap((context) => cultureFunctions.map((fn) => `${context} · ${fn}`)).forEach((context, variant) => {
  const [subtopic, answer, question, distractors, explanation] = fact;
  add({ module: "advanced_culture", type: "mcq", subtopic, difficulty: 3 + ((factIndex + variant) % 3), prompt: `${context}: ${question}`, options: [answer, ...distractors], answer, explanation, tags: ["culture", "dach", subtopic] });
}));

const translationPairs = [
  ["de-zh", "Die Ergebnisse legen nahe, dass kurzfristige Effekte nicht mit nachhaltigen Veränderungen gleichgesetzt werden dürfen.", "研究结果表明，不能把短期效果等同于可持续的改变。", "注意 legen nahe 的推断语气和 nicht gleichsetzen mit 的对应关系。"],
  ["de-zh", "Je transparenter die Kriterien formuliert sind, desto eher lässt sich die Entscheidung nachvollziehen.", "标准表述得越透明，决定就越容易被理解和追溯。", "保留 je ... desto ... 的递进比较结构。"],
  ["de-zh", "Die Maßnahme ist zwar gut gemeint, trägt den unterschiedlichen Ausgangsbedingungen jedoch nur teilweise Rechnung.", "这项措施的初衷虽好，却只在一定程度上考虑到了不同的起始条件。", "zwar ... jedoch 表示让步转折；Rechnung tragen 意为充分考虑。"],
  ["de-zh", "Von einer belastbaren Aussage kann erst dann die Rede sein, wenn weitere Daten vorliegen.", "只有在获得更多数据之后，才能谈得上可靠的结论。", "erst dann, wenn 可译为只有……之后才……。"],
  ["de-zh", "Ungeachtet der methodischen Einschränkungen liefert die Untersuchung wichtige Anhaltspunkte für die weitere Forschung.", "尽管存在方法上的局限，这项研究仍为后续研究提供了重要线索。", "Ungeachtet 支配第二格并表达让步。"],
  ["de-zh", "Es bedarf klarer Zuständigkeiten, damit aus einer politischen Absicht eine verlässliche Praxis wird.", "要把政策意图转化为可靠的实践，就需要明确职责。", "es bedarf 支配第二格；damit 表示目的。"],
  ["de-zh", "Die Autorin wirft die Frage auf, inwieweit wirtschaftliche Anreize tatsächlich zu einer Verhaltensänderung führen.", "作者提出了一个问题：经济激励究竟在多大程度上会真正带来行为改变。", "inwieweit 表示程度范围，nicht 只译成是否。"],
  ["de-zh", "Was zunächst wie ein technisches Problem erscheint, erweist sich bei näherer Betrachtung als gesellschaftlicher Zielkonflikt.", "乍看之下像是技术问题的事情，经过深入考察后却显现为社会目标之间的冲突。", "was 引导自由关系从句；sich erweisen als 表示显现为。"],
  ["de-zh", "Die Betroffenen wurden weder ausreichend informiert noch an der Ausgestaltung des Verfahrens beteiligt.", "相关人员既没有得到充分告知，也没有参与这一程序的具体设计。", "weder ... noch ... 连接两个并列的被动动作。"],
  ["de-zh", "Die Debatte greift zu kurz, solange sie sich ausschließlich auf die Kosten konzentriert.", "只要讨论仍然只关注成本，它就没有触及问题的全部。", "zu kurz greifen 表示看法或措施不够全面。"],
  ["de-zh", "Dass eine Lösung praktikabel ist, bedeutet noch lange nicht, dass sie unter allen Umständen gerecht ist.", "一种方案可行，远不意味着它在所有情况下都公平。", "noch lange nicht 用来加强否定。"],
  ["de-zh", "Anstatt einzelne Gruppen gegeneinander auszuspielen, sollte die Politik gemeinsame Interessen sichtbar machen.", "政策不应挑动不同群体相互对立，而应让共同利益清晰可见。", "anstatt ... zu ... 与 sollte 构成替代关系。"],
  ["de-zh", "Die Entscheidung wurde mit dem Hinweis vertagt, die Folgen müssten zunächst genauer geprüft werden.", "有关方面以必须先更准确评估后果为由，推迟了决定。", "mit dem Hinweis 后的间接引语使用虚拟式。"],
  ["zh-de", "这项研究并不否认数字化的优势，而是提醒人们注意其分配效应。", "Die Studie bestreitet die Vorteile der Digitalisierung nicht, sondern macht auf ihre Verteilungswirkungen aufmerksam.", "用 nicht ..., sondern ...；auf etwas aufmerksam machen 支配第四格。"],
  ["zh-de", "只有把使用者的反馈纳入设计过程，系统才能长期得到改进。", "Nur wenn die Rückmeldungen der Nutzenden in den Entwicklungsprozess einbezogen werden, lässt sich das System langfristig verbessern.", "Nur wenn 从句前置后主句倒装；sich lassen 构成被动替代表达。"],
  ["zh-de", "数据越完整，对结果的解释就越需要谨慎。", "Je vollständiger die Daten sind, desto vorsichtiger müssen die Ergebnisse interpretiert werden.", "使用 je ... desto ...，并以被动态表达结果被解释。"],
  ["zh-de", "尽管各方原则上同意改革，但在具体实施上仍存在分歧。", "Obwohl sich die Beteiligten grundsätzlich über die Reform einig sind, bestehen bei der konkreten Umsetzung weiterhin Meinungsverschiedenheiten.", "sich über etwas einig sein；obwohl 引导让步从句。"],
  ["zh-de", "关键不在于收集尽可能多的数据，而在于提出正确的问题。", "Entscheidend ist nicht, möglichst viele Daten zu sammeln, sondern die richtigen Fragen zu stellen.", "nicht ..., sondern ... 连接两个 zu 不定式结构。"],
  ["zh-de", "如果没有透明的标准，就很难判断这项措施是否成功。", "Ohne transparente Kriterien lässt sich nur schwer beurteilen, ob die Maßnahme erfolgreich ist.", "ohne 加第四格；ob 引导间接疑问句。"],
  ["zh-de", "政策制定者必须在迅速行动与认真评估之间取得平衡。", "Die politisch Verantwortlichen müssen zwischen schnellem Handeln und sorgfältiger Prüfung abwägen.", "zwischen 支配第三格；abwägen 表示权衡。"],
  ["zh-de", "这份报告指出了问题，却没有充分说明如何解决问题。", "Der Bericht zeigt das Problem auf, ohne hinreichend zu erläutern, wie es gelöst werden kann.", "aufzeigen 为可分动词；ohne ... zu ...；间接疑问中使用被动态。"],
  ["zh-de", "人们不能因为一种方法容易测量，就认为它具有更高的价值。", "Man darf eine Methode nicht allein deshalb für wertvoller halten, weil sie leichter messbar ist.", "deshalb ..., weil ... 表示原因关联；für etwas halten。"],
  ["zh-de", "是否接受这项建议，最终取决于它能否适应不同的实际情况。", "Ob der Vorschlag angenommen wird, hängt letztlich davon ab, ob er sich an unterschiedliche praktische Bedingungen anpassen lässt.", "ob 从句作主语；abhängen von 用 davon 作为相关词。"],
  ["zh-de", "该机构承诺公开评估结果，以便公众能够核查其决定。", "Die Einrichtung verpflichtet sich, die Evaluationsergebnisse zu veröffentlichen, damit die Öffentlichkeit ihre Entscheidungen überprüfen kann.", "sich verpflichten, etwas zu tun；damit 表示目的。"],
  ["zh-de", "与其掩盖不确定性，不如明确说明现有证据的局限。", "Statt Unsicherheiten zu verschweigen, sollte man die Grenzen der vorliegenden Evidenz klar benennen.", "statt ... zu ... 表示替代；Evidenz 可用于学术语境。"],
];

const translationContexts = ["学术摘要", "政策简报", "研究评论", "正式邮件", "会议纪要", "媒体分析", "项目报告", "公共沟通"];
const translationFocus = ["保持原句逻辑", "注意语域", "保留让步关系", "准确处理名词化", "使译文自然连贯"];
translationPairs.forEach((pair, pairIndex) => translationContexts.flatMap((context) => translationFocus.map((focus) => `${context} · ${focus}`)).forEach((instruction, variant) => {
  const [direction, source, target, explanation] = pair;
  add({
    module: "advanced_translation",
    type: "transformation",
    subtopic: direction === "de-zh" ? "德译中" : "中译德",
    difficulty: 3 + ((pairIndex + variant) % 3),
    prompt: `${instruction}：${source}`,
    answer: target,
    acceptableAnswers: [],
    explanation: `${explanation} 开放翻译可能存在其他正确表达，请按意义、语域和结构自行核对。`,
    tags: ["translation", direction, "c1"]
  });
}));

const correctionPairs = [
  ["Der Bericht geht davon aus, dass die Maßnahme wird langfristig wirken.", "Der Bericht geht davon aus, dass die Maßnahme langfristig wirken wird.", "在 dass 从句中，谓语结构置于句末。"],
  ["Trotz den überzeugenden Ergebnissen bleibt die Stichprobe zu klein.", "Trotz der überzeugenden Ergebnisse bleibt die Stichprobe zu klein.", "trotz 在正式语体中通常支配第二格。"],
  ["Die Frage, dass die Daten vergleichbar sind, bleibt offen.", "Die Frage, ob die Daten vergleichbar sind, bleibt offen.", "表示是否的间接疑问句使用 ob。"],
  ["Je genauer die Kriterien sind, umso leichter die Entscheidung nachvollzogen werden kann.", "Je genauer die Kriterien sind, umso leichter kann die Entscheidung nachvollzogen werden.", "je 从句后主句仍须遵守动词第二位。"],
  ["Die Autorin kritisiert darüber, dass zentrale Begriffe undefiniert bleiben.", "Die Autorin kritisiert, dass zentrale Begriffe undefiniert bleiben.", "kritisieren 直接接宾语或 dass 从句，不使用 darüber。"],
  ["Die Ergebnisse lassen sich nicht auf alle Gruppen zu übertragen.", "Die Ergebnisse lassen sich nicht auf alle Gruppen übertragen.", "sich lassen 后接不带 zu 的不定式。"],
  ["Es handelt sich um eine noch zu klärende Frage, die Bedeutung weit über den Einzelfall hinausgeht.", "Es handelt sich um eine noch zu klärende Frage, deren Bedeutung weit über den Einzelfall hinausgeht.", "关系从句中表示所属关系使用 deren。"],
  ["Die Kommission empfiehlt, die Regelung möglichst bald überarbeitet wird.", "Die Kommission empfiehlt, die Regelung möglichst bald zu überarbeiten.", "主语一致时可用 zu 不定式；原句缺少 dass。"],
  ["Nachdem die Daten ausgewertet wurden, der Bericht wurde veröffentlicht.", "Nachdem die Daten ausgewertet worden waren, wurde der Bericht veröffentlicht.", "前置从句后主句倒装；先发生的动作宜用过去完成时。"],
  ["Die Maßnahme zielt darauf, den Zugang für Studierende zu erleichtern ab.", "Die Maßnahme zielt darauf ab, den Zugang für Studierende zu erleichtern.", "abzielen 的可分前缀 ab 位于主句右括号前。"],
  ["Weder die Kosten noch der Zeitaufwand wurden ausreichend berücksichtigt worden.", "Weder die Kosten noch der Zeitaufwand wurden ausreichend berücksichtigt.", "一般过去时被动态只需要 wurden 加第二分词。"],
  ["Die Forschenden behaupten, dass ihre Methode sei besonders zuverlässig.", "Die Forschenden behaupten, ihre Methode sei besonders zuverlässig.", "间接引语可用不带 dass 的虚拟式；若用 dass，语序应为 besonders zuverlässig sei。"],
  ["Das Ergebnis ist insofern überraschend, weil die Ausgangswerte nahezu identisch waren.", "Das Ergebnis ist insofern überraschend, als die Ausgangswerte nahezu identisch waren.", "相关结构通常为 insofern ..., als ...。"],
  ["Ohne die Betroffenen frühzeitig einzubeziehen, Akzeptanz lässt sich kaum erreichen.", "Ohne die Betroffenen frühzeitig einzubeziehen, lässt sich Akzeptanz kaum erreichen.", "前置不定式短语占据第一位，主句谓语随即出现。"],
  ["Die Studie bietet sowohl neue Daten, aber auch eine überzeugende Methode.", "Die Studie bietet sowohl neue Daten als auch eine überzeugende Methode.", "固定关联词为 sowohl ... als auch ...。"],
  ["Die Debatte beschränkt sich nicht nur auf Kosten, sondern berücksichtigt soziale Folgen.", "Die Debatte beschränkt sich nicht auf Kosten, sondern berücksichtigt auch soziale Folgen.", "平衡表达为 nicht ..., sondern auch ...；避免 nicht nur 与后项不对称。"],
  ["Die Behörde hat die Regeln geändert, ohne die Öffentlichkeit informiert.", "Die Behörde hat die Regeln geändert, ohne die Öffentlichkeit informiert zu haben.", "之前未完成的伴随动作使用 ohne 加完成时不定式。"],
  ["Die Daten sind zu lückenhaft, um daraus verlässliche Schlüsse gezogen werden könnten.", "Die Daten sind zu lückenhaft, als dass daraus verlässliche Schlüsse gezogen werden könnten.", "否定结果使用 zu ... als dass，而不是 um ... zu。"],
  ["Man muss zwischen kurzfristigen Nutzen und langfristigen Folgen unterscheiden.", "Man muss zwischen kurzfristigem Nutzen und langfristigen Folgen unterscheiden.", "zwischen 表示静态关系时支配第三格。"],
  ["Der Vorschlag bedarf eine gründlichere Prüfung.", "Der Vorschlag bedarf einer gründlicheren Prüfung.", "bedürfen 支配第二格。"],
  ["Die Autorin kommt zu dem Schluss, die Reform ist notwendig.", "Die Autorin kommt zu dem Schluss, die Reform sei notwendig.", "书面间接引语宜使用第一虚拟式。"],
  ["Die Befragung wurde durchgeführt, damit mögliche Hindernisse sichtbar zu machen.", "Die Befragung wurde durchgeführt, um mögliche Hindernisse sichtbar zu machen.", "主句与目的结构主语一致时使用 um ... zu。"],
  ["Obwohl der Einwand berechtigt ist, aber ändert er nichts am Grundproblem.", "Obwohl der Einwand berechtigt ist, ändert er nichts am Grundproblem.", "obwohl 已标记让步，不再与 aber 并用。"],
  ["Die Studie, deren wir uns beziehen, wurde 2020 veröffentlicht.", "Die Studie, auf die wir uns beziehen, wurde 2020 veröffentlicht.", "sich beziehen auf 要求介词加第四格关系代词。"],
  ["Unter Berücksichtigung die regionalen Unterschiede fällt das Ergebnis differenzierter aus.", "Unter Berücksichtigung der regionalen Unterschiede fällt das Ergebnis differenzierter aus.", "Berücksichtigung 后使用第二格属性。"],
];

const correctionContexts = ["在学术摘要中", "在研究报告中", "在政策评论中", "在正式陈述中", "在项目结论中"];
const correctionFocus = ["改正语序", "检查支配关系", "保持正式语体", "修正句法连接"];
correctionPairs.forEach((pair, pairIndex) => correctionContexts.flatMap((context) => correctionFocus.map((focus) => `${context}，${focus}`)).forEach((instruction, variant) => {
  const [wrong, answer, explanation] = pair;
  add({ module: "advanced_writing", type: "error_correction", subtopic: "高阶改错", difficulty: 3 + ((pairIndex + variant) % 3), prompt: `${instruction}：${wrong}`, answer, acceptableAnswers: [], explanation, tags: ["writing", "correction", "c1"] });
}));

const writingScenarios = [
  ["大学是否应把部分大型讲座改为线上形式", "Digitale Großvorlesungen können Wege sparen, sollten Präsenzformate aber nur dort ersetzen, wo Austausch und Betreuung gesichert bleiben.", "先承认便利性，再限定适用条件。"],
  ["城市是否应减少中心城区停车位", "Weniger Parkplätze können die Verkehrswende unterstützen; akzeptabel ist dies jedoch nur, wenn zuverlässige Alternativen rechtzeitig ausgebaut werden.", "用分号或让步结构平衡目标与条件。"],
  ["科研数据是否应默认公开", "Forschungsdaten sollten grundsätzlich zugänglich sein, sofern Datenschutz, Dokumentation und eine angemessene Anerkennung der Datenerhebung gewährleistet sind.", "sofern 引出必要条件。"],
  ["企业是否应提供固定学习时间", "Betriebliche Lernzeiten verursachen kurzfristig Aufwand, stärken langfristig jedoch Anpassungsfähigkeit und Mitarbeiterbindung.", "突出短期成本与长期收益的对照。"],
  ["博物馆是否应免费开放", "Freier Eintritt senkt finanzielle Hürden, reicht allein aber nicht aus, solange Vermittlung und Barrierefreiheit vernachlässigt werden.", "allein nicht ausreichen 与 solange 形成限制。"],
  ["公共机构是否应使用简明语言", "Verständliche Verwaltungssprache ist kein Verzicht auf Genauigkeit, sondern eine Voraussetzung dafür, dass Rechte tatsächlich wahrgenommen werden können.", "用 nicht ..., sondern ... 纠正常见误解。"],
  ["高校是否应限制生成式工具", "Pauschale Verbote greifen zu kurz; sinnvoller sind transparente Regeln, die erlaubte Hilfen, Eigenleistung und Dokumentation klar voneinander abgrenzen.", "zu kurz greifen 表示措施不够全面。"],
  ["城市绿化是否应优先于新增车道", "Wo Hitze und Starkregen besonders belasten, sollte grüne Infrastruktur Vorrang erhalten, ohne Mobilitätsbedürfnisse pauschal zu ignorieren.", "使用 wo 从句限定场景，并用 ohne 平衡。"],
  ["是否应延长产品保修期", "Längere Garantiezeiten können langlebige Produkte fördern, sofern Reparaturkosten nicht lediglich auf Verbraucherinnen und Verbraucher verlagert werden.", "使用被动态表达成本转嫁。"],
  ["大学是否应公开课程评价", "Veröffentlichte Evaluationen schaffen Transparenz, müssen aber methodisch eingeordnet werden, damit einzelne Werte nicht vorschnell als Qualitätsurteil gelten.", "damit 从句说明防止误读的目的。"],
  ["居家办公是否应成为法定权利", "Ein Anspruch auf mobiles Arbeiten kann Beschäftigten helfen, muss jedoch mit betrieblichen Aufgaben und dem Schutz vor ständiger Erreichbarkeit vereinbar sein.", "vereinbar mit 强调权利的边界条件。"],
  ["公共交通是否应免费", "Kostenloser Nahverkehr erhöht die Attraktivität nur dann dauerhaft, wenn Takt, Kapazität und Zuverlässigkeit zugleich verbessert werden.", "nur dann, wenn 表示严格条件。"],
  ["算法决策是否必须接受外部审计", "Externe Prüfungen sind dort unverzichtbar, wo automatisierte Entscheidungen erhebliche Folgen haben und Betroffene die Kriterien selbst nicht nachvollziehen können.", "用 dort, wo 限定高风险领域。"],
  ["学校是否应取消纸质教材", "Digitale Materialien erweitern Lernmöglichkeiten, sollten gedruckte Angebote aber nicht vollständig ersetzen, solange der Zugang ungleich verteilt ist.", "转折后以 solange 说明保留纸质材料的原因。"],
  ["研究经费是否应更多支持短期项目", "Kurzfristige Förderung kann neue Ideen erproben, darf jedoch die verlässliche Finanzierung langfristiger Forschung nicht untergraben.", "darf nicht 表示政策边界。"],
  ["企业是否应公开薪资区间", "Transparente Gehaltsspannen können ungerechtfertigte Unterschiede sichtbar machen und zugleich realistischere Erwartungen im Bewerbungsprozess schaffen.", "用 zugleich 连接两个并列作用。"],
  ["是否应为文化机构设置多语言服务", "Mehrsprachige Angebote erleichtern Teilhabe, entfalten ihre Wirkung aber erst, wenn auch Inhalte, Personal und digitale Zugänge einbezogen werden.", "erst wenn 表示效果出现的条件。"],
  ["大学是否应设置强制实习", "Ein Pflichtpraktikum ist nur dann sinnvoll, wenn Lernziele, Betreuung und faire Arbeitsbedingungen verbindlich geregelt sind.", "用 nur dann, wenn 强调质量要求。"],
  ["是否应限制短途航班", "Beschränkungen für Kurzstreckenflüge sind klimapolitisch nachvollziehbar, setzen jedoch leistungsfähige Bahnverbindungen und sozial ausgewogene Preise voraus.", "voraussetzen 表示政策前提。"],
  ["公共决策是否应更多使用公民抽签", "Geloste Bürgerräte können neue Perspektiven einbringen, ersetzen aber weder gewählte Parlamente noch transparente Verantwortlichkeit.", "weder ... noch ... 明确不可替代的制度。"],
  ["医疗数据是否可用于公共研究", "Gesundheitsdaten können der Forschung dienen, sofern Einwilligung, Zweckbindung und sichere Zugänge glaubwürdig gewährleistet sind.", "列举伦理和数据治理条件。"],
  ["企业是否应承担员工心理健康责任", "Unternehmen können psychische Gesundheit unterstützen, dürfen individuelle Fürsorge jedoch nicht an die Stelle guter Arbeitsbedingungen setzen.", "an die Stelle setzen 表示错误替代。"],
  ["是否应对社交平台实施年龄验证", "Alterskontrollen können Minderjährige schützen, müssen aber so gestaltet sein, dass sie nicht selbst neue Datenschutzrisiken erzeugen.", "so ..., dass ... 表示设计要求。"],
  ["城市是否应实行居民参与式预算", "Bürgerhaushalte stärken Vertrauen nur, wenn der Entscheidungsspielraum klar ist und ausgewählte Projekte anschließend tatsächlich umgesetzt werden.", "并列两个必要条件。"],
  ["高校是否应增加跨学科课程", "Interdisziplinäre Lehre kann komplexe Probleme besser abbilden, sofern fachliche Grundlagen nicht durch bloße Themenvielfalt ersetzt werden.", "被动态与 sofern 限定跨学科的边界。"],
];

const writingAudiences = ["为严肃论坛写核心论点", "为课程论文写开头判断", "为政策简报写结论", "为正式讨论写回应", "为项目建议书写主张"];
const writingFunctions = ["加入一个限制条件", "体现让步关系", "保持中性语域", "突出因果关系"];
writingScenarios.forEach((scenario, scenarioIndex) => writingAudiences.flatMap((audience) => writingFunctions.map((fn) => `${audience}，${fn}`)).forEach((instruction, variant) => {
  const [topic, answer, explanation] = scenario;
  add({ module: "advanced_writing", type: "transformation", subtopic: "论证微写作", difficulty: 3 + ((scenarioIndex + variant) % 3), prompt: `${instruction}。主题：${topic}`, answer, acceptableAnswers: [], explanation: `${explanation} 这是参考表达，观点合理、结构完整且语域合适的其他答案也可以接受。`, tags: ["writing", "argumentation", "c1"] });
}));

const moduleMeta = [
  ["advanced_grammar", "高阶语法", "间接引语、复杂句法与正式语体", 1500],
  ["advanced_vocab", "高阶词汇搭配", "学术、社会、科技与公共议题表达", 1500],
  ["advanced_cloze", "篇章完形", "连接、指代、语序与篇章重构", 1000],
  ["advanced_reading", "长文阅读", "主旨、细节、推断与论证功能", 1200],
  ["advanced_culture", "德语区文化", "政治制度、地理、文学与历史常识", 800],
  ["advanced_translation", "双向翻译", "学术与公共语体中的意义重组", 1000],
  ["advanced_writing", "写作与改错", "论证微写作、语域控制与句法修正", 1000]
];

const manifest = {
  version: "1.0.0",
  stage: "advanced",
  label: "大三大四高阶综合练习题库",
  total: 8000,
  contentStatus: "原创模板题，已完成结构与答案归属校验，尚未逐题完成教师审核",
  passagesPath: "data/questions-advanced/passages.json",
  modules: moduleMeta.map(([id, label, description, expected]) => {
    const count = (modules.get(id) || []).length;
    if (count !== expected) throw new Error(`${id}: expected ${expected}, got ${count}`);
    return { id, label, description, count, path: `data/questions-advanced/${id}.json` };
  })
};

for (const [id, items] of modules) {
  const meta = manifest.modules.find((entry) => entry.id === id);
  fs.writeFileSync(path.join(outputDir, `${id}.json`), JSON.stringify({ version: "1.0.0", module: id, label: meta.label, count: items.length, items }));
}
fs.writeFileSync(path.join(outputDir, "passages.json"), JSON.stringify({ version: "1.0.0", count: passages.length, passages }));
fs.writeFileSync(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

const allItems = [...modules.values()].flat();
const ids = new Set(allItems.map((item) => item.id));
if (allItems.length !== 8000 || ids.size !== 8000) throw new Error("Question total or ID uniqueness check failed");
for (const item of allItems) {
  if (!item.prompt || !item.answer || !item.explanation) throw new Error(`Missing required content: ${item.id}`);
  if (item.type === "mcq" && (item.options.length !== 4 || !item.options.includes(item.answer))) throw new Error(`Invalid MCQ: ${item.id}`);
}
const passageIds = new Set(passages.map((entry) => entry.id));
const passageTexts = new Set(passages.map((entry) => entry.text));
if (passageTexts.size !== passages.length) throw new Error("Duplicate passage text detected");
for (const passage of passages) {
  if (/\{[a-zA-Z]+\}/.test(passage.text)) throw new Error(`Unresolved placeholder: ${passage.id}`);
  if (/Bei (digitale|städtische|wissenschaftliche|betriebliche|nachhaltige|kulturelle|bezahlbare|psychische)\b/.test(passage.text)) throw new Error(`Uninflected dative phrase: ${passage.id}`);
}
for (const item of allItems.filter((entry) => entry.passageId)) {
  if (!passageIds.has(item.passageId)) throw new Error(`Missing passage: ${item.id}`);
}

console.log(JSON.stringify({ total: allItems.length, uniqueIds: ids.size, passages: passages.length, modules: Object.fromEntries([...modules].map(([id, items]) => [id, items.length])) }, null, 2));
