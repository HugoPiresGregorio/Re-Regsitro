import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// 1. Tenta pegar a porta do ambiente, se não achar, usa "3000"
const rawPort = process.env.PORT || "3000";

// 2. Converte para número (é aqui que a linha vermelha deve sumir)
const port = Number(rawPort);

// 3. Verifica se a porta é válida
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// 4. Fallback do caminho base para o GitHub Pages (lembre de por o nome real do repo)
const basePath = process.env.BASE_PATH || '/NOME-DO-SEU-REPOSITORIO/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    ...(process.env.REPL_ID === undefined
      ? {
          proxy: {
            "/api": {
              target: `http://localhost:${process.env.API_PORT ?? "8080"}`,
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
