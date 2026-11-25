import { randomUUID } from "node:crypto";
import type { Plugin } from "vite";

/** One release identity shared by the HTML and update-check response. */
export function appRelease(): Plugin {
  const version = `${Date.now()}-${randomUUID()}`;
  return {
    name: "mykliq-app-release",
    transformIndexHtml() {
      return [{
        tag: "meta",
        attrs: { name: "mykliq-build", content: version },
        injectTo: "head-prepend",
      }];
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "assets/app-release.json",
        source: JSON.stringify({ version }),
      });
    },
  };
}
