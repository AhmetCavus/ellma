import type { Copy } from "./en.js";

export const de: Copy = {
  appName: "Ellma",
  tagline: "Deine Begleiterin zu deinen Zielen",
  languageName: "Deutsch",

  landing: {
    eyebrow: "Eine persönliche Begleiterin für deine Ziele",
    titleStart: "Deine Ziele verdienen eine",
    titleEmphasis: "Begleiterin.",
    lead: "Ellma behält deine Ziele im Blick, hört zu, wenn du sprichst, und kennt immer deinen nächsten kleinen Schritt. Jede investierte Stunde füllt einen Apfel, bis er reif ist.",
    primary: "Ellma kennenlernen",
    secondary: "Anmelden",
    demo: {
      caption: "So arbeitet Ellma. Wähle einen Satz und probiere es aus.",
      goal: "Einen Halbmarathon laufen",
      nextStep: "Nächster Schritt",
      you: "Du",
      scenes: [
        {
          say: "Ich komme nicht voran. Wo fange ich an?",
          action: "Schritt geplant · Laufschuhe bereitstellen",
          reply:
            "Machen wir es winzig: Stell heute Abend deine Laufschuhe bereit. Es steht auf deiner Liste für heute.",
          step: "Laufschuhe bereitstellen",
        },
        {
          say: "Ich bin heute Morgen 40 Minuten gelaufen.",
          action: "Zeit erfasst · 40 Min.",
          reply:
            "Erfasst. Das sind 3,5 von deinen 5 Stunden diese Woche. Als Nächstes: lockere 5 km am Freitag.",
          step: "Lockere 5 km am Freitag",
        },
        {
          say: "Langer Lauf geschafft. Neunzig Minuten!",
          action: "Zeit erfasst · 1 Std. 30",
          reply: "Wochenziel erreicht. Dieser Apfel ist reif. Ich bin stolz auf dich!",
          step: "Ausruhen. Das hast du dir verdient.",
        },
      ],
    },
    stepsTitle: "Drei Dinge. Mehr nicht.",
    steps: [
      {
        title: "Ein Ziel pflanzen",
        body: "Ellma stellt fünf kurze Fragen: was, warum, wie viele Stunden, bis wann und dein erster Schritt.",
      },
      {
        title: "Einfach sprechen",
        body: "Halte die Leertaste und erzähl ihr, was du geschafft hast oder wo du festhängst. Sie plant, erfasst und erinnert dich an dein Warum.",
      },
      {
        title: "Beim Reifen zusehen",
        body: "Jedes Ziel ist ein Apfel, der sich mit deinen investierten Stunden füllt. Erreichst du deine Woche, ist er reif.",
      },
    ],
    facts: [
      "Läuft auf einem Open-Weight-Modell",
      "Auf unserem eigenen Server, nicht bei Dritten",
      "Stimme und Tastatur zuerst",
      "Deutsch und Englisch",
    ],
    closingTitle: "Was willst du dieses Jahr erreichen?",
    closingBody: "Schreib es auf. Den Rest übernimmt Ellma mit dir.",
    closingPlaceholder: "z. B. Einen Halbmarathon laufen",
    closingAction: "Mit Ellma pflanzen",
    footer: "Ellma · der rote Apfel am Horizont ist das Ziel, auf das du zugehst.",
  },

  auth: {
    loginTitle: "Willkommen zurück",
    signupTitle: "Lerne Ellma kennen",
    signupLead: "Erstelle dein Konto. Ellma hilft dir, dein erstes Ziel festzulegen.",
    username: "Dein Vorname",
    email: "E-Mail",
    password: "Passwort",
    passwordHint: "8–72 Zeichen, davon mindestens zwei Sonderzeichen wie ! oder #.",
    login: "Anmelden",
    signup: "Konto erstellen",
    toSignup: "Neu hier? Konto erstellen",
    toLogin: "Schon ein Konto? Anmelden",
    loginFailed: "E-Mail oder Passwort ist falsch.",
    signupFailed: "Das Konto konnte nicht erstellt werden.",
    emailTaken: "Mit dieser E-Mail existiert bereits ein Konto.",
    passwordLength: "Das Passwort muss 8–72 Zeichen haben.",
    passwordSpecial: "Das Passwort braucht mindestens zwei Sonderzeichen.",
    logout: "Abmelden",
  },

  nav: {
    goals: "Ziele",
    today: "Heute",
    progress: "Fortschritt",
    label: "Hauptnavigation",
    yourGoals: "Deine Ziele",
  },

  common: {
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    close: "Schließen",
    loading: "Lädt…",
    working: "Arbeite…",
    retry: "Erneut versuchen",
    error: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    offline: "Server nicht erreichbar. Es werden deine letzten Daten angezeigt.",
    sessionExpired: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
    noGoal: "Kein Ziel",
    theme: "Design",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeSystem: "System",
    language: "Sprache",
    settings: "Einstellungen",
    shortcuts: "Tastenkürzel",
  },

  dock: {
    label: "Ellma, deine Begleiterin",
    talk: "Mit Ellma sprechen",
    stopListening: "Zuhören beenden",
    write: "Ellma schreiben",
    writePlaceholder: "Erzähl Ellma, was du geschafft hast oder was du brauchst…",
    send: "Senden",
    stop: "Stopp",
    listening: "Ich höre zu…",
    listeningHint: "Lass die Leertaste los oder mach eine Pause, ich übernehme.",
    thinking: "Ich überlege…",
    thinkingSlow: "Bin noch dran. Ich laufe auf unserem eigenen Server und brauche einen Moment.",
    history: "Unser Gespräch",
    historyEmpty: "Noch nichts gesagt. Halte die Leertaste und erzähl mir von deinem Tag.",
    clear: "Gespräch vergessen",
    clearConfirm: "Dieses Gespräch vergessen? Deine Ziele bleiben; nur das Gesagte wird geleert.",
    speakOn: "Antworten vorlesen",
    speakOff: "Vorlesen beenden",
    handsFree: "Gesprächsmodus",
    handsFreeHint: "Ich höre nach jeder Antwort wieder zu.",
    hintTalk: "halten zum Sprechen",
    hintWrite: "schreiben",
    hintShortcuts: "alle Kürzel",
    spaceKey: "Leertaste",
    minimize: "Ellma einklappen",
    expand: "Ellmas Begleitung anzeigen",
    dismiss: "Antwort schließen",
    yes: "Ja",
    no: "Nein",
    answer: "Per Stimme antworten",
    you: "Du",
    voiceUnsupported:
      "Spracheingabe ist in diesem Browser nicht verfügbar. Nutze Chrome, Edge oder Safari, oder drücke / zum Schreiben.",
    micDenied:
      "Der Mikrofonzugriff wurde blockiert. Erlaube ihn in den Browser-Einstellungen, um mit mir zu sprechen.",
    busy: "Ich antworte gerade noch in einem anderen Fenster.",
    unavailable: "Mein Modell ist gerade nicht erreichbar. Bitte versuche es gleich noch einmal.",
    modelNote: "Ellma läuft auf einem Open-Weight-Modell auf eigenem Server und kann sich irren.",
    stepPlaceholder: (goal: string) => `Kleinster nächster Schritt für „${goal}“…`,
    stepAdd: "Für heute anlegen",
    brief: "Kurzes Briefing",
    briefLoading: "Ich bereite dein Briefing vor…",
    suggestions: {
      goals: ["Welches Ziel braucht mich am meisten?", "Wie läuft meine Woche?"],
      goal: ["Was sollte hier mein nächster Schritt sein?", "Schlage drei Meilensteine vor"],
      today: ["Plane meinen Tag", "Ich komme nicht voran. Hilf mir anzufangen."],
      progress: ["Was lief diese Woche gut?", "Was sollte ich ändern?"],
      focus: ["Ich hänge hier fest", "Zerlege diesen Schritt"],
    },
    actions: {
      goal_created: "Ziel angelegt",
      task_added: "Schritt geplant",
      task_completed: "Schritt erledigt",
      time_logged: "Zeit erfasst",
      focus_started: "Fokus gestartet",
      milestone_added: "Meilenstein hinzugefügt",
      milestone_done: "Meilenstein erreicht",
    },
    intents: {
      goals: "Hier sind deine Ziele.",
      today: "Hier ist dein Tag.",
      progress: "Hier ist deine Woche.",
      focus: "Fokusmodus. Wähle einen Schritt und los.",
      newGoal: "Lass uns gemeinsam ein neues Ziel setzen.",
      stopped: (duration: string) => `Gestoppt. ${duration} erfasst.`,
      completed: "Erledigt und erfasst. Gut verdient.",
      theme: "Umgeschaltet.",
      help: "Hier ist alles, was du mit der Tastatur tun kannst.",
    },
    cheers: [
      "Erledigt. Einen Schritt näher.",
      "Stark. So erreicht man Ziele.",
      "Abgehakt. Halte dieses Tempo.",
      "Ja! Der zählt.",
    ],
    cheerCount: (count: number) => (count > 1 ? `Das sind ${count} heute.` : ""),
    ripe: (goal: string) => `Wochenziel für „${goal}“ erreicht. Dieser Apfel ist reif.`,
    askAbout: (title: string) =>
      `Hilf mir mit meinem Ziel „${title}“. Was sollte mein nächster Schritt sein?`,
  },

  intro: {
    steps: [
      {
        title: "Hallo, ich bin Ellma.",
        text: "Ich begleite dich zu deinen Zielen. Ich bin hier unten auf jeder Seite und zeige dir immer den nächsten besten Schritt.",
      },
      {
        title: "Sprich einfach mit mir.",
        text: "Halte die Leertaste und sprich, oder drücke / zum Schreiben. Erzähl mir, was du geschafft hast, was du planst oder wo du festhängst.",
      },
      {
        title: "Deine Ziele sind Äpfel.",
        text: "Jeder Apfel füllt sich, während du in der Woche Zeit investierst. Ist er voll, ist er reif. Lass uns deinen ersten pflanzen.",
      },
    ],
    next: "Weiter",
    start: "Los geht's",
    skip: "Einführung überspringen",
  },

  guide: {
    focus_running: {
      text: (what: string) =>
        `Du fokussierst dich auf „${what}“. Ich bin da, wenn du mich brauchst.`,
      action: "Fokus öffnen",
      alt: "Stoppen und speichern",
    },
    first_goal: {
      text: (name: string) =>
        `${name ? `Willkommen, ${name}. ` : ""}Alles hier beginnt mit einem Ziel. Was möchtest du erreichen?`,
      action: "Mein erstes Ziel setzen",
      alt: "",
    },
    carry_over: {
      text: (count: number) =>
        count === 1
          ? "Ein Schritt ist von einem früheren Tag übrig. Soll ich ihn auf heute legen?"
          : `${count} Schritte sind von früheren Tagen übrig. Soll ich sie auf heute legen?`,
      action: "Auf heute legen",
      alt: "Mit Ellma planen",
    },
    start_task: {
      text: (task: string, goal: string) =>
        goal
          ? `Dein nächster Schritt für „${goal}“: ${task}. Bereit?`
          : `Als Nächstes auf deiner Liste: ${task}. Bereit?`,
      action: "Fokus starten",
      alt: "Schon erledigt",
    },
    next_step: {
      text: (goal: string) =>
        `„${goal}“ hat noch keinen nächsten Schritt. Was ist das Kleinste, das du dafür tun könntest?`,
      action: "Schritt hinzufügen",
      alt: "Schritte vorschlagen",
    },
    plan_today: {
      text: (task: string, goal: string) =>
        goal
          ? `Für heute ist nichts geplant. Wie wäre es mit „${task}“ für „${goal}“?`
          : `Für heute ist nichts geplant. Wie wäre es mit „${task}“?`,
      action: "Heute machen",
      alt: "Mit Ellma planen",
    },
    weekly_gap: {
      text: (goal: string, left: string) =>
        `Noch ${left} für „${goal}“ in dieser Woche. Jetzt eine kurze Sitzung?`,
      action: "Sitzung starten",
      alt: "",
    },
    day_done: {
      text: (count: number) =>
        count > 1
          ? `${count} Schritte heute erledigt. So erreicht man Ziele. Genieße den Rest deines Tages.`
          : count === 1
            ? "Ein Schritt heute erledigt. Kleine Schritte summieren sich. Genieße den Rest deines Tages."
            : "Gerade wartet nichts. Erzähl mir, was dich beschäftigt.",
      action: "Noch ein Schritt",
      alt: "Morgen planen",
    },
    planDayPrompt: "Hilf mir, meinen Tag zu planen.",
    planTomorrowPrompt: "Hilf mir, morgen zu planen.",
  },

  wizard: {
    title: "Neues Ziel mit Ellma",
    progress: (step: number, total: number) => `Frage ${step} von ${total}`,
    what: {
      ask: "Was möchtest du erreichen?",
      help: "Ein Satz genügt. Sag es so, wie du es einer Freundin erzählen würdest.",
      placeholder: "z. B. Einen Halbmarathon laufen",
      examples: [
        "Einen Halbmarathon laufen",
        "Spanisch lernen",
        "Meinen Online-Shop starten",
        "20 Bücher lesen",
      ],
    },
    why: {
      ask: (goal: string) => `Warum ist dir „${goal}“ wichtig?`,
      help: "Daran erinnere ich dich, wenn es schwer wird.",
      placeholder: "Was wird anders sein, wenn du dort bist?",
    },
    hours: {
      ask: "Wie viele Stunden pro Woche kannst du dafür geben?",
      help: "Der Apfel deines Ziels füllt sich, während du Zeit investierst. Erreichst du diese Zahl in einer Woche, ist er reif.",
      unit: "Stunden pro Woche",
      none: "Kein Wochenziel",
    },
    deadline: {
      ask: "Gibt es ein Datum, bis zu dem du dort sein möchtest?",
      help: "Ein Datum macht es greifbar. Du kannst es jederzeit ändern.",
      none: "Kein Datum",
      month1: "In 1 Monat",
      month3: "In 3 Monaten",
      month6: "In 6 Monaten",
      year1: "In 1 Jahr",
      pick: "Oder wähle ein Datum",
    },
    step: {
      ask: "Was ist der allererste kleine Schritt?",
      help: "Etwas, das du in zehn Minuten beginnen könntest. Ich lege es auf heute.",
      placeholder: "z. B. Einen 12-Wochen-Trainingsplan suchen",
    },
    back: "Zurück",
    next: "Weiter",
    skip: "Überspringen",
    create: "Dieses Ziel pflanzen",
    creating: "Wird gepflanzt…",
    dictate: "Antwort diktieren",
    dictating: "Ich höre zu… sprich jetzt",
    enterHint: "Enter ↵",
    doneTitle: (goal: string) => `„${goal}“ ist gepflanzt.`,
    doneText: "Ich behalte es im Blick und zeige dir immer den nächsten Schritt.",
    doneStep: (step: string) => `Dein erster Schritt steht für heute: ${step}`,
    startNow: "Ersten Schritt jetzt starten",
    openGoal: "Ziel öffnen",
  },

  today: {
    greetingMorning: "Guten Morgen",
    greetingAfternoon: "Guten Tag",
    greetingEvening: "Guten Abend",
    lead: "Dein Tag, nach Zielen sortiert. Ein kleiner Schritt pro Ziel genügt.",
    noStepToday: "Noch kein Schritt für heute.",
    pull: "Heute machen",
    waiting: "Wartet auf einen Tag",
    otherTitle: "Ohne Ziel",
    otherHint: "Diese Schritte füllen keinen Apfel. Ordne sie einem Ziel zu, wenn du kannst.",
    carried: "übertragen",
    addStep: "Schritt für heute hinzufügen…",
    plannedTitle: "Heute",
    empty: "Noch nichts geplant. Welcher kleine Schritt würde heute ein Ziel voranbringen?",
    overdue: "Übertragen",
    moveAllToToday: "Alle auf heute",
    done: "Heute erledigt",
    goalsTitle: "Deine Ziele",
    goalsEmpty: "Noch keine aktiven Ziele. Erzähl Ellma von einem oder lege es selbst an.",
    hoursThisWeek: "diese Woche",
    focusedToday: "Heute fokussiert",
    tasksDone: "Erledigt",
    later: "Später",
    laterEmpty: "Aufgaben ohne Tag landen hier.",
  },

  tasks: {
    addPlaceholder: "Aufgabe hinzufügen…",
    add: "Hinzufügen",
    newTask: "Neue Aufgabe",
    editTask: "Aufgabe bearbeiten",
    title: "Titel",
    notes: "Notizen",
    goal: "Ziel",
    plannedOn: "Tag",
    unplanned: "Kein Tag",
    estimate: "Schätzung (Minuten)",
    markDone: "Als erledigt markieren",
    markOpen: "Als offen markieren",
    startFocus: "Fokus starten",
    moveToday: "Heute",
    moveTomorrow: "Morgen",
    moveLater: "Später",
    deleteConfirm: "Diese Aufgabe löschen? Erfasste Fokuszeit bleibt erhalten.",
    more: "Weitere Aktionen",
  },

  goals: {
    lead: "Jeder Apfel ist ein Ziel. Er füllt sich, während du diese Woche Zeit investierst.",
    weekOf: (done: string, target: string) => `${done} von ${target} Std. diese Woche`,
    weekFree: (done: string) => `${done} Std. diese Woche`,
    nextStep: "Nächster Schritt",
    noStep: "Noch kein nächster Schritt",
    addStep: "Schritt hinzufügen",
    start: "Starten",
    states: {
      ripe: "Diese Woche reif",
      on_track: "Auf Kurs",
      behind: "Braucht Aufmerksamkeit",
      resting: "Ruht",
    },
    journey: "Weg",
    journeyStart: "Start",
    journeyEnd: "Ziel erreicht",
    emptyTitle: "Noch keine Ziele.",
    milestoneCount: (done: number, total: number) => `${done} von ${total} Meilensteinen`,
    reached: "Als erreicht markieren",
    reachedCheer: (goal: string) => `Du hast „${goal}“ erreicht. Ich bin stolz auf dich.`,
    title: "Ziele",
    newGoal: "Neues Ziel",
    editGoal: "Ziel bearbeiten",
    name: "Ziel",
    namePlaceholder: "z. B. Einen Halbmarathon laufen",
    why: "Warum es dir wichtig ist",
    whyPlaceholder: "Was wird anders sein, wenn du dort bist?",
    color: "Farbe",
    weeklyTarget: "Stunden pro Woche",
    targetDate: "Zieldatum",
    status: "Status",
    statuses: { active: "Aktiv", completed: "Erreicht", archived: "Archiviert" },
    milestones: "Meilensteine",
    addMilestone: "Meilenstein hinzufügen",
    milestonePlaceholder: "z. B. Erste 10 km ohne Pause",
    milestonesEmpty: "Meilensteine markieren die Momente, die man feiern sollte.",
    openTasks: "Nächste Schritte",
    noTasks: "Keine offenen Schritte. Frag Ellma, was als Nächstes kommen könnte.",
    totalHours: "Investierte Stunden",
    thisWeek: "Diese Woche",
    target: "Ziel",
    daysLeft: (days: number) =>
      days > 1
        ? `Noch ${days} Tage`
        : days === 1
          ? "Noch 1 Tag"
          : days === 0
            ? "Heute fällig"
            : "Überfällig",
    deleteConfirm:
      "Dieses Ziel löschen? Aufgaben und erfasste Zeit bleiben, sind aber keinem Ziel mehr zugeordnet.",
    empty: "Ein Ziel ist etwas, das deine besten Stunden verdient. Fang mit einem an.",
    showInactive: "Erreichte und archivierte anzeigen",
    back: "Alle Ziele",
    colors: {
      apple: "Apfelrot",
      amber: "Bernstein",
      leaf: "Blatt",
      teal: "Petrol",
      sky: "Himmel",
      indigo: "Indigo",
      plum: "Pflaume",
      slate: "Schiefer",
    },
  },

  focus: {
    title: "Fokus",
    start: "Fokus starten",
    stop: "Stopp",
    complete: "Abschließen",
    completeHint: "⌘/Strg + Enter",
    pickTask: "Worauf fokussierst du dich?",
    freeFocus: "Freier Fokus",
    running: "Im Fokus",
    exit: "Fokusmodus verlassen",
    sessionSaved: (duration: string) => `${duration} erfasst.`,
    taskCompleted: "Aufgabe erledigt. Gut verdient.",
    open: "Fokusmodus öffnen",
    logTime: "Zeit erfassen",
    logTitle: "Zeit erfassen",
    minutes: "Minuten",
    endedAt: "Beendet um",
    logged: "Zeit erfasst.",
  },

  progress: {
    lead: "Wohin deine Stunden diese Woche geflossen sind, Ziel für Ziel.",
    title: "Fortschritt",
    total: "Diese Woche fokussiert",
    perGoal: "Stunden pro Ziel",
    perDay: "Stunden pro Tag",
    completedTasks: "Erledigte Aufgaben",
    bestDay: "Bester Tag",
    ofTarget: (percent: number) => `${percent} % vom Ziel`,
    noTarget: "Kein Wochenziel",
    empty:
      "Diese Woche noch keine Fokuszeit. Starte eine Fokus-Sitzung oder erzähl Ellma, woran du gearbeitet hast.",
    sessions: "Sitzungen",
    deleteSession: "Sitzung löschen",
    deleteSessionConfirm: "Diese Fokus-Sitzung löschen?",
    previous: "Vorherige Woche",
    next: "Nächste Woche",
    thisWeek: "Diese Woche",
    weekNumber: (week: number) => `KW ${week}`,
    reflect: "Mit Ellma reflektieren",
    reflectPrompt:
      "Lass uns auf meine Woche zurückblicken. Was lief gut und was sollte ich ändern?",
  },

  shortcuts: {
    title: "Tastenkürzel",
    hint: "Drücke jederzeit ?, um diese Liste zu sehen.",
    groups: [
      {
        title: "Ellma",
        list: [
          { combo: "Leertaste", label: "Halten, um mit Ellma zu sprechen (überall)" },
          { combo: "⌘/Strg J", label: "Zuhören starten / beenden" },
          { combo: "/", label: "Ellma schreiben" },
          { combo: "V", label: "Antworten vorlesen an / aus" },
          { combo: "Esc", label: "Antwort und Sprache stoppen" },
        ],
      },
      {
        title: "Navigieren",
        list: [
          { combo: "1 – 3", label: "Ziele, Heute, Fortschritt" },
          { combo: "?", label: "Tastenkürzel" },
          { combo: "D", label: "Hell / Dunkel" },
        ],
      },
      {
        title: "Erstellen",
        list: [
          { combo: "N", label: "Neue Aufgabe" },
          { combo: "G", label: "Neues Ziel, begleitet von Ellma" },
          { combo: "L", label: "Zeit erfassen" },
        ],
      },
      {
        title: "Aufgaben",
        list: [
          { combo: "J / K", label: "Nächste / vorherige Aufgabe" },
          { combo: "X", label: "Ausgewählte Aufgabe erledigen" },
          { combo: "E", label: "Ausgewählte Aufgabe bearbeiten" },
          { combo: "P", label: "Fokus auf ausgewählte Aufgabe" },
        ],
      },
      {
        title: "Fokus",
        list: [
          { combo: "F", label: "Fokusmodus" },
          { combo: "⌘/Strg ↵", label: "Aufgabe im Fokus abschließen" },
          { combo: "S", label: "Stoppen und Sitzung speichern" },
        ],
      },
    ],
  },

  weekdaysShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  dateLocale: "de-DE",
  speechLocale: "de-DE",
};
