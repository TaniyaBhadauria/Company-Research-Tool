import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Add a proxy to forward API requests to your Python backend
    proxy: {
      '/generate-config': {
        target: 'https://backendtool.vercel.app/',
        changeOrigin: true,
      },
      '/thesis-names': {
        target: 'https://backendtool.vercel.app/',
        changeOrigin: true,
      },
      '/companies-by-thesis': {
        target: 'https://backendtool.vercel.app/',
        changeOrigin: true,
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
