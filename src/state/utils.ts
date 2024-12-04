import type {TesseractDimension, TesseractLevel} from "../api/tesseract/schema";

function calcMaxMemberCount(lengths) {
  return lengths.reduce((prev, curr) => prev * curr);
}

/**
 * Derives drilldowns from dimensions
 */
export function pickDefaultDrilldowns(dimensions: TesseractDimension[]) {
  const levels: TesseractLevel[] = [];

  const findDefaultHierarchy = (dim: TesseractDimension) =>
    dim.hierarchies.find(h => h.name === dim.default_hierarchy) || dim.hierarchies[0];

  for (const dimension of dimensions) {
    if (dimension.type === "time" || levels.length < 4) {
      const hierarchy = findDefaultHierarchy(dimension);
      // uses deepest level for geo dimensions
      const levelIndex = dimension.type === "geo" ? hierarchy.levels.length - 1 : 0;
      levels.push({...hierarchy.levels[levelIndex], type: dimension.type});
    }
  }

  // Calculate the total member count
  let totalCount = calcMaxMemberCount(levels.map(l => l.count));

  // Remove levels if totalCount exceeds 5 million
  while (totalCount > 5000000) {
    // Prefer to remove geo levels first
    const geoIndex = levels.findIndex(level => level.type === "geo");
    if (geoIndex !== -1) {
      levels.splice(geoIndex, 1); // Remove the geo level if present
    } else {
      levels.pop(); // Remove the last level if no geo levels are left
    }
    totalCount = calcMaxMemberCount(levels.map(l => l.count)); // Recalculate totalCount
  }

  return levels;
}
