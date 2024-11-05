//@ts-check
import {defineConfig} from "tsup"

export default defineConfig(options => ({
  clean: !options.watch,
  entry: ["src/main.ts"],
  format: ["esm", "cjs"],
  shims: true,
  sourcemap: !!options.watch,
  splitting: false,
  treeshake: true,
  declaration: true,
  dts: true,
}));