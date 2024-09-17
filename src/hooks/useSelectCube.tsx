import type {PlainLevel} from "@datawheel/olap-client";
import {useCallback} from "react";
import {deriveDrilldowns} from "../state/utils";
import {type MeasureItem, buildCut, buildDrilldown} from "../utils/structs";
import {stringifyName} from "../utils/transform";
import {useActions} from "./settings";

export function useSelectCube(onSelectCube: (table: string, subtopic: string) => void) {
  const {updateMeasure, updateCut, updateDrilldown, willFetchMembers} = useActions();
  const actions = useActions();
  const createCutHandler = useCallback((level: PlainLevel) => {
    const cutItem = buildCut({...level});
    cutItem.active = false;
    updateCut(cutItem);
  }, []);

  async function createDrilldown(level: PlainLevel, dimensions) {
    const drilldown = buildDrilldown({...level, key: stringifyName(level), active: true});
    updateDrilldown(drilldown);
    createCutHandler({...level, key: stringifyName(level)});

    await willFetchMembers(level.name).then(levelMeta => {
      updateDrilldown({
        ...drilldown,
        memberCount: levelMeta.members.length,
        members: levelMeta.members,
      });
    });

    return drilldown;
  }

  return (item: string, subtopic: string) => () =>
    onSelectCube(item, subtopic).then(({cube, measures, dimensions}) => {
      const [measure]: MeasureItem[] = Object.values(measures);
      const drilldowns = deriveDrilldowns(dimensions);
      if (measure && drilldowns.length > 0) {
        updateMeasure({...measure, active: true});
        const promises = drilldowns.map(level => createDrilldown(level, dimensions));
        return Promise.all(promises).then(() => actions.setLoadingState("SUCCESS"));
      }
    });
}
