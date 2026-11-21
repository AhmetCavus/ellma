import type { Copy } from "./en.js";

export const de: Copy = {
  appName: "ellma",
  tagline: "Deine Begleiterin zu deinen Zielen",
  languageName: "Deutsch",

  landing: {
    eyebrow: "Eine persönliche Begleiterin für deine Ziele",
    titleStart: "Deine Ziele verdienen eine",
    titleEmphasis: "Begleiterin.",
    lead: "ellma behält deine Ziele im Blick, hört zu, wenn du sprichst, und kennt immer deinen nächsten kleinen Schritt. Jede investierte Stunde füllt einen Apfel, bis er reif ist.",
    primary: "ellma kennenlernen",
    secondary: "Anmelden",
    github: "GitHub",
    githubHint: "Quellcode auf GitHub (öffnet in neuem Tab)",
    demo: {
      caption: "So arbeitet ellma. Wähle einen Satz und probiere es aus.",
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
        body: "ellma stellt fünf kurze Fragen: was, warum, wie viele Stunden, bis wann und dein erster Schritt.",
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
    closingBody: "Schreib es auf. Den Rest übernimmt ellma mit dir.",
    closingPlaceholder: "z. B. Einen Halbmarathon laufen",
    closingAction: "Mit ellma pflanzen",
    tourLink: "So funktioniert’s",
    tour: {
      eyebrow: "In Aktion",
      title: "Vom Wunsch zum reifen Apfel",
      lead: "Aufgenommen in ellma selbst, mit einem Beispielkonto.",
      items: [
        {
          title: "Ein Ziel in fünf Fragen pflanzen",
          body: "Kein Formular. ellma fragt, was, warum, wie viele Stunden pro Woche, bis wann und was der allererste kleine Schritt ist. Tippe die Antworten oder sprich sie.",
          alt: "ellma stellt fünf kurze Fragen und das Ziel wird als Apfel gepflanzt",
        },
        {
          title: "Die Woche per Ziehen planen",
          body: "Leg ein Ziel auf einen Tag und sein nächster Schritt wandert dorthin. Zu jedem Ziehen gibt es auch einen Knopf, für Tastatur und Touchscreen.",
          alt: "Eine Zielkarte wird auf morgen gezogen und ihr nächster Schritt wandert mit",
        },
        {
          title: "Ein Schritt, ein Timer",
          body: "Die Begleitung führt direkt in den Fokusmodus. Pausiere, wenn das Leben ruft. Sag oder schreib „fertig“, und der Schritt ist erledigt und die Zeit gespeichert.",
          alt: "ellma schlägt den nächsten Schritt vor, der Fokusmodus startet und „fertig“ schließt ihn ab",
        },
        {
          title: "Beim Reifen zusehen",
          body: "Jede investierte Minute füllt den Apfel des Ziels. Erreichst du das Wochenziel, ist er reif, und ellma freut sich mit dir.",
          alt: "Eine erfasste Stunde füllt den Apfel eines Ziels, bis er reif ist",
        },
      ],
    },
    privacy: {
      eyebrow: "Datenschutz",
      title: "Deine Ziele bleiben bei dir",
      items: [
        {
          title: "Ein Modell auf diesem Server",
          body: "ellmas Antworten stammen von einem Open-Weight-Modell, das direkt neben ihr läuft. Kein externer KI-Dienst liest deine Ziele oder was du ihr erzählst.",
        },
        {
          title: "Deine eigene Installation",
          body: "Ziele, Schritte und Fokuszeit liegen in der Datenbank dieser Installation. Jedes Konto sieht nur seine eigenen Daten.",
        },
        {
          title: "Keine Cookies, kein Tracking",
          body: "ellma setzt keine Cookies und hat weder Statistik noch Werbung. Der Browser behält nur, was die App zum Funktionieren braucht.",
        },
      ],
    },
    assmaHint: "assma, die Schwester-App für die Projektakquise von Freelancern",
    footer: "ellma · der rote Apfel am Horizont ist das Ziel, auf das du zugehst.",
  },

  auth: {
    loginTitle: "Willkommen zurück",
    signupTitle: "Lerne ellma kennen",
    signupLead: "Erstelle dein Konto. ellma hilft dir, dein erstes Ziel festzulegen.",
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
    forgot: "Passwort vergessen?",
    backToLogin: "Zurück zur Anmeldung",
    codeTitle: "Noch ein Schritt",
    codeLead:
      "Gib den 6-stelligen Code aus deiner Authenticator-App ein. Handy nicht zur Hand? Nimm einen deiner Ersatzcodes.",
    code: "Code",
    codeFailed: "Dieser Code stimmt nicht. Warte auf den nächsten und versuch es noch einmal.",
    tooMany: "Zu viele Versuche. Bitte warte ein paar Minuten und versuch es dann noch einmal.",
    forgotTitle: "Passwort zurücksetzen",
    forgotLead:
      "Gib deine E-Mail ein. Wenn es dazu ein Konto gibt, schickt ellma dir einen Link, mit dem du ein neues Passwort wählst.",
    forgotSend: "Link senden",
    forgotSent:
      "Wenn es zu dieser Adresse ein Konto gibt, ist ein Link unterwegs. Er gilt einmal und 30 Minuten lang.",
    forgotUnavailable:
      "Diese Installation kann noch keine E-Mails senden. Bitte wende dich an den Kontakt im Impressum, um dein Passwort zurückzusetzen.",
    resetTitle: "Neues Passwort wählen",
    resetLead:
      "Beim Speichern wirst du überall abgemeldet. Danach meldest du dich mit dem neuen Passwort an.",
    newPassword: "Neues Passwort",
    repeatPassword: "Neues Passwort wiederholen",
    passwordMismatch: "Die beiden Passwörter stimmen nicht überein.",
    resetSave: "Neues Passwort speichern",
    resetDone: "Dein Passwort ist geändert. Melde dich mit dem neuen an.",
    resetInvalid: "Dieser Link ist nicht mehr gültig. Fordere einen neuen an.",
  },

  nav: {
    goals: "Ziele",
    today: "Heute",
    progress: "Fortschritt",
    label: "Hauptnavigation",
    yourGoals: "Deine Ziele",
    account: "Konto",
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
    label: "ellma, deine Begleiterin",
    talk: "Mit ellma sprechen",
    stopListening: "Zuhören beenden",
    write: "ellma schreiben",
    writePlaceholder: "Erzähl ellma, was du geschafft hast oder was du brauchst…",
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
    minimize: "ellma einklappen",
    expand: "ellmas Begleitung anzeigen",
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
    modelNote: "ellma läuft auf einem Open-Weight-Modell auf eigenem Server und kann sich irren.",
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
        title: "Hallo, ich bin ellma.",
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
      alt: "Mit ellma planen",
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
      alt: "Mit ellma planen",
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
    title: "Neues Ziel mit ellma",
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
    lead: "Deine Schritte nach Tagen, heute zuerst. Ein kleiner Schritt pro Ziel genügt.",
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
    goalsEmpty: "Noch keine aktiven Ziele. Erzähl ellma von einem oder lege es selbst an.",
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
    created: "Aufgabe erstellt",
    createdDetail: (title: string) => `„${title}“ steht auf deiner Liste.`,
    ok: "OK",
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
      behind: "Hinter dem Wochenplan",
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
    noTasks: "Keine offenen Schritte. Frag ellma, was als Nächstes kommen könnte.",
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
    attention: { step_overdue: "Schritt überfällig", no_next_step: "Kein nächster Schritt" },
    deadline: (date: string) => `Ziel bis ${date}`,
    tags: "Tags",
    tagPlaceholder: "Neuer oder vorhandener Tag, z. B. Gesundheit",
    addTag: "Tag hinzufügen",
    removeTag: (tag: string) => `Tag ${tag} entfernen`,
    tagLimit: "Bis zu 10 Tags pro Ziel.",
    groupedHint: "Gruppiert nach dem Tag des nächsten geplanten Schritts.",
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

  views: {
    label: "Filtern und sortieren",
    groups: {
      overdue: "Überfällig",
      today: "Heute",
      tomorrow: "Morgen",
      later: "Später",
      none: "Ohne Termin",
    },
    tags: "Tags",
    status: "Status",
    sort: "Sortierung",
    noTags: "Tags fügst du beim Bearbeiten eines Ziels hinzu und filterst dann hier danach.",
    active: (list: string) => `Gefiltert nach ${list}`,
    reset: "Filter zurücksetzen",
    nothing: "Nichts passt zu diesen Filtern.",
    goalSorts: { position: "Eigene Reihenfolge", deadline: "Zieldatum", title: "Titel" },
    stepSorts: { position: "Eigene Reihenfolge", goal: "Ziel", title: "Schritttitel" },
    stepStatuses: { open: "Offen", done: "Erledigt" },
    moveOverdue: "Alle auf heute legen",
    layout: "Ansicht",
    goalsDragHint: "Zieh ein Ziel auf einen Tag, um seinen nächsten Schritt dort zu planen.",
    todayDragHint:
      "Zieh eine Karte auf eine andere, um dich auf beide gleichzeitig zu fokussieren.",
    dropHere: "Hier ablegen",
    planFor: "Nächsten Schritt planen",
    planned: (goal: string, group: string) => `„${goal}“: nächster Schritt geplant für ${group}.`,
    firstStepTitle: (goal: string) => `Erster Schritt für „${goal}“`,
    firstStepLabel: "Was ist der erste kleine Schritt?",
    firstStepAdd: "Schritt hinzufügen",
    cardActions: "Kartenaktionen",
    mergeWith: (title: string) => `Mit „${title}“ zusammenlegen`,
    split: "Karten trennen",
    merged: (count: number) => `${count} Ziele zusammen`,
    focusTogether: "Gemeinsam fokussieren",
    cards: "Kartenansicht",
    list: "Listenansicht",
    overdueNote: (count: number) =>
      count === 1 ? "1 Schritt ist überfällig." : `${count} Schritte sind überfällig.`,
  },

  focus: {
    title: "Fokus",
    start: "Fokus starten",
    stop: "Fokus beenden",
    complete: "Aufgabe abschließen",
    completeHint: "⌘/Strg + Enter",
    stopHelp: "Speichert die Zeit. Die Aufgabe bleibt offen.",
    stopHelpMulti: "Speichert die Zeit. Die Schritte bleiben offen.",
    multi: "Mehrfachfokus",
    multiTitle: (count: number) => `${count} Schritte gleichzeitig`,
    multiPick: "Wähle die Schritte für deinen Fokus",
    multiHint: "Deine Zeit wird gleichmäßig auf die gewählten Schritte verteilt.",
    multiStart: (count: number) => `Auf ${count} Schritte fokussieren`,
    multiNeedTwo: "Wähle mindestens zwei Schritte.",
    multiMax: (count: number) => `Höchstens ${count} Schritte gleichzeitig.`,
    multiPlanned: "Für heute geplant oder überfällig",
    multiOther: "Weitere offene Schritte",
    multiNone: "Diese Ziele haben weniger als zwei offene Schritte.",
    completeAll: "Alle Schritte abschließen",
    completeAllHelp: "Speichert die Zeit und hakt jeden Schritt ab.",
    savedSplit: (count: number) => `verteilt auf ${count} Schritte`,
    savedTasks: "Schritte abgeschlossen.",
    pause: "Pause",
    resume: "Weiter",
    paused: "Pausiert",
    pauseHelp: "Speichert die bisherige Zeit. Weiter geht es, wann du willst.",
    pausedNote: "Die bisherige Zeit ist gespeichert. Weiter geht es, wann du willst.",
    pauseFailed:
      "Die Pause konnte nicht gespeichert werden. Dein Timer läuft weiter, versuch es bitte noch einmal.",
    resumeFailed: "Der Fokus konnte nicht fortgesetzt werden. Versuch es bitte noch einmal.",
    completeHelp: "Speichert die Zeit und hakt die Aufgabe ab.",
    saving: "Wird gespeichert…",
    saveFailed:
      "Die Sitzung konnte nicht gespeichert werden. Dein Timer läuft weiter, versuch es bitte noch einmal.",
    saved: (duration: string) => `${duration} gespeichert`,
    savedWeek: (done: string, target: string) => `${done} von ${target} Stunden diese Woche`,
    savedWeekFree: (done: string) => `${done} Stunden diese Woche`,
    savedTask: "Aufgabe abgeschlossen.",
    savedDuration: (seconds: number) => {
      const total = Math.max(0, Math.round(seconds / 60));
      const hours = Math.floor(total / 60);
      const rest = total % 60;
      if (hours === 0) {
        return total === 1 ? "1 Minute" : `${total} Minuten`;
      }
      return rest === 0 ? `${hours} Std.` : `${hours} Std. ${rest} Min.`;
    },
    backToToday: "Zurück zu Heute",
    again: "Neuen Fokus starten",
    pickTask: "Worauf fokussierst du dich?",
    freeFocus: "Freier Fokus",
    running: "Im Fokus",
    exit: "Fokusmodus verlassen",
    sessionSaved: (duration: string) => `${duration} erfasst.`,
    taskCompleted: "Aufgabe erledigt. Gut verdient.",
    open: "Fokusmodus öffnen",
    scenes: {
      pendulum: "Pendel",
      bright: "Pendel · hell",
      melodic: "Pendel · melodisch",
      vintage: "Pendel · alt",
      warm: "Pendel · warm",
      night: "Pendel · Nacht",
    },
    muteSound: "Fokusklang stummschalten",
    unmuteSound: "Fokusklang abspielen",
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
      "Diese Woche noch keine Fokuszeit. Starte eine Fokus-Sitzung oder erzähl ellma, woran du gearbeitet hast.",
    sessions: "Sitzungen",
    deleteSession: "Sitzung löschen",
    deleteSessionConfirm: "Diese Fokus-Sitzung löschen?",
    previous: "Vorherige Woche",
    next: "Nächste Woche",
    thisWeek: "Diese Woche",
    weekNumber: (week: number) => `KW ${week}`,
    reflect: "Mit ellma reflektieren",
    reflectPrompt:
      "Lass uns auf meine Woche zurückblicken. Was lief gut und was sollte ich ändern?",
  },

  reminder: {
    tabTitle: (task: string) =>
      task ? `🍎 ellma: „${task}“ wartet auf dich` : "🍎 ellma: Dein nächster Schritt wartet",
  },

  account: {
    title: "Dein Konto",
    lead: "Halte deine Anmeldung sicher. Deine Ziele hängen daran.",
    behaviour: {
      title: "Klänge und Erinnerungen",
      lead: "So verhält sich ellma auf diesem Gerät. Alles hier lässt sich ausschalten.",
      sounds: {
        title: "Klänge",
        text: "Kurze, leise Klänge, wenn du den Fokus startest oder beendest, einen Schritt abschließt oder einen Meilenstein erreichst.",
      },
      ambience: {
        title: "Fokusklang",
        text: "Ruhige Pendelstücke mit stillen Pausen, morgens heller und nachts sanfter. Du kannst ihn auch im Fokusmodus stummschalten.",
      },
      notificationSounds: {
        title: "Benachrichtigungstöne",
        text: "Ein sanfter Ton, wenn ellma etwas für dich erledigt hat oder Neuigkeiten hat, und der Erinnerungsklang. Dein Fokusklang bleibt davon unberührt.",
      },
      reminders: {
        title: "Erinnerungen",
        text: "Wenn ein Schritt wartet und du diesen Tab seit 20 Minuten verlassen hast, spielt ellma einen sanften Klang und zeigt den Schritt im Tab-Titel. Höchstens dreimal, mit einer Stunde Abstand.",
      },
    },
    profileTitle: "Profil",
    name: "Name",
    role: "Rolle",
    roles: { user: "Nutzer", admin: "Admin", root: "Root" },
    passwordTitle: "Passwort",
    passwordLead: "Wenn du es änderst, wirst du auf deinen anderen Geräten abgemeldet.",
    currentPassword: "Aktuelles Passwort",
    changePassword: "Passwort ändern",
    passwordChanged: "Passwort geändert. Andere Geräte sind abgemeldet.",
    wrongPassword: "Das aktuelle Passwort stimmt nicht.",
    twoFactorTitle: "Zwei-Faktor-Anmeldung",
    twoFactorLead:
      "Füge der Anmeldung einen zweiten Schritt hinzu: einen Code aus einer Authenticator-App auf deinem Handy. Selbst mit deinem Passwort kommt dann niemand sonst hinein.",
    statusOn: "An",
    statusOff: "Aus",
    enable: "Zwei-Faktor-Anmeldung einrichten",
    confirmPassword: "Bestätige zuerst mit deinem Passwort",
    next: "Weiter",
    scanTitle: "Scanne diesen Code",
    scanLead:
      "Öffne eine Authenticator-App (zum Beispiel Aegis, Google Authenticator oder 1Password) und scanne den QR-Code. Keine Kamera? Gib den Schlüssel von Hand ein.",
    qrLabel: "QR-Code für deine Authenticator-App",
    manualKey: "Schlüssel",
    enterCode: "Gib dann den 6-stelligen Code ein, den die App anzeigt",
    activate: "Einschalten",
    enabled: "Die Zwei-Faktor-Anmeldung ist an.",
    backupTitle: "Sichere deine Ersatzcodes",
    backupLead:
      "Jeder Code gilt einmal, wenn du nicht an deine Authenticator-App kommst. Sie werden nur jetzt angezeigt, also bewahre sie sicher auf.",
    backupCopy: "Codes kopieren",
    backupCopied: "Kopiert.",
    backupDone: "Ich habe sie gesichert",
    backupLeft: (count: number) =>
      count === 1 ? "Noch 1 Ersatzcode" : `Noch ${count} Ersatzcodes`,
    disable: "Ausschalten",
    disableLead:
      "Gib dein Passwort und einen aktuellen Code ein, um die Zwei-Faktor-Anmeldung auszuschalten.",
    disabled: "Die Zwei-Faktor-Anmeldung ist aus.",
  },
  mail: {
    recovery: {
      subject: "Dein ellma-Passwort zurücksetzen",
      body: (name: string, link: string, minutes: number) => [
        `Hallo ${name},`,
        "du möchtest dein ellma-Passwort zurücksetzen. Öffne diesen Link, um ein neues zu wählen:",
        link,
        `Der Link gilt einmal und ${minutes} Minuten lang. Wenn du die Zwei-Faktor-Anmeldung nutzt, bleibt sie an.`,
        "Wenn du das nicht warst, ignoriere diese E-Mail. Dein Passwort bleibt, wie es ist.",
      ],
    },
  },
  admin: {
    title: "ellma Admin",
    subtitle: "Verwaltung",
    loginTitle: "Admin-Anmeldung",
    noPermission: "Dieses Konto hat keine Admin-Rechte.",
    refresh: "Aktualisieren",
    tabs: { overview: "Überblick", users: "Konten" },
    privacyNote:
      "Hier siehst du nur Konten und Summen. Ziele, Schritte und Gespräche bleiben privat.",
    overview: {
      users: "Konten",
      admins: "Admins",
      twoFactorUsers: "Mit Zwei-Faktor-Anmeldung",
      newUsersThisWeek: "Neu diese Woche",
      activeUsersThisWeek: "Aktiv diese Woche",
      goals: "Ziele",
      tasks: "Schritte",
      tasksDone: "Erledigte Schritte",
      focusHours: "Investierte Stunden",
      focusHoursThisWeek: "Stunden diese Woche",
      assistantMessages: "Nachrichten an ellma",
      peopleTitle: "Menschen",
      usageTitle: "Nutzung",
    },
    system: {
      title: "System",
      version: "Version",
      model: "KI-Modell",
      modelUp: "erreichbar",
      modelDown: "nicht erreichbar",
      mail: "E-Mail",
      mailOn: "eingerichtet",
      mailOff: "nicht eingerichtet, daher ist das Zurücksetzen per E-Mail aus",
    },
    users: {
      search: "Name oder E-Mail suchen",
      count: (shown: number, total: number) => {
        const accounts = total === 1 ? "1 Konto" : `${total} Konten`;
        return shown === total ? accounts : `${shown} von ${accounts}`;
      },
      empty: "Keine passenden Konten.",
      name: "Name",
      email: "E-Mail",
      role: "Rolle",
      twoFactor: "2FA",
      joined: "Dabei seit",
      lastActive: "Zuletzt aktiv",
      goals: "Ziele",
      tasks: "Schritte",
      hours: "Stunden",
      never: "nie",
      you: "du",
      actions: "Aktionen",
      makeAdmin: "Zum Admin machen",
      makeUser: "Admin-Rechte entziehen",
      resetTwoFactor: "Zwei-Faktor-Anmeldung zurücksetzen",
      sendRecovery: "E-Mail zum Zurücksetzen senden",
      delete: "Konto löschen",
      confirmMakeAdmin: (name: string) =>
        `${name} Admin-Rechte geben? Admins können alle Konten verwalten.`,
      confirmMakeUser: (name: string) => `${name} die Admin-Rechte entziehen?`,
      confirmResetTwoFactor: (name: string) =>
        `Die Zwei-Faktor-Anmeldung für ${name} ausschalten? Tu das nur, wenn du sicher bist, wer fragt.`,
      confirmSendRecovery: (email: string) =>
        `Einen Link zum Zurücksetzen des Passworts an ${email} senden?`,
      deleteTitle: "Konto löschen",
      deleteLead:
        "Das entfernt das Konto mit allen Zielen, Schritten, Fokuszeiten und Gesprächen. Es lässt sich nicht rückgängig machen.",
      deleteConfirm: (email: string) => `Tippe zur Bestätigung ${email}`,
      roleChanged: "Rolle geändert. Das Konto muss sich neu anmelden.",
      twoFactorReset: "Die Zwei-Faktor-Anmeldung ist für dieses Konto ausgeschaltet.",
      recoverySent: "E-Mail zum Zurücksetzen gesendet.",
      deleted: "Konto gelöscht.",
      mailUnavailable: "E-Mail ist nicht eingerichtet oder dieses Konto hat keine E-Mail-Adresse.",
      mailFailed: "Der Mailserver hat die Nachricht nicht angenommen.",
      notAllowed: "Du darfst dieses Konto nicht ändern.",
    },
  },
  legal: {
    footer: {
      label: "Rechtliches",
      privacy: "Datenschutz",
      terms: "AGB",
      cookies: "Cookie-Einstellungen",
      imprint: "Impressum",
      poweredBy: "Powered by",
    },
    back: "Zurück zu ellma",
    updated: "Stand: 18. November 2026",
    imprint: {
      title: "Impressum",
      lead: "Wer ellma betreibt und wie du uns erreichst.",
      operator: "Betreiber",
      representative: "Vertreten durch",
      contact: "Kontakt",
      email: "E-Mail",
      phone: "Telefon",
      register: "Registereintrag",
      vat: "USt-IdNr.",
      missing:
        "Die Angaben zum Betreiber wurden für diese Installation noch nicht hinterlegt. ellma befindet sich im geschlossenen Alpha-Test und wird nicht öffentlich angeboten.",
      aboutTitle: "Über diesen Dienst",
      about:
        "ellma ist eine persönliche Begleiterin für deine Ziele und ein Testprojekt von yappai. Sie befindet sich im Alpha-Stadium: kostenlos und ohne zugesicherte Verfügbarkeit.",
    },
    privacy: {
      title: "Datenschutz",
      lead: "ellma ist so gebaut, dass deine Ziele bei dir bleiben. Hier steht klar, was gespeichert wird, wo und warum.",
      sections: [
        {
          title: "Wer verantwortlich ist",
          body: [
            "Verantwortlich für die Verarbeitung deiner Daten ist der im Impressum genannte Betreiber. Nutze die Kontaktdaten dort für alle Fragen und Anliegen zum Datenschutz.",
          ],
        },
        {
          title: "Was ellma speichert",
          body: [
            "Dein Konto: Vorname, E-Mail-Adresse und ein gehashtes Passwort.",
            "Wenn du die Zwei-Faktor-Anmeldung einschaltest: den Schlüssel deiner Authenticator-App in verschlüsselter Form und deine Ersatzcodes nur als Prüfsummen. Wenn du dein Passwort zurücksetzen lässt: eine Prüfsumme des Links, bis er benutzt wurde oder nach 30 Minuten abläuft.",
            "Deine Inhalte: Ziele mit Beweggründen, Meilensteinen, Wochenzielen und deinen eigenen Tags, Schritte, Fokus-Sitzungen und erfasste Zeit, Tagesnotizen sowie das Gespräch mit ellma.",
            "Wir nutzen diese Daten nur, um dir ellma bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO). Es gibt keine Werbung, keine Analyse und kein Profiling.",
          ],
        },
        {
          title: "Wo es gespeichert wird",
          body: [
            "Alles liegt auf einem eigenen Server von yappai. Anfragen erreichen ihn über Cloudflare; Cloudflare transportiert die verschlüsselte Verbindung und verarbeitet dabei in unserem Auftrag technische Verbindungsdaten wie deine IP-Adresse.",
            "Server-Protokolle mit technischen Verbindungsdaten werden kurzzeitig aufbewahrt, um den Dienst sicher und funktionsfähig zu halten (Art. 6 Abs. 1 lit. f DSGVO).",
          ],
        },
        {
          title: "Das KI-Modell",
          body: [
            "ellmas Antworten stammen von einem Sprachmodell mit offenen Gewichten, das auf demselben Server läuft. Was du ellma sagst oder schreibst und die Ziele, die sie für ihre Antwort braucht, gehen an keinen externen KI-Anbieter und werden nicht zum Training von Modellen verwendet.",
          ],
        },
        {
          title: "Sprache",
          body: [
            "Zum Zuhören nutzt ellma die Spracherkennung deines Browsers. Je nach Browser wandeln die Server des Browser-Herstellers die Aufnahme in Text um (in Chrome zum Beispiel Google). ellma selbst erhält nur den Text und speichert keine Tonaufnahmen.",
            "Das Mikrofon ist nur aktiv, solange du die Sprechtaste hältst oder das Zuhören eingeschaltet hast. Du kannst ellma stattdessen auch schreiben.",
          ],
        },
        {
          title: "Cookies und Speicher in deinem Browser",
          body: [
            "ellma setzt keine Cookies und nutzt kein Tracking. Sie verwendet den lokalen Speicher deines Browsers: Anmeldung, Sprache, Design, deine Klang- und Erinnerungseinstellungen und einige Einstellungen der Begleitleiste sind nötig, damit die App funktioniert.",
            "Für einen sofortigen Start kann ellma zusätzlich eine Kopie deiner Ziele und eines pausierten Fokus auf diesem Gerät behalten und sich deine Filter auf Ziele und Heute sowie die Karten- oder Listenansicht und zusammengelegte Karten auf Heute merken. Das kannst du jederzeit unter „Cookie-Einstellungen“ abschalten.",
          ],
        },
        {
          title: "Wie lange Daten bleiben",
          body: [
            "Deine Daten bleiben gespeichert, solange dein Konto besteht. Ziele, Schritte, Sitzungen und das Gespräch kannst du in der App selbst löschen. Um dein Konto mit allen Daten zu löschen, schreibe an den Kontakt im Impressum.",
            "ellma ist im Alpha-Stadium. Daten können verloren gehen oder zurückgesetzt werden, wenn sich das Datenmodell ändert; bewahre hier bitte nichts Wichtiges als einzige Kopie auf.",
          ],
        },
        {
          title: "E-Mail",
          body: [
            "ellma schreibt dir nur dann eine E-Mail, wenn für deine Adresse das Zurücksetzen des Passworts angefordert wird. Die Nachricht wird über den Mailserver des Betreibers versendet und enthält nichts außer dem Link.",
          ],
        },
        {
          title: "Verwaltung",
          body: [
            "Die Administratoren des Betreibers sehen deinen Namen, deine E-Mail-Adresse, deine Rolle, ob die Zwei-Faktor-Anmeldung an ist, seit wann du dabei bist und wann du zuletzt aktiv warst, sowie Summen wie die Zahl deiner Ziele und investierten Stunden. Die Verwaltung zeigt nicht, was in deinen Zielen, Schritten oder Gesprächen steht.",
            "Auf deinen Wunsch können Administratoren deine Zwei-Faktor-Anmeldung ausschalten, dir eine E-Mail zum Zurücksetzen des Passworts senden und dein Konto mit allen Daten löschen.",
          ],
        },
        {
          title: "Deine Rechte",
          body: [
            "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Übertragbarkeit deiner Daten sowie auf Widerspruch gegen die Verarbeitung. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren.",
          ],
        },
      ],
    },
    terms: {
      title: "Allgemeine Geschäftsbedingungen",
      lead: "Die Kurzfassung: ellma ist eine kostenlose Alpha-Version. Nutze sie fair und verlasse dich bei Kritischem nicht auf sie.",
      sections: [
        {
          title: "Der Dienst",
          body: [
            "ellma hilft dir, Ziele festzuhalten, kleine Schritte zu planen, investierte Zeit zu erfassen und mit einer KI-Begleiterin darüber zu sprechen. Der im Impressum genannte Betreiber stellt sie kostenlos bereit.",
          ],
        },
        {
          title: "Alpha-Stadium",
          body: [
            "ellma ist eine frühe Testversion. Funktionen können sich ändern oder entfallen, der Dienst kann nicht erreichbar sein, und gespeicherte Daten können ohne Migration zurückgesetzt werden. Ein Anspruch auf Verfügbarkeit oder bestimmte Funktionen besteht nicht.",
          ],
        },
        {
          title: "Dein Konto",
          body: [
            "Du brauchst ein Konto mit einer gültigen E-Mail-Adresse und einem Passwort, das du für dich behältst. Unter „Konto“ kannst du die Zwei-Faktor-Anmeldung hinzufügen. Das Konto ist persönlich. Gib uns Bescheid, wenn du glaubst, dass jemand anderes es nutzt.",
          ],
        },
        {
          title: "Faire Nutzung",
          body: [
            "Nutze ellma für deine eigenen Ziele. Versuche nicht, auf Daten anderer zuzugreifen, den Dienst zu überlasten oder anzugreifen oder mit der KI-Begleiterin rechtswidrige Inhalte zu erzeugen. Konten, die das tun, können wir sperren.",
          ],
        },
        {
          title: "Was ellma sagt",
          body: [
            "ellmas Antworten erzeugt ein KI-Modell; sie können falsch oder unvollständig sein. Sie sind Ermutigung und Vorschläge, keine medizinische, psychologische, rechtliche oder finanzielle Beratung. Entscheidungen triffst du.",
          ],
        },
        {
          title: "Deine Inhalte",
          body: [
            "Deine Ziele und Notizen bleiben deine. Wir verarbeiten sie nur, um ellma für dich zu betreiben, wie unter „Datenschutz“ beschrieben.",
          ],
        },
        {
          title: "Haftung",
          body: [
            "Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Im Übrigen ist die Haftung, weil der Dienst kostenlos und im Testbetrieb ist, im gesetzlich zulässigen Umfang beschränkt.",
          ],
        },
        {
          title: "Beendigung und Änderungen",
          body: [
            "Du kannst die Nutzung jederzeit beenden und die Löschung deines Kontos verlangen. Wir können den Test beenden oder diese Bedingungen ändern; die aktuelle Fassung steht immer auf dieser Seite.",
          ],
        },
      ],
    },
    storage: {
      title: "Cookie-Einstellungen",
      lead: "ellma setzt keine Cookies und nutzt kein Tracking. Sie verwendet nur Speicher in deinem Browser, und du bestimmst, wie viel.",
      necessaryTitle: "Notwendig",
      necessaryText:
        "Deine Anmeldung, Sprache, Design, deine Klang- und Erinnerungseinstellungen und die Einstellungen von ellmas Begleitleiste. Ohne sie funktioniert die App nicht.",
      alwaysOn: "Immer an",
      comfortTitle: "Sofortstart",
      comfortText:
        "Behält eine Kopie deiner Ziele und Schritte auf diesem Gerät, damit ellma ohne Warten öffnet (auch einen pausierten Fokus), und merkt sich deine Filter auf Ziele und Heute sowie die Karten- oder Listenansicht und zusammengelegte Karten auf Heute. Auf gemeinsam genutzten Geräten besser ausschalten.",
      trackingTitle: "Statistik und Marketing",
      trackingText: "Gibt es nicht. Hier ist nichts abzuschalten.",
      never: "Nicht verwendet",
      on: "An",
      off: "Aus",
      save: "Speichern",
      saved: "Einstellungen gespeichert.",
    },
  },

  shortcuts: {
    title: "Tastenkürzel",
    hint: "Drücke jederzeit ?, um diese Liste zu sehen.",
    groups: [
      {
        title: "ellma",
        list: [
          { combo: "Leertaste", label: "Halten, um mit ellma zu sprechen (überall)" },
          { combo: "⌘/Strg J", label: "Zuhören starten / beenden" },
          { combo: "/", label: "ellma schreiben" },
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
          { combo: "G", label: "Neues Ziel, begleitet von ellma" },
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
          { combo: "P", label: "Sitzung pausieren / fortsetzen" },
          { combo: "S", label: "Stoppen und Sitzung speichern" },
          { combo: "M", label: "Fokusklang an / aus" },
        ],
      },
    ],
  },

  weekdaysShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  dateLocale: "de-DE",
  speechLocale: "de-DE",
};
