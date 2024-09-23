import type {TesseractDimension, TesseractLevel} from "../api/tesseract/schema";

/**
 * Derives drilldowns from dimensions
 */
export function pickDefaultDrilldowns(dimensions: TesseractDimension[]) {
  const levels: TesseractLevel[] = [];

  const findDefaultHierarchy = (dim: TesseractDimension) =>
    dim.hierarchies.find(h => h.name === dim.default_hierarchy) || dim.hierarchies[0];

  for (const dimension of dimensions) {
    if (dimension.type === "time" || levels.length < 4) {
      const {levels} = findDefaultHierarchy(dimension);
      // uses deeper level for geo dimensions
      const levelIndex = dimension.type === "geo" ? levels.length - 1 : 0;
      levels.push(levels[levelIndex]);
    }
  }

  return levels;
}
