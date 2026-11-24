import { useLayoutEffect } from "react";
import { useLocation, useSearch } from "wouter";

/** A new destination must not inherit the shared page container's old offset. */
export function usePageScrollReset() {
  const [pathname] = useLocation();
  const search = useSearch();

  useLayoutEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    // The app scrolls this persistent element, not just the browser window.
    // Run before paint so the new page never flashes at the previous offset.
    document.getElementById("main-scroll-container")?.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Only navigation changes reset scroll. Fetches, notifications, mutations,
    // and other rerenders leave the member's reading position untouched.
    // Page-specific effects can still scroll to a linked post or chat message.
  }, [pathname, search]);
}
