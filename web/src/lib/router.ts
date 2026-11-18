import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "./motion";

const NAVIGATION_EVENT = "ellma:navigate";

type TransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/**
 * Client-side navigation. Pushes animate with the View Transitions API where available, so
 * a goal's apple travels from its card into the goal page. Redirects (`replace`) run inside
 * React effects, where a synchronous flush is not allowed, so they switch instantly.
 */
export function navigate(path: string, options: { replace?: boolean } = {}): void {
  if (path === `${location.pathname}${location.search}`) {
    return;
  }
  const apply = () => {
    if (options.replace) {
      history.replaceState(null, "", path);
    } else {
      history.pushState(null, "", path);
    }
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
    window.scrollTo({ top: 0 });
  };
  const view = document as TransitionDocument;
  if (!options.replace && view.startViewTransition && !prefersReducedMotion()) {
    view.startViewTransition(() => flushSync(apply));
  } else {
    apply();
  }
}

export type Route = { path: string; segments: string[]; query: URLSearchParams };

function currentRoute(): Route {
  return {
    path: location.pathname,
    segments: location.pathname.split("/").filter(Boolean),
    query: new URLSearchParams(location.search),
  };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => setRoute(currentRoute());
    window.addEventListener("popstate", update);
    window.addEventListener(NAVIGATION_EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(NAVIGATION_EVENT, update);
    };
  }, []);
  return route;
}

/** Same-page links that keep client-side navigation and still open in new tabs. */
export function linkHandler(path: string) {
  return (event: {
    preventDefault: () => void;
    metaKey: boolean;
    ctrlKey: boolean;
    button?: number;
  }) => {
    if (event.metaKey || event.ctrlKey || (event.button ?? 0) !== 0) {
      return;
    }
    event.preventDefault();
    navigate(path);
  };
}
