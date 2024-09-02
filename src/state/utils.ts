import {Cube, Level, PlainDimension, PlainLevel, Property, Query} from "@datawheel/olap-client";
import {filterMap} from "../utils/array";
import {CutItem, DrilldownItem, QueryParams, buildDrilldown, buildProperty} from "../utils/structs";
import {isActiveItem} from "../utils/validation";
import {actions} from ".";
import {ExplorerDispatch} from "./store";
import {buildCut} from "../utils/structs";
import {stringifyName} from "../utils/transform";

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
            d => d.uniqueName === level.uniqueName
          );
          if (drilldown) {
            const ddd = {
              ...drilldown,
              dimType: dimension.dimensionType,
              memberCount: members.length,
              members
            };

            dispatch(actions.updateDrilldown({...ddd, key: stringifyName(ddd)}));
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

export function deriveDrilldowns(dimensions) {
  const drilldowns: any[] = [];
  const findDefaultHierarchy = d => d.hierarchies.find(h => h.name === d.defaultHierarchy);
  const timeDim = dimensions.find(d => d.dimensionType === "time");

  if (timeDim) {
    const timeDrilldown = findDefaultHierarchy(timeDim).levels[0];
    drilldowns.push(timeDrilldown);
  }

  for (const dim of dimensions) {
    if (dim.type !== "time" && drilldowns.length < 4) {
      // console.log(dim, "DIM 1");
      // console.log(findDefaultHierarchy(dim), "DIM");

      if (dim.hierarchies.length === 1) {
        const {levels} = dim.hierarchies[0];
        const levelIndex = dim.type === "geo" ? levels.length - 1 : 0;
        drilldowns.push(levels[levelIndex]);
      } else {
        const {levels} = findDefaultHierarchy(dim);
        // uses deeper level for geo dimensions
        const levelIndex = dim.type === "geo" ? levels.length - 1 : 0;
        drilldowns.push(levels[levelIndex]);
      }
    }
  }
  return drilldowns;
}
