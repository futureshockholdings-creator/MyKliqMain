import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

/**
 * Publish the shared classic-worker helper through the same /assets/ route as
 * the frontend bundles. Some hosting rewrites return SPA HTML for a new root
 * script even while deploying existing root worker URLs correctly.
 * Keep client/public/app-badge.js as the single source and compatibility URL.
 */
export function pwaWorkerAssets(helperPath: string): Plugin {
  return {
    name: "mykliq-pwa-worker-assets",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/assets/app-badge.js") return next();
        if (request.method !== "GET" && request.method !== "HEAD") return next();
        response.setHeader("Content-Type", "application/javascript; charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        response.end(request.method === "HEAD" ? undefined : readFileSync(helperPath));
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "assets/app-badge.js",
        source: readFileSync(helperPath),
      });
    },
  };
}
