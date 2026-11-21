import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { readingsRoute } from "./server/sqlite.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "TWIN_");
  const demo = mode === "demo";
  const adapter = readingsRoute({
    filename: demo
      ? fileURLToPath(new URL("./server/.local/demo.sqlite", import.meta.url))
      : env.TWIN_DB_PATH,
    source: demo ? "Sample database" : "SQLite database",
  });
  const proxy =
    !demo && env.TWIN_API_ORIGIN
      ? { "/api": { target: env.TWIN_API_ORIGIN, changeOrigin: true } }
      : undefined;
  function attach(server) {
    if (!proxy) server.middlewares.use(adapter);
  }
  return {
    esbuild: { jsx: "automatic" },
    server: {
      proxy,
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/server/**",
          "**/sample/**",
          "**/*.sqlite*",
        ],
      },
    },
    preview: { proxy },
    plugins: [{ name: "readings-api", configureServer: attach, configurePreviewServer: attach }],
  };
});
