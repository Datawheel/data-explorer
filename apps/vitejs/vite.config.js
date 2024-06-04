import pluginReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const {
  OLAPPROXY_TARGET = "http://localhost:7777"
} = process.env;

const target = new URL(OLAPPROXY_TARGET);
target.pathname = `${target.pathname}/`.replace(/\/{2,}/g, "/");

export default defineConfig(({command, mode, ssrBuild}) => {
  return {
    root: "./src",
    define: {
      'process.env': {},
      'process.env.BUILD_VERSION': '"x.y.z"',
      'process.env.TESSERACT_SERVER': command === "build" ? `"${OLAPPROXY_TARGET}"` : '"/olap/"',
    },
    plugins: [pluginReact({fastRefresh: false})],
    server: {
      proxy: {
        "/olap/": {
          changeOrigin: true,
          secure: false,
          target: target.origin,
          followRedirects: true,
          rewrite: (path) => {
            const newPath = path.replace(/^\/olap\//, target.pathname);
            console.log(target.origin, newPath);
            return newPath;
          }
        }
      }
    }
  };
})
