import {Level, type PlainLevel, type Query} from "@datawheel/olap-client";
import {actions} from ".";
import type {
  TesseractCube,
  TesseractDimension,
  TesseractLevel,
} from "../api/tesseract/schema";
import {type CutItem, type QueryParams, buildCut, buildDrilldown} from "../utils/structs";
import {stringifyName} from "../utils/transform";
import type {ExplorerDispatch} from "./store";

const createCutHandler = (
  cuts: Record<string, CutItem>,
  level: PlainLevel,
  dispatch: ExplorerDispatch
) => {
  const cutItem = Object.values(cuts).find(cut => {
    return cut.uniqueName === level.uniqueName;
  });
  if (!cutItem) {
    const cutItem = buildCut({...level, key: level.uniqueName, members: []});
    cutItem.active = false;
    dispatch(actions.updateCut(cutItem));
  }
};

/**
 * Returns the maximum number of member combinations a query can return.
 */
// add type
export function calcMaxMemberCount(query: Query, params: QueryParams, dispatch: ExplorerDispatch) {
  const ds = query.cube.datasource;

  // Rollback response type to default
  ds.axiosInstance.defaults.responseType = undefined;

  // make a map with the memberCounts already fetched
  const drills = {undefined: 1};
  Object.values(params.drilldowns).forEach(dd => {
    drills[dd.uniqueName] = dd.memberCount;
  });
  // get the member counts if already stored, else fetch them
  const memberLengths = query.getParam("drilldowns").map(level =>
    Level.isLevel(level)
      ? drills[level.uniqueName] ||
        ds.fetchMembers(level).then(async members => {
          const {dimension} = level;
          const drilldown = Object.values(params.drilldowns).find(
            d => d.uniqueName === buildDrilldown(level).uniqueName
          );
          if (drilldown) {
            const ddd = {
              ...drilldown,
              dimType: dimension.dimensionType,
              memberCount: members.length,
              members
            };

            // seems no need to update it in here.
            dispatch(actions.updateDrilldown(buildDrilldown({...ddd, key: stringifyName(ddd)})));
            createCutHandler(params.cuts, ddd, dispatch);
          }
          return members.length;
        })
      : Promise.resolve(1)
  );

  // multiply and return
  return Promise.all(memberLengths).then(lengths => lengths.reduce((prev, curr) => prev * curr));
}

/**
 * Creates a map object to reference a level name with its parent entities.
 */
export function buildLevelMap(cube: TesseractCube) {
  return Object.fromEntries(
    cube.dimensions.flatMap(dimension =>
      dimension.hierarchies.flatMap(hierarchy =>
        hierarchy.levels.map(level => [
          level.name,
          [dimension, hierarchy, level] as const,
        ]),
      ),
    ),
  );
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
      const {levels} = findDefaultHierarchy(dimension);
      // uses deeper level for geo dimensions
      const levelIndex = dimension.type === "geo" ? levels.length - 1 : 0;
      levels.push(levels[levelIndex]);
    }
  }

  return levels;
}
