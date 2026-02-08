import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    server:
      mode === "development"
        ? {
            host: true,
            allowedHosts: [env.VITE_ALLOWED_HOST],
            proxy: {
              "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
              },
            },
          }
        : undefined,
  };
});
