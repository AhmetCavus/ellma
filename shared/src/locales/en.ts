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
    github: "GitHub",
    githubHint: "Source code on GitHub (opens in a new tab)",
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
    forgot: "Forgot your password?",
    backToLogin: "Back to log in",
    codeTitle: "One more step",
    codeLead:
      "Enter the 6-digit code from your authenticator app. Lost your phone? Use one of your backup codes.",
    code: "Code",
    codeFailed: "That code is not correct. Wait for the next one and try again.",
    tooMany: "Too many attempts. Please wait a few minutes and try again.",
    forgotTitle: "Reset your password",
    forgotLead:
      "Enter your email. If an account exists for it, Ellma sends you a link to choose a new password.",
    forgotSend: "Send reset link",
    forgotSent:
      "If an account exists for this address, a link is on its way. It works once and for 30 minutes.",
    forgotUnavailable:
      "This installation cannot send email yet. Please ask the contact in the imprint to reset your password.",
    resetTitle: "Choose a new password",
    resetLead: "Saving signs you out everywhere. Then log in with the new password.",
    newPassword: "New password",
    repeatPassword: "Repeat new password",
    passwordMismatch: "The two passwords do not match.",
    resetSave: "Save new password",
    resetDone: "Your password is changed. Log in with the new one.",
    resetInvalid: "This link is no longer valid. Request a new one.",
  },

  nav: {
    goals: "Goals",
    today: "Today",
    progress: "Progress",
    label: "Main navigation",
    yourGoals: "Your goals",
    account: "Account",
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
    lead: "Your steps by day, today first. One small step per goal is plenty.",
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
      behind: "Behind this week",
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
    attention: { step_overdue: "Step overdue", no_next_step: "No next step" },
    deadline: (date: string) => `Target ${date}`,
    tags: "Tags",
    tagPlaceholder: "New or existing tag, e.g. Health",
    addTag: "Add tag",
    removeTag: (tag: string) => `Remove tag ${tag}`,
    tagLimit: "Up to 10 tags per goal.",
    groupedHint: "Grouped by the day of each goal's next planned step.",
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

  views: {
    label: "Filter and sort",
    groups: {
      overdue: "Overdue",
      today: "Today",
      tomorrow: "Tomorrow",
      later: "Later",
      none: "No date",
    },
    tags: "Tags",
    status: "Status",
    sort: "Sort",
    noTags: "Add tags to a goal when you edit it, then filter by them here.",
    active: (list: string) => `Filtered by ${list}`,
    reset: "Reset filters",
    nothing: "Nothing matches these filters.",
    goalSorts: { position: "Your order", deadline: "Target date", title: "Title" },
    stepSorts: { position: "Your order", goal: "Goal", title: "Step title" },
    stepStatuses: { open: "Open", done: "Done" },
    moveOverdue: "Move all to today",
    layout: "Layout",
    cards: "Card view",
    list: "List view",
    overdueNote: (count: number) =>
      count === 1 ? "1 step is overdue." : `${count} steps are overdue.`,
  },

  focus: {
    title: "Focus",
    start: "Start focus",
    stop: "End focus",
    complete: "Complete task",
    completeHint: "⌘/Ctrl + Enter",
    stopHelp: "Saves the time. The task stays open.",
    pause: "Pause",
    resume: "Resume",
    paused: "Paused",
    pauseHelp: "Saves the time so far. Resume when you are ready.",
    pausedNote: "The time so far is saved. Resume when you are ready.",
    pauseFailed: "The pause could not be saved. Your timer keeps running, please try again.",
    resumeFailed: "The focus could not be resumed. Please try again.",
    completeHelp: "Saves the time and checks the task off.",
    saving: "Saving…",
    saveFailed: "The session could not be saved. Your timer keeps running, please try again.",
    saved: (duration: string) => `${duration} saved`,
    savedWeek: (done: string, target: string) => `${done} of ${target} hours this week`,
    savedWeekFree: (done: string) => `${done} hours this week`,
    savedTask: "Task completed.",
    savedDuration: (seconds: number) => {
      const total = Math.max(0, Math.round(seconds / 60));
      const hours = Math.floor(total / 60);
      const rest = total % 60;
      if (hours === 0) {
        return total === 1 ? "1 minute" : `${total} minutes`;
      }
      return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
    },
    backToToday: "Back to Today",
    again: "Start another focus",
    pickTask: "What will you focus on?",
    freeFocus: "Free focus",
    running: "Focusing",
    exit: "Leave focus mode",
    sessionSaved: (duration: string) => `${duration} logged.`,
    taskCompleted: "Task done. Well earned.",
    open: "Open focus mode",
    scenes: {
      pendulum: "Pendulum",
      bright: "Pendulum · bright",
      melodic: "Pendulum · melodic",
      vintage: "Pendulum · vintage",
      warm: "Pendulum · warm",
      night: "Pendulum · night",
    },
    muteSound: "Mute the focus sound",
    unmuteSound: "Play the focus sound",
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

  reminder: {
    tabTitle: (task: string) =>
      task ? `🍎 Ellma: “${task}” is waiting` : "🍎 Ellma: your next step is waiting",
  },

  account: {
    title: "Your account",
    lead: "Keep your sign-in safe. Your goals depend on it.",
    behaviour: {
      title: "Sounds and reminders",
      lead: "How Ellma behaves on this device. Everything here can be switched off.",
      sounds: {
        title: "Sounds",
        text: "Short, quiet sounds when you start or stop focus, finish a step or reach a milestone.",
      },
      ambience: {
        title: "Focus sound",
        text: "Calm pendulum pieces with quiet pauses, brighter in the morning and softer at night. You can also mute it in focus mode.",
      },
      notificationSounds: {
        title: "Notification sounds",
        text: "One soft sound when Ellma has done something for you or has news, and the reminder sound. Your focus sound is not affected.",
      },
      reminders: {
        title: "Reminders",
        text: "When a step is waiting and you have been away from this tab for 20 minutes, Ellma plays a soft sound and shows the step in the tab title. At most three times, with an hour in between.",
      },
    },
    profileTitle: "Profile",
    name: "Name",
    role: "Role",
    roles: { user: "User", admin: "Admin", root: "Root" },
    passwordTitle: "Password",
    passwordLead: "Changing it signs you out on your other devices.",
    currentPassword: "Current password",
    changePassword: "Change password",
    passwordChanged: "Password changed. Other devices are signed out.",
    wrongPassword: "The current password is not correct.",
    twoFactorTitle: "Two-factor sign-in",
    twoFactorLead:
      "Add a second step when you log in: a code from an authenticator app on your phone. Even with your password, nobody else gets in.",
    statusOn: "On",
    statusOff: "Off",
    enable: "Set up two-factor sign-in",
    confirmPassword: "First, confirm with your password",
    next: "Continue",
    scanTitle: "Scan this code",
    scanLead:
      "Open an authenticator app (for example Aegis, Google Authenticator or 1Password) and scan the QR code. No camera? Enter the key by hand.",
    qrLabel: "QR code for your authenticator app",
    manualKey: "Key",
    enterCode: "Then enter the 6-digit code the app shows",
    activate: "Switch on",
    enabled: "Two-factor sign-in is on.",
    backupTitle: "Save your backup codes",
    backupLead:
      "Each code works once when you can't reach your authenticator. They are shown only now, so keep them somewhere safe.",
    backupCopy: "Copy codes",
    backupCopied: "Copied.",
    backupDone: "I have saved them",
    backupLeft: (count: number) =>
      count === 1 ? "1 backup code left" : `${count} backup codes left`,
    disable: "Switch off",
    disableLead: "Enter your password and a current code to switch two-factor sign-in off.",
    disabled: "Two-factor sign-in is off.",
  },
  mail: {
    recovery: {
      subject: "Reset your Ellma password",
      body: (name: string, link: string, minutes: number) => [
        `Hi ${name},`,
        "you asked to reset your Ellma password. Open this link to choose a new one:",
        link,
        `The link works once and for ${minutes} minutes. If you use two-factor sign-in, it stays on.`,
        "If this wasn't you, ignore this email. Your password stays as it is.",
      ],
    },
  },
  admin: {
    title: "Ellma Admin",
    subtitle: "Administration",
    loginTitle: "Admin sign-in",
    noPermission: "This account has no admin rights.",
    refresh: "Refresh",
    tabs: { overview: "Overview", users: "Accounts" },
    privacyNote:
      "This panel shows accounts and totals only. Goals, steps and conversations stay private.",
    overview: {
      users: "Accounts",
      admins: "Admins",
      twoFactorUsers: "With two-factor sign-in",
      newUsersThisWeek: "New this week",
      activeUsersThisWeek: "Active this week",
      goals: "Goals",
      tasks: "Steps",
      tasksDone: "Steps done",
      focusHours: "Hours invested",
      focusHoursThisWeek: "Hours this week",
      assistantMessages: "Messages to Ellma",
      peopleTitle: "People",
      usageTitle: "Usage",
    },
    system: {
      title: "System",
      version: "Version",
      model: "AI model",
      modelUp: "reachable",
      modelDown: "not reachable",
      mail: "Email",
      mailOn: "configured",
      mailOff: "not configured, so password reset by email is off",
    },
    users: {
      search: "Search name or email",
      count: (shown: number, total: number) => {
        const accounts = total === 1 ? "1 account" : `${total} accounts`;
        return shown === total ? accounts : `${shown} of ${accounts}`;
      },
      empty: "No accounts match.",
      name: "Name",
      email: "Email",
      role: "Role",
      twoFactor: "2FA",
      joined: "Joined",
      lastActive: "Last active",
      goals: "Goals",
      tasks: "Steps",
      hours: "Hours",
      never: "never",
      you: "you",
      actions: "Actions",
      makeAdmin: "Make admin",
      makeUser: "Remove admin rights",
      resetTwoFactor: "Reset two-factor sign-in",
      sendRecovery: "Send password reset email",
      delete: "Delete account",
      confirmMakeAdmin: (name: string) =>
        `Give ${name} admin rights? Admins can manage every account.`,
      confirmMakeUser: (name: string) => `Remove admin rights from ${name}?`,
      confirmResetTwoFactor: (name: string) =>
        `Switch two-factor sign-in off for ${name}? Only do this when you are sure who is asking.`,
      confirmSendRecovery: (email: string) => `Send a password reset link to ${email}?`,
      deleteTitle: "Delete account",
      deleteLead:
        "This removes the account with all its goals, steps, focus time and conversations. It cannot be undone.",
      deleteConfirm: (email: string) => `Type ${email} to confirm`,
      roleChanged: "Role changed. The account has to log in again.",
      twoFactorReset: "Two-factor sign-in is switched off for this account.",
      recoverySent: "Password reset email sent.",
      deleted: "Account deleted.",
      mailUnavailable: "Email is not configured, or this account has no email address.",
      mailFailed: "The mail server did not accept the message.",
      notAllowed: "You are not allowed to change this account.",
    },
  },
  legal: {
    footer: {
      label: "Legal",
      privacy: "Data privacy",
      terms: "Terms and conditions",
      cookies: "Cookie settings",
      imprint: "Imprint",
      poweredBy: "Powered by",
    },
    back: "Back to Ellma",
    updated: "Last updated: 18 November 2026",
    imprint: {
      title: "Imprint",
      lead: "Who runs Ellma and how to reach us.",
      operator: "Operator",
      representative: "Represented by",
      contact: "Contact",
      email: "Email",
      phone: "Phone",
      register: "Register entry",
      vat: "VAT ID",
      missing:
        "The operator details for this installation have not been entered yet. Ellma is in a closed alpha test and is not offered to the public.",
      aboutTitle: "About this service",
      about:
        "Ellma is a personal guide for your goals and a test project of yappai. It is in alpha: free of charge, without guaranteed availability.",
    },
    privacy: {
      title: "Data privacy",
      lead: "Ellma is built to keep your goals with you. This page says plainly what is stored, where, and why.",
      sections: [
        {
          title: "Who is responsible",
          body: [
            "The operator named in the imprint is responsible for processing your data. Use the contact details there for every privacy question or request.",
          ],
        },
        {
          title: "What Ellma stores",
          body: [
            "Your account: first name, email address and a hashed password.",
            "If you switch on two-factor sign-in: the key of your authenticator app in encrypted form, and your backup codes as fingerprints only. If you ask for a password reset: a fingerprint of the reset link until it is used or expires after 30 minutes.",
            "Your content: goals with their reasons, milestones, weekly targets and your own tags, steps, focus sessions and logged time, daily notes, and the conversation with Ellma.",
            "We use this data only to provide Ellma to you (Art. 6(1)(b) GDPR). There is no advertising, no analytics and no profiling.",
          ],
        },
        {
          title: "Where it is stored",
          body: [
            "Everything is stored on yappai's own server. Requests reach it through Cloudflare, which transports the encrypted connection and processes technical connection data such as your IP address on our behalf.",
            "Server logs with technical connection data are kept briefly to keep the service secure and working (Art. 6(1)(f) GDPR).",
          ],
        },
        {
          title: "The AI model",
          body: [
            "Ellma's answers come from an open-weight language model that runs on the same server. What you say or write to Ellma, and the goals she needs to answer, are not sent to an external AI provider and are not used to train models.",
          ],
        },
        {
          title: "Voice",
          body: [
            "Listening uses your browser's speech recognition. Depending on the browser, the audio is converted to text by the browser maker's servers (in Chrome, for example, by Google). Ellma itself only receives the text and stores no audio.",
            "The microphone is only active while you hold the talk key or have switched listening on. If you prefer, write to Ellma instead.",
          ],
        },
        {
          title: "Cookies and storage in your browser",
          body: [
            "Ellma sets no cookies and uses no tracking. It uses your browser's local storage: your sign-in, language, theme, your sound and reminder settings and a few settings of the guide bar are necessary for the app to work.",
            "For an instant start, Ellma can also keep a copy of your goals and a paused focus on this device and remember your filters on Goals and Today and the card or list view on Today. You can switch that off at any time under “Cookie settings”.",
          ],
        },
        {
          title: "How long data is kept",
          body: [
            "Your data is kept as long as your account exists. You can delete goals, steps, sessions and the conversation yourself in the app. To delete your account with all data, write to the contact in the imprint.",
            "Ellma is in alpha. Data can be lost or reset when the data model changes; please do not keep the only copy of something important here.",
          ],
        },
        {
          title: "Email",
          body: [
            "Ellma emails you only when a password reset is requested for your address. The message is sent through the mail server the operator uses and contains nothing but the reset link.",
          ],
        },
        {
          title: "Administration",
          body: [
            "The operator's administrators see your name, email address, role, whether two-factor sign-in is on, when you joined and were last active, and totals such as the number of goals and invested hours. The admin panel does not show what your goals, steps or conversations say.",
            "On your request, administrators can switch off your two-factor sign-in, send you a password reset email, and delete your account with all its data.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "You have the right to access, correct, delete, restrict and receive your data, and to object to processing. You can also complain to a data protection supervisory authority.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms and conditions",
      lead: "The short version: Ellma is a free alpha. Use it kindly, and don't rely on it for anything critical.",
      sections: [
        {
          title: "The service",
          body: [
            "Ellma helps you keep goals, plan small steps, track the time you invest and talk about them with an AI guide. It is provided free of charge by the operator named in the imprint.",
          ],
        },
        {
          title: "Alpha status",
          body: [
            "Ellma is an early test version. Features can change or disappear, the service can be unavailable, and stored data can be reset without migration. There is no claim to availability or to a particular feature.",
          ],
        },
        {
          title: "Your account",
          body: [
            "You need an account with a valid email address and a password you keep to yourself. You can add two-factor sign-in under “Account”. The account is personal. Tell us if you think someone else is using it.",
          ],
        },
        {
          title: "Fair use",
          body: [
            "Use Ellma for your own goals. Do not try to access other people's data, overload or attack the service, or use the AI guide to produce unlawful content. We may block accounts that do.",
          ],
        },
        {
          title: "What Ellma says",
          body: [
            "Ellma's answers are generated by an AI model and can be wrong or incomplete. They are encouragement and suggestions, not medical, psychological, legal or financial advice. Decisions remain yours.",
          ],
        },
        {
          title: "Your content",
          body: [
            "Your goals and notes remain yours. We only process them to run Ellma for you, as described under “Data privacy”.",
          ],
        },
        {
          title: "Liability",
          body: [
            "We are liable without limit for intent and gross negligence and for injury to life, body or health. Otherwise, because the service is free and in test operation, liability is limited to the extent the law allows.",
          ],
        },
        {
          title: "Ending and changes",
          body: [
            "You can stop using Ellma at any time and ask for your account to be deleted. We can end the test or change these terms; the current version is always on this page.",
          ],
        },
      ],
    },
    storage: {
      title: "Cookie settings",
      lead: "Ellma sets no cookies and uses no tracking. It only uses storage in your browser, and you decide how much.",
      necessaryTitle: "Necessary",
      necessaryText:
        "Your sign-in, language, theme, your sound and reminder settings and the settings of Ellma's guide bar. Without these the app does not work.",
      alwaysOn: "Always on",
      comfortTitle: "Instant start",
      comfortText:
        "Keeps a copy of your goals and steps on this device so Ellma opens without waiting (a paused focus included), and remembers your filters on Goals and Today and the card or list view on Today. Switch it off on shared devices.",
      trackingTitle: "Statistics and marketing",
      trackingText: "None. There is nothing to switch off.",
      never: "Not used",
      on: "On",
      off: "Off",
      save: "Save",
      saved: "Settings saved.",
    },
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
          { combo: "P", label: "Pause / resume the session" },
          { combo: "S", label: "Stop and save the session" },
          { combo: "M", label: "Focus sound on / off" },
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
