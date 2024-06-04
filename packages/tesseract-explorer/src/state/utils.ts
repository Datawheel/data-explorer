import {
  Cube,
} from "@datawheel/olap-client";
import {filterMap} from "../utils/array";
import {
  DrilldownItem,
  buildDrilldown,
  buildProperty,
} from "../utils/structs";
import {isActiveItem} from "../utils/validation";

/**
 * Updates the list of properties of a DrilldownItem.
 */
export function hydrateDrilldownProperties(
  cube: Cube,
  drilldownItem: DrilldownItem,
) {
  const activeProperties = filterMap(drilldownItem.properties, prop =>
    isActiveItem(prop) ? prop.name : null,
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
            uniqueName: property.uniqueName,
          }),
        ),
      });
    }
  }

  return drilldownItem;
}
