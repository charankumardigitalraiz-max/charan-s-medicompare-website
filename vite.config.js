import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "sonner": path.resolve(__dirname, "./src/components/ui/Toast.jsx"),
      "react-hot-toast": path.resolve(__dirname, "./src/components/ui/Toast.jsx"),
    },
  },
  base: "/",
  build: {
    outDir: 'web/dist',
  },
  server: {
    host: true,
    port: 5173,
  },
});
