// @ts-check
import {defineConfig} from "tsup";
import pkg from "./package.json";
import path from "path";
import fsPromises from "fs/promises";
import postcss from "postcss";
import postcssModules from "postcss-modules";
import {generateScopedName} from "hash-css-selector";

export default defineConfig(options => ({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  loader: {
    ".css": "local-css"
  },

  sourcemap: !!options.watch,
  clean: !options.watch,

  env: {
    BUILD_VERSION: pkg.version
  },
  dts: options.watch
    ? false
    : {
        resolve: false
      },

  outExtension({format}) {
    return {js: `.${format}.js`};
  },
  shims: true,
  splitting: false,
  treeshake: true,
  esbuildPlugins: [
    {
      name: "css-module",
      setup(build) {
        build.onResolve({filter: /\.module\.css$/, namespace: "file"}, args => {
          return {
            path: `${args.path}#css-module`,
            namespace: "css-module",
            pluginData: {
              pathDir: path.join(args.resolveDir, args.path)
            }
          };
        });
        build.onLoad({filter: /#css-module$/, namespace: "css-module"}, async args => {
          const {pluginData} = args;

          const source = await fsPromises.readFile(pluginData.pathDir, "utf8");

          let cssModule = {};
          const result = await postcss([
            postcssModules({
              generateScopedName: function (name, filename) {
                const newSelector = generateScopedName(name, filename);
                cssModule[name] = newSelector;

                return newSelector;
              },
              getJSON: () => {},
              scopeBehaviour: "local"
            })
          ]).process(source, {from: pluginData.pathDir});

          return {
            pluginData: {css: result.css},
            contents: `import "${pluginData.pathDir}"; export default ${JSON.stringify(cssModule)}`
          };
        });
        build.onResolve({filter: /\.module\.css$/, namespace: "css-module"}, args => ({
          path: path.join(args.resolveDir, args.path, "#css-module-data"),
          namespace: "css-module",
          pluginData: args.pluginData
        }));
        build.onLoad({filter: /#css-module-data$/, namespace: "css-module"}, args => ({
          contents: args.pluginData.css,
          loader: "css"
        }));
      }
    }
  ]
}));
