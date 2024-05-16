import { Cube, Level, PlainDimension, PlainLevel, Property, Query } from "@datawheel/olap-client";
import { filterMap } from "../utils/array";
import { DrilldownItem, QueryParams, buildDrilldown, buildProperty } from "../utils/structs";
import { isActiveItem } from "../utils/validation";
import { actions } from ".";
import { ExplorerDispatch } from "./store";

/**
 * Returns the maximum number of member combinations a query can return.
 */
// add type
export function calcMaxMemberCount(query: Query, params: QueryParams, dispatch: ExplorerDispatch) {
  const ds = query.cube.datasource;

  // Rollback response type to default
  ds.axiosInstance.defaults.responseType = undefined;

  // make a map with the memberCounts already fetched
  const drills = { undefined: 1 };
  Object.values(params.drilldowns).forEach(dd => {
    drills[dd.uniqueName] = dd.memberCount;
  });
  // get the member counts if already stored, else fetch them
  const memberLengths = query.getParam("drilldowns").map(level =>
    Level.isLevel(level)
      ? drills[level.uniqueName] || ds.fetchMembers(level).then(members => {
        const { cube, name, dimension, fullName, depth, properties, hierarchy, annotations } = level
        const lv: PlainLevel = {
          cube: cube.name, dimension: dimension.name,
          fullName, depth, _type: "level", name, uri: level._source.uri,
          properties: properties.map((p: Property) => ({ name: p.name, annotations: p.annotations, uri: p._source.uri, _type: "property" })),
          hierarchy: hierarchy.name,
          annotations: annotations
        }
        const dd = buildDrilldown(lv)
        const ddd = { ...dd, key: dd.fullName, dimType: dimension.dimensionType, memberCount: members.length, members }
        dispatch(actions.updateDrilldown(ddd))
        return members.length
      })
      : Promise.resolve(1)
  );

  // multiply and return
  return Promise.all(memberLengths).then(lengths =>
    lengths.reduce((prev, curr) => prev * curr)
  );
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
        properties: level.properties.map(property => buildProperty({
          active: activeProperties.includes(property.name),
          level: level.uniqueName,
          name: property.name,
          uniqueName: property.uniqueName
        }))
      });
    }
  }

  return drilldownItem;
}