import {resolve} from "node:path";
import pluginReact from "@vitejs/plugin-react-swc";
import {
  type BuildOptions,
  type PluginOption,
  defineConfig,
  loadEnv,
} from "vite";

import pkg from "./package.json";

export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), "DAEX_");
  const {DAEX_TESSERACT_SERVER} = env;

  const target = new URL(DAEX_TESSERACT_SERVER);
  target.pathname = `${target.pathname}/`.replace(/\/{2,}/g, "/");

  const plugins: PluginOption[] = [pluginReact()];

  const buildLib: BuildOptions = {
    copyPublicDir: false,
    lib: {
      entry: [
        resolve(__dirname, "src/main.ts"),
        resolve(__dirname, "src/vizbuilder.ts"),
      ],
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react/jsx-runtime",
        pkg.name,
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies),
      ],
    },
  };

  return {
    define: {
      "process.env.BUILD_VERSION": JSON.stringify(pkg.version),
      "process.env.TESSERACT_SERVER": JSON.stringify(
        command === "serve" ? "/olap/" : DAEX_TESSERACT_SERVER,
      ),
    },
    plugins,
    build: mode === "production" ? buildLib : {
      assetsDir: "./assets/"
    },
    server: {
      proxy: {
        "/olap/": {
          changeOrigin: true,
          secure: false,
          target: target.origin,
          followRedirects: true,
          rewrite: path => {
            const newPath = path.replace(/^\/olap\//, target.pathname);
            console.log(target.origin, newPath);
            return newPath;
          },
        },
      },
    },
  };
});
