import {resolve} from "node:path";
import pluginReact from "@vitejs/plugin-react-swc";
import {type BuildOptions, type PluginOption, defineConfig, loadEnv} from "vite";

import pkg from "./package.json";

export default defineConfig(({command, mode}) => {
  const isProduction = mode === "production";

  const plugins: PluginOption[] = [pluginReact()];

  const buildLib: BuildOptions = {
    copyPublicDir: false,
    lib: {
      entry: [resolve(__dirname, "src/main.ts"), resolve(__dirname, "src/vizbuilder.ts")],
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "react/jsx-runtime",
        pkg.name,
        ...Object.keys(pkg.dependencies),
        ...Object.keys(pkg.peerDependencies)
      ]
    }
  };

  return {
    define: {
      "process.env.BUILD_VERSION": JSON.stringify(pkg.version)
    },
    plugins,
    build: isProduction ? buildLib : {assetsDir: "./assets/"}
  };
});
