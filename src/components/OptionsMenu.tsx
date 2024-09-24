import {ActionIcon, Group, Menu, Text, UnstyledButton} from "@mantine/core";
import {IconChevronRight, IconStack2} from "@tabler/icons-react";
import React, {useCallback} from "react";
import type {ComponentProps, ReactNode} from "react";
import {useSelector} from "react-redux";
import type {TesseractLevel} from "../api/tesseract/schema";
import {useActions} from "../hooks/settings";
import {selectDrilldownItems} from "../state/queries";
import {buildCut, buildDrilldown} from "../utils/structs";
import {stringifyName} from "../utils/transform";
import type {LevelDescriptor} from "../utils/types";
import MeasuresMenu from "./MeasuresMenu";
import {DimensionMenu} from "./MenuDimension";

function OptionsMenu({children}: {children: ReactNode}) {
  const actions = useActions();
  const items = useSelector(selectDrilldownItems);

  const createHandler = useCallback(
    (level: TesseractLevel) => {
      // find or create drilldown
      const drilldownItem =
        items.find(item => item.level === level.name) || buildDrilldown(level);
      actions.updateDrilldown(drilldownItem);
      actions.updateCut(buildCut({...level, active: false}));
      actions.willFetchMembers(level.name).then(levelMeta => {
        actions.updateDrilldown({
          ...drilldownItem,
          members: levelMeta.members,
        });
        return actions.willRequestQuery();
      });
    },
    [items],
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
