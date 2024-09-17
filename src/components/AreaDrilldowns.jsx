import {ActionIcon, Alert, Stack} from "@mantine/core";
import {IconAlertCircle, IconCirclePlus, IconTrashX} from "@tabler/icons-react";
import React, {useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectDrilldownItems} from "../state/queries";
import {buildDrilldown} from "../utils/structs";
import {activeItemCounter} from "../utils/validation";
import {ButtonSelectLevel} from "./ButtonSelectLevel";
import {LayoutParamsArea} from "./LayoutParamsArea";
import {TagDrilldown} from "./TagDrilldown";

/** @type {React.FC} */
export const AreaDrilldowns = () => {
  const actions = useActions();

  const {translate: t} = useTranslation();

  const items = useSelector(selectDrilldownItems);

  const clearHandler = useCallback(() => {
    actions.resetDrilldowns({});
  }, []);

  /** @type {(level: import("../api/tesseract/schema").TesseractLevel) => void} */
  const createHandler = useCallback(level => {
    const drilldownItem = buildDrilldown(level);
    actions.updateDrilldown(drilldownItem);
    actions.willFetchMembers(level.name).then(res => {
      actions.updateDrilldown({
        ...drilldownItem,
        memberCount: res.members.length,
      });
    });
  }, []);

  const drilldownTags = useMemo(() => items.map(item =>
    <TagDrilldown key={item.key} item={item} />
  ), [items]);

  const toolbar =
    <>
      {items.length > 0 &&
        <ActionIcon onClick={clearHandler} variant="subtle">
          <IconTrashX />
        </ActionIcon>
      }
      <ButtonSelectLevel
        onItemSelect={createHandler}
        selectedItems={items}
        variant="subtle"
      >
        <IconCirclePlus />
      </ButtonSelectLevel>
    </>;

  return (
    <LayoutParamsArea
      id="drilldowns"
      title={t("params.title_area_drilldowns", {n: `${items.reduce(activeItemCounter, 0)}`})}
      toolbar={toolbar}
      tooltip={t("params.tooltip_area_drilldowns")}
      value="drilldowns"
    >
      <Stack spacing="xs">
        {items.length === 0 && <Alert
          color="yellow"
          icon={<IconAlertCircle size="2rem" />}
          title={t("params.error_no_dimension_selected_title")}
        >{t("params.error_no_dimension_selected_detail")}</Alert>}
        {drilldownTags}
      </Stack>
    </LayoutParamsArea>
  );
};
