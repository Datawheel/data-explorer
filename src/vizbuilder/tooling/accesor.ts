import type {D3plusConfig} from "@datawheel/vizbuilder";
import type {TesseractMeasure} from "../../api/tesseract/schema";

/**
 * Normalizes the Vizbuilder Component Property "measureConfig", which can
 * accept both a `(measure: OlapClient.Measure) => D3plusConfig` or a
 * `Record<string, D3plusConfig>, into the function form for internal use.
 */
export function measureConfigAccessor(
  config: Record<string, D3plusConfig> | ((item: TesseractMeasure) => D3plusConfig),
): (item: TesseractMeasure) => D3plusConfig {
  if (typeof config === "function") {
    return config;
  }
  return item => config[item.name];
}
