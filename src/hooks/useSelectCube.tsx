import React, {useCallback} from "react";
import type {PlainLevel} from "@datawheel/olap-client";
import {buildDrilldown, buildCut, MeasureItem} from "../utils/structs";
import {useActions} from "./settings";
import {deriveDrilldowns} from "../state/utils";

export function useSelectCube(onSelectCube: (table: string, subtopic: string) => void) {
  const {updateMeasure, updateCut, updateDrilldown, willFetchMembers} = useActions();

  const createCutHandler = React.useCallback((level: PlainLevel) => {
    const cutItem = buildCut({...level});
    cutItem.active = false;
    updateCut(cutItem);
  }, []);

  const addDrilldown = useCallback((level: PlainLevel, dimensions) => {
    const drilldownItem = buildDrilldown(level);
    createCutHandler(level);
    updateDrilldown(drilldownItem);
    return willFetchMembers({...level, level: level.name}).then(members => {
      const dimension = dimensions.find(dim => dim.name === level.dimension);
      if (!dimension) return;
      return updateDrilldown({
        ...drilldownItem,
        dimType: dimension.dimensionType,
        memberCount: members.length,
        members
      });
    });
  }, []);

  return (item: string, subtopic: string) => () =>
    onSelectCube(item, subtopic).then(({cube, measures, dimensions}) => {
      const [measure]: MeasureItem[] = Object.values(measures);
      const drilldowns = deriveDrilldowns(dimensions);
      if (measure && drilldowns.length > 0) {
        updateMeasure({...measure, active: true});
        for (const level of drilldowns) {
          addDrilldown(level, dimensions);
        }
      }
    });
}
