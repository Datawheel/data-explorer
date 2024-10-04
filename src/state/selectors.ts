import {createSelector} from "@reduxjs/toolkit";
import {mapDimensionHierarchyLevels} from "../api/traverse";
import {serializePermalink} from "../hooks/permalink";
import {getOrderValue} from "../utils/object";
import {selectCubeName, selectCurrentQueryItem} from "./queries";
import {selectOlapCubeMap} from "./server";

export const selectOlapCube = createSelector(
  [selectOlapCubeMap, selectCubeName],
  (cubeMap, cubeName) => (cubeName in cubeMap ? cubeMap[cubeName] : undefined),
);

export const selectOlapMeasureItems = createSelector(selectOlapCube, cube =>
  cube ? cube.measures : [],
);

export const selectOlapMeasureMap = createSelector(selectOlapMeasureItems, measures =>
  Object.fromEntries(measures.map(item => [item.name, item])),
);

export const selectOlapDimensionItems = createSelector(selectOlapCube, cube =>
  !cube
    ? []
    : cube.dimensions
        .map(dim => ({
          item: {
            ...dim,
            hierarchies: dim.hierarchies
              .slice()
              .map(hierarchy => {
                hierarchy.levels
                  .slice()
                  .sort((a, b) => getOrderValue(a) - getOrderValue(b));
                return hierarchy;
              })
              .sort((a, b) => getOrderValue(a) - getOrderValue(b)),
          },
          count: dim.hierarchies.reduce((acc, hie) => acc + hie.levels.length, 0),
          alpha: dim.hierarchies.reduce((acc, hie) => acc.concat(hie.name, "-"), ""),
        }))
        .sort(
          (a, b) =>
            getOrderValue(a.item) - getOrderValue(b.item) ||
            b.count - a.count ||
            a.alpha.localeCompare(b.alpha),
        )
        .map(i => i.item),
);

export const selectOlapDimensionMap = createSelector(
  selectOlapDimensionItems,
  dimensions => Object.fromEntries(dimensions.map(item => [item.name, item])),
);

export const selectLevelTriadMap = createSelector(selectOlapCube, cube =>
  cube ? mapDimensionHierarchyLevels(cube) : {},
);

export const selectOlapTimeDimension = createSelector(
  selectOlapDimensionItems,
  dimensions =>
    dimensions.find(d => d.type === "time" || d.name === "Year" || d.name === "Date"),
);

export const selectSerializedParams = createSelector(selectCurrentQueryItem, queryItem =>
  serializePermalink(queryItem),
);
