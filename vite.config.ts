import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  // REQUIRED for GitHub Pages (repo name is Fitness-app)
  base: "/Fitness-app/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Local dev only (does NOT affect GitHub Pages)
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
}));
