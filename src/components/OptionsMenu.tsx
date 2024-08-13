import React, {useCallback} from "react";
import {Menu, ActionIcon, ActionIconProps, UnstyledButton, Group, Text} from "@mantine/core";
import {IconChevronRight, IconStack2} from "@tabler/icons-react";
import {DimensionMenu} from "./MenuDimension";
import MeasuresMenu from "./MeasuresMenu";
import {stringifyName} from "../utils/transform";
import {useSelector} from "react-redux";
import {selectDrilldownItems} from "../state/queries";
import {selectOlapDimensionItems} from "../state/selectors";
import {useActions} from "../hooks/settings";
import {buildDrilldown, buildCut} from "../utils/structs";
import type {LevelDescriptor} from "../utils/types";
import type {ComponentProps, ReactNode} from "react";
import type {PlainLevel} from "@datawheel/olap-client";

function OptionsMenu({children}: {children: ReactNode}) {
  const actions = useActions();
  const items = useSelector(selectDrilldownItems);
  const dimensions = useSelector(selectOlapDimensionItems);
  const {willRequestQuery} = useActions();

  const createCutHandler = React.useCallback((level: PlainLevel) => {
    const cutItem = buildCut({...level, key: level.fullName});
    cutItem.active = false;
    actions.updateCut(cutItem);
  }, []);

  const createHandler = useCallback(
    (level: PlainLevel) => {
      // find or create drilldown
      const drilldownItem =
        items.find(item => item.fullName === level.fullName) ?? buildDrilldown({...level});
      createCutHandler(level);
      actions.updateDrilldown(drilldownItem);
      actions
        .willFetchMembers({...level, level: level.name})
        .then(members => {
          const dimension = dimensions.find(dim => dim.name === level.dimension);
          if (!dimension) return;
          actions.updateDrilldown({
            ...drilldownItem,
            dimType: dimension.dimensionType,
            memberCount: members.length,
            members
          });
        })
        .then(() => willRequestQuery());
    },
    [dimensions]
  );

  return (
    <Menu
      closeOnClickOutside
      closeOnEscape
      position="left"
      shadow="md"
      withArrow
      key={"options-menu"}
    >
      <Menu.Target>
        <ActionIcon size={"xl"} id="icon-icon-plus">
          {children}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <MeasuresMenu>Metrics</MeasuresMenu>
        <NestedMenu selectedItems={items.filter(i => i.active)} onItemSelect={createHandler}>
          Dimensions
        </NestedMenu>
        {/* <Menu.Item icon={<IconArrowsLeftRight size={14} />}>Calculations</Menu.Item> */}
      </Menu.Dropdown>
    </Menu>
  );
}

type NestedMenuProps = {
  selectedItems: LevelDescriptor[];
  children: ReactNode;
  onItemSelect: ComponentProps<typeof DimensionMenu>["onItemSelect"];
};

function NestedMenu({selectedItems, children, onItemSelect}: NestedMenuProps) {
  return (
    <Menu
      key={"options-dimensions"}
      closeOnClickOutside
      closeOnEscape
      position="left"
      shadow="md"
      withArrow
    >
      <Menu.Target>
        <UnstyledButton component="span">
          <Menu.Item
            icon={<IconStack2 />}
            sx={theme => ({
              [theme.fn.smallerThan("md")]: {
                maxWidth: 200
              }
            })}
          >
            <Group noWrap position="apart">
              <Text>{children}</Text>
              <IconChevronRight stroke={1.5} size={16} />
            </Group>
          </Menu.Item>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <DimensionMenu
          selectedItems={selectedItems.map(stringifyName)}
          onItemSelect={onItemSelect}
        />
      </Menu.Dropdown>
    </Menu>
  );
}

export default OptionsMenu;
