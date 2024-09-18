import {type Cube, Level, type PlainLevel, type Query} from "@datawheel/olap-client";
import {actions} from ".";
import type {TesseractDimension, TesseractLevel} from "../api/tesseract/schema";
import {filterMap} from "../utils/array";
import {
  type CutItem,
  type DrilldownItem,
  type QueryParams,
  buildDrilldown,
  buildProperty,
} from "../utils/structs";
import {buildCut} from "../utils/structs";
import {stringifyName} from "../utils/transform";
import {isActiveItem} from "../utils/validation";
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
 * Updates the list of properties of a DrilldownItem.
 */
export function hydrateDrilldownProperties(cube: Cube, drilldownItem: DrilldownItem) {
  const activeProperties = filterMap(drilldownItem.properties, prop =>
    isActiveItem(prop) ? prop.name : null
  );
  for (const level of cube.levelIterator) {
    if (level.matches(drilldownItem)) {
      return buildDrilldown({
        ...drilldownItem,
        // key: stringifyName(drilldownItem),
        fullName: level.fullName,
        uniqueName: level.uniqueName,
        dimType: level.dimension.dimensionType,
        properties: level.properties.map(property =>
          buildProperty({
            active: activeProperties.includes(property.name),
            level: level.uniqueName,
            name: property.name,
            uniqueName: property.uniqueName
          })
        )
      });
    }
  }

  return drilldownItem;
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
