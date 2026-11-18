import { useEffect } from "react";
import { EllmaDock } from "./components/EllmaDock";
import { Shell } from "./components/Shell";
import { EllmaProvider } from "./lib/ellma";
import { PreferencesProvider, usePreferences } from "./lib/preferences";
import { navigate, useRoute } from "./lib/router";
import { useSession, type Session } from "./lib/session";
import { StoreProvider } from "./lib/store";
import { AuthPage } from "./pages/AuthPage";
import { FocusPage } from "./pages/FocusPage";
import { GoalDetailPage } from "./pages/GoalDetailPage";
import { GoalsPage } from "./pages/GoalsPage";
import { LandingPage } from "./pages/LandingPage";
import { ProgressPage } from "./pages/ProgressPage";
import { TodayPage } from "./pages/TodayPage";

const PUBLIC_PATHS = ["/", "/login", "/signup"];
const SECTIONS = ["goals", "today", "progress", "focus"];
/** Goals are home: everything else in Ellma exists to move them forward. */
const HOME = "/goals";

function SignedIn({ session }: { session: Session }) {
  const route = useRoute();
  const [section, id] = route.segments;
  if (section === "focus") {
    return (
      <>
        <FocusPage />
        <EllmaDock solo />
      </>
    );
  }
  const page =
    section === "today" ? (
      <TodayPage session={session} />
    ) : section === "goals" && id ? (
      <GoalDetailPage goalId={id} />
    ) : section === "progress" ? (
      <ProgressPage />
    ) : (
      <GoalsPage />
    );
  return (
    <Shell session={session} path={route.path}>
      {page}
    </Shell>
  );
}

function Routes() {
  const { copy } = usePreferences();
  const session = useSession(copy);
  const route = useRoute();
  const signedIn = Boolean(session.profile);
  const isPublic = PUBLIC_PATHS.includes(route.path);
  const known = SECTIONS.includes(route.segments[0] ?? "");

  useEffect(() => {
    if (signedIn && (isPublic || !known)) {
      navigate(HOME, { replace: true });
    } else if (!signedIn && !isPublic) {
      navigate("/login", { replace: true });
    }
  }, [isPublic, known, signedIn]);

  if (signedIn) {
    return (
      <StoreProvider key={String(session.profile?._id)} session={session}>
        <EllmaProvider session={session}>
          <SignedIn session={session} />
        </EllmaProvider>
      </StoreProvider>
    );
  }
  if (route.path === "/signup") {
    return <AuthPage mode="signup" session={session} />;
  }
  if (route.path === "/login" || !isPublic) {
    return <AuthPage mode="login" session={session} />;
  }
  return <LandingPage />;
}

export default function App() {
  return (
    <PreferencesProvider>
      <Routes />
    </PreferencesProvider>
  );
}
