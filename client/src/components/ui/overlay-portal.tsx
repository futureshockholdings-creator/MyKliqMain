import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/** Escape the app's scroll, transform and navigation stacking contexts. */
export function OverlayPortal({ children }: { children: ReactNode }) {
  return typeof document === "undefined" ? null : createPortal(children, document.body);
}
