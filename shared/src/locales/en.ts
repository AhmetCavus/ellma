export const en = {
  appName: "Ellma",
  tagline: "Your guide to your goals",
  languageName: "English",

  landing: {
    eyebrow: "A personal guide for your goals",
    titleStart: "Your goals deserve a",
    titleEmphasis: "guide.",
    lead: "Ellma keeps your goals in view, listens when you talk, and always knows your next small step. Every hour you invest fills an apple, until it's ripe.",
    primary: "Meet Ellma",
    secondary: "Log in",
    demo: {
      caption: "This is Ellma at work. Pick a sentence to try it.",
      goal: "Run a half marathon",
      nextStep: "Next step",
      you: "You",
      scenes: [
        {
          say: "I'm stuck. Where do I even start?",
          action: "Step planned · Lay out my running shoes",
          reply: "Let's make it tiny: lay out your running shoes tonight. It's on today's list.",
          step: "Lay out my running shoes",
        },
        {
          say: "I ran 40 minutes this morning.",
          action: "Time logged · 40 min",
          reply: "Logged. That's 3.5 of your 5 hours this week. Next up: an easy 5k on Friday.",
          step: "Easy 5k on Friday",
        },
        {
          say: "Long run done. Ninety minutes!",
          action: "Time logged · 1 h 30",
          reply: "Weekly target reached. This apple is ripe. I'm proud of you!",
          step: "Rest. You earned it.",
        },
      ],
    },
    stepsTitle: "Three things. That's all.",
    steps: [
      {
        title: "Plant a goal",
        body: "Ellma asks five short questions: what, why, how many hours, by when, and your first step.",
      },
      {
        title: "Just talk",
        body: "Hold Space and tell her what you did or where you're stuck. She plans, logs and reminds you why.",
      },
      {
        title: "Watch it ripen",
        body: "Each goal is an apple that fills with the hours you invest. Reach your week and it turns ripe.",
      },
    ],
    facts: [
      "Runs on an open-weight model",
      "On our own server, not a third party's",
      "Voice and keyboard first",
      "English and German",
    ],
    closingTitle: "What do you want to achieve this year?",
    closingBody: "Write it down. Ellma takes it from there.",
    closingPlaceholder: "e.g. Run a half marathon",
    closingAction: "Plant it with Ellma",
    footer: "Ellma · the red apple on the horizon is the goal you keep walking towards.",
  },

  auth: {
    loginTitle: "Welcome back",
    signupTitle: "Meet Ellma",
    signupLead: "Create your account. Ellma will help you set your first goal.",
    username: "Your first name",
    email: "Email",
    password: "Password",
    passwordHint: "8–72 characters, including at least two symbols such as ! or #.",
    login: "Log in",
    signup: "Create account",
    toSignup: "New here? Create an account",
    toLogin: "Already have an account? Log in",
    loginFailed: "Email or password is incorrect.",
    signupFailed: "The account could not be created.",
    emailTaken: "An account with this email already exists.",
    passwordLength: "The password must have 8–72 characters.",
    passwordSpecial: "The password needs at least two symbols.",
    logout: "Log out",
  },

  nav: {
    goals: "Goals",
    today: "Today",
    progress: "Progress",
    label: "Main navigation",
    yourGoals: "Your goals",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading…",
    working: "Working…",
    retry: "Retry",
    error: "Something went wrong. Please try again.",
    offline: "Cannot reach the server. Showing your last data.",
    sessionExpired: "Your session has expired. Please log in again.",
    noGoal: "No goal",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    settings: "Settings",
    shortcuts: "Keyboard shortcuts",
  },

  dock: {
    label: "Ellma, your guide",
    talk: "Talk to Ellma",
    stopListening: "Stop listening",
    write: "Write to Ellma",
    writePlaceholder: "Tell Ellma what you did or what you need…",
    send: "Send",
    stop: "Stop",
    listening: "I'm listening…",
    listeningHint: "Release Space or pause, and I'll take it from there.",
    thinking: "Let me think…",
    thinkingSlow: "Still on it. I run on our own server, so I take a moment.",
    history: "Our conversation",
    historyEmpty: "Nothing said yet. Hold Space and tell me about your day.",
    clear: "Forget this conversation",
    clearConfirm: "Forget this conversation? Your goals stay; only what we said is cleared.",
    speakOn: "Read answers aloud",
    speakOff: "Stop reading aloud",
    handsFree: "Conversation mode",
    handsFreeHint: "I listen again after each answer.",
    hintTalk: "hold to talk",
    hintWrite: "write",
    hintShortcuts: "all shortcuts",
    spaceKey: "Space",
    minimize: "Tuck Ellma away",
    expand: "Show Ellma's guidance",
    dismiss: "Close answer",
    yes: "Yes",
    no: "No",
    answer: "Answer by voice",
    you: "You",
    voiceUnsupported:
      "Voice input isn't available in this browser. Try Chrome, Edge or Safari, or press / to write.",
    micDenied: "Microphone access was blocked. Allow it in your browser settings to talk to me.",
    busy: "I'm still answering in another window.",
    unavailable: "My model is not reachable right now. Please try again in a moment.",
    modelNote: "Ellma runs on an open-weight model on its own server and can make mistakes.",
    stepPlaceholder: (goal: string) => `Smallest next step for “${goal}”…`,
    stepAdd: "Add for today",
    brief: "Brief me",
    briefLoading: "Preparing your brief…",
    suggestions: {
      goals: ["Which goal needs me most?", "How is my week going?"],
      goal: ["What should my next step be here?", "Suggest three milestones"],
      today: ["Plan my day", "I'm stuck. Help me start."],
      progress: ["What went well this week?", "What should I change?"],
      focus: ["I'm stuck on this", "Break this step down"],
    },
    actions: {
      goal_created: "Goal created",
      task_added: "Step planned",
      task_completed: "Step done",
      time_logged: "Time logged",
      focus_started: "Focus started",
      milestone_added: "Milestone added",
      milestone_done: "Milestone reached",
    },
    intents: {
      goals: "Here are your goals.",
      today: "Here is your day.",
      progress: "Here is your week.",
      focus: "Focus mode. Pick a step and go.",
      newGoal: "Let's set a new goal together.",
      stopped: (duration: string) => `Stopped. ${duration} logged.`,
      completed: "Done and logged. Well earned.",
      theme: "Switched.",
      help: "Here is everything you can do with the keyboard.",
    },
    cheers: [
      "Done. One step closer.",
      "Nice. That's how goals get reached.",
      "Checked off. Keep that pace.",
      "Yes! That one counts.",
    ],
    cheerCount: (count: number) => (count > 1 ? `That's ${count} today.` : ""),
    ripe: (goal: string) => `Weekly target reached for “${goal}”. This apple is ripe.`,
    askAbout: (title: string) => `Help me with my goal "${title}". What should my next step be?`,
  },

  intro: {
    steps: [
      {
        title: "Hi, I'm Ellma.",
        text: "I'm your guide to your goals. I live down here on every page and always show you the next best step.",
      },
      {
        title: "Just talk to me.",
        text: "Hold Space and speak, or press / to write. Tell me what you did, what you plan, or where you're stuck.",
      },
      {
        title: "Your goals are apples.",
        text: "Each apple fills up as you invest time during the week. Fill it and it turns ripe. Let's plant your first one.",
      },
    ],
    next: "Next",
    start: "Let's begin",
    skip: "Skip intro",
  },

  guide: {
    focus_running: {
      text: (what: string) => `You're focusing on “${what}”. I'm right here if you need me.`,
      action: "Open focus",
      alt: "Stop and save",
    },
    first_goal: {
      text: (name: string) =>
        `${name ? `Welcome, ${name}. ` : ""}Everything here starts with a goal. What do you want to achieve?`,
      action: "Set my first goal",
      alt: "",
    },
    carry_over: {
      text: (count: number) =>
        count === 1
          ? "One step is left over from an earlier day. Shall I move it to today?"
          : `${count} steps are left over from earlier days. Shall I move them to today?`,
      action: "Move to today",
      alt: "Plan with Ellma",
    },
    start_task: {
      text: (task: string, goal: string) =>
        goal
          ? `Your next step for “${goal}”: ${task}. Ready?`
          : `Next on your list: ${task}. Ready?`,
      action: "Start focus",
      alt: "Already done",
    },
    next_step: {
      text: (goal: string) =>
        `“${goal}” has no next step yet. What is the smallest thing you could do for it?`,
      action: "Add a step",
      alt: "Suggest steps",
    },
    plan_today: {
      text: (task: string, goal: string) =>
        goal
          ? `Nothing is planned for today. How about “${task}” for “${goal}”?`
          : `Nothing is planned for today. How about “${task}”?`,
      action: "Do it today",
      alt: "Plan with Ellma",
    },
    weekly_gap: {
      text: (goal: string, left: string) =>
        `${left} to go for “${goal}” this week. A short session now?`,
      action: "Start a session",
      alt: "",
    },
    day_done: {
      text: (count: number) =>
        count > 1
          ? `${count} steps done today. That's how goals get reached. Enjoy the rest of your day.`
          : count === 1
            ? "One step done today. Small steps add up. Enjoy the rest of your day."
            : "Nothing is waiting right now. Tell me what's on your mind.",
      action: "One more step",
      alt: "Plan tomorrow",
    },
    planDayPrompt: "Help me plan my day.",
    planTomorrowPrompt: "Help me plan tomorrow.",
  },

  wizard: {
    title: "New goal with Ellma",
    progress: (step: number, total: number) => `Question ${step} of ${total}`,
    what: {
      ask: "What do you want to achieve?",
      help: "One sentence is enough. Say it the way you'd tell a friend.",
      placeholder: "e.g. Run a half marathon",
      examples: ["Run a half marathon", "Learn Spanish", "Launch my online shop", "Read 20 books"],
    },
    why: {
      ask: (goal: string) => `Why does “${goal}” matter to you?`,
      help: "I'll remind you of this when it gets hard.",
      placeholder: "What will be different when you get there?",
    },
    hours: {
      ask: "How many hours a week can you give it?",
      help: "Your goal's apple fills up as you invest time. Reach this number in a week and it turns ripe.",
      unit: "hours per week",
      none: "No weekly target",
    },
    deadline: {
      ask: "Is there a date you want to be there by?",
      help: "A date makes it real. You can change it anytime.",
      none: "No date",
      month1: "In 1 month",
      month3: "In 3 months",
      month6: "In 6 months",
      year1: "In 1 year",
      pick: "Or pick a date",
    },
    step: {
      ask: "What is the very first small step?",
      help: "Something you could start within ten minutes. I'll put it on today.",
      placeholder: "e.g. Find a 12-week training plan",
    },
    back: "Back",
    next: "Continue",
    skip: "Skip",
    create: "Plant this goal",
    creating: "Planting…",
    dictate: "Dictate your answer",
    dictating: "Listening… speak now",
    enterHint: "Enter ↵",
    doneTitle: (goal: string) => `“${goal}” is planted.`,
    doneText: "I'll keep it in view and always show you the next step.",
    doneStep: (step: string) => `Your first step is on today: ${step}`,
    startNow: "Start the first step now",
    openGoal: "Open the goal",
  },

  today: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    lead: "Your day, sorted by goal. One small step per goal is plenty.",
    noStepToday: "No step for today yet.",
    pull: "Do today",
    waiting: "Waiting for a day",
    otherTitle: "Without a goal",
    otherHint: "Steps here don't fill any apple. Link them to a goal when you can.",
    carried: "carried over",
    addStep: "Add a step for today…",
    plannedTitle: "Today",
    empty: "Nothing planned yet. Which small step would move a goal forward today?",
    overdue: "Carried over",
    moveAllToToday: "Move all to today",
    done: "Done today",
    goalsTitle: "Your goals",
    goalsEmpty: "No active goals yet. Tell Ellma about one, or create it yourself.",
    hoursThisWeek: "this week",
    focusedToday: "Focused today",
    tasksDone: "Tasks done",
    later: "Later",
    laterEmpty: "Tasks without a day land here.",
  },

  tasks: {
    addPlaceholder: "Add a task…",
    add: "Add",
    newTask: "New task",
    editTask: "Edit task",
    title: "Title",
    notes: "Notes",
    goal: "Goal",
    plannedOn: "Day",
    unplanned: "No day",
    estimate: "Estimate (minutes)",
    markDone: "Mark as done",
    markOpen: "Mark as open",
    startFocus: "Start focus",
    moveToday: "Today",
    moveTomorrow: "Tomorrow",
    moveLater: "Later",
    deleteConfirm: "Delete this task? Logged focus time is kept.",
    more: "More actions",
  },

  goals: {
    lead: "Each apple is one goal. It fills up as you invest time this week.",
    weekOf: (done: string, target: string) => `${done} of ${target} h this week`,
    weekFree: (done: string) => `${done} h this week`,
    nextStep: "Next step",
    noStep: "No next step yet",
    addStep: "Add a step",
    start: "Start",
    states: {
      ripe: "Ripe this week",
      on_track: "On track",
      behind: "Needs attention",
      resting: "Resting",
    },
    journey: "Journey",
    journeyStart: "Start",
    journeyEnd: "Goal reached",
    emptyTitle: "No goals yet.",
    milestoneCount: (done: number, total: number) => `${done} of ${total} milestones`,
    reached: "Mark as reached",
    reachedCheer: (goal: string) => `You reached “${goal}”. I'm proud of you.`,
    title: "Goals",
    newGoal: "New goal",
    editGoal: "Edit goal",
    name: "Goal",
    namePlaceholder: "e.g. Run a half marathon",
    why: "Why it matters",
    whyPlaceholder: "What will be different when you get there?",
    color: "Color",
    weeklyTarget: "Hours per week",
    targetDate: "Target date",
    status: "Status",
    statuses: { active: "Active", completed: "Reached", archived: "Archived" },
    milestones: "Milestones",
    addMilestone: "Add milestone",
    milestonePlaceholder: "e.g. First 10 km without a break",
    milestonesEmpty: "Milestones mark the moments worth celebrating.",
    openTasks: "Next steps",
    noTasks: "No open steps. Ask Ellma what could come next.",
    totalHours: "Hours invested",
    thisWeek: "This week",
    target: "Target",
    daysLeft: (days: number) =>
      days > 1
        ? `${days} days left`
        : days === 1
          ? "1 day left"
          : days === 0
            ? "Due today"
            : "Overdue",
    deleteConfirm:
      "Delete this goal? Its tasks and logged time stay, but are no longer linked to a goal.",
    empty: "A goal is something worth your best hours. Start with one.",
    showInactive: "Show reached and archived",
    back: "All goals",
    colors: {
      apple: "Apple red",
      amber: "Amber",
      leaf: "Leaf",
      teal: "Teal",
      sky: "Sky",
      indigo: "Indigo",
      plum: "Plum",
      slate: "Slate",
    },
  },

  focus: {
    title: "Focus",
    start: "Start focus",
    stop: "Stop",
    complete: "Complete",
    completeHint: "⌘/Ctrl + Enter",
    pickTask: "What will you focus on?",
    freeFocus: "Free focus",
    running: "Focusing",
    exit: "Leave focus mode",
    sessionSaved: (duration: string) => `${duration} logged.`,
    taskCompleted: "Task done. Well earned.",
    open: "Open focus mode",
    logTime: "Log time",
    logTitle: "Log time",
    minutes: "Minutes",
    endedAt: "Finished at",
    logged: "Time logged.",
  },

  progress: {
    lead: "Where your hours went this week, goal by goal.",
    title: "Progress",
    total: "Focused this week",
    perGoal: "Hours per goal",
    perDay: "Hours per day",
    completedTasks: "Tasks completed",
    bestDay: "Best day",
    ofTarget: (percent: number) => `${percent}% of target`,
    noTarget: "No weekly target",
    empty: "No focus time this week yet. Start a focus session or tell Ellma what you worked on.",
    sessions: "Sessions",
    deleteSession: "Delete session",
    deleteSessionConfirm: "Delete this focus session?",
    previous: "Previous week",
    next: "Next week",
    thisWeek: "This week",
    weekNumber: (week: number) => `Week ${week}`,
    reflect: "Reflect with Ellma",
    reflectPrompt: "Let's look back at my week. What went well and what should I change?",
  },

  shortcuts: {
    title: "Keyboard shortcuts",
    hint: "Press ? anytime to see this list.",
    groups: [
      {
        title: "Ellma",
        list: [
          { combo: "Space", label: "Hold to talk to Ellma (anywhere)" },
          { combo: "⌘/Ctrl J", label: "Start / stop listening" },
          { combo: "/", label: "Write to Ellma" },
          { combo: "V", label: "Read answers aloud on / off" },
          { combo: "Esc", label: "Stop the answer and speech" },
        ],
      },
      {
        title: "Navigate",
        list: [
          { combo: "1 – 3", label: "Goals, Today, Progress" },
          { combo: "?", label: "Keyboard shortcuts" },
          { combo: "D", label: "Light / dark" },
        ],
      },
      {
        title: "Create",
        list: [
          { combo: "N", label: "New task" },
          { combo: "G", label: "New goal, guided by Ellma" },
          { combo: "L", label: "Log time" },
        ],
      },
      {
        title: "Tasks",
        list: [
          { combo: "J / K", label: "Next / previous task" },
          { combo: "X", label: "Mark selected task done" },
          { combo: "E", label: "Edit selected task" },
          { combo: "P", label: "Start focus on selected task" },
        ],
      },
      {
        title: "Focus",
        list: [
          { combo: "F", label: "Focus mode" },
          { combo: "⌘/Ctrl ↵", label: "Complete the task in focus" },
          { combo: "S", label: "Stop and save the session" },
        ],
      },
    ],
  },

  weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  dateLocale: "en-GB",
  speechLocale: "en-US",
};

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? Widen<U>[]
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

export type Copy = Widen<typeof en>;
