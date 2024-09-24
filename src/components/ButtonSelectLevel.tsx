import {ActionIcon, type ActionIconProps, Menu, useMantineTheme} from "@mantine/core";
import {useMediaQuery} from "@mantine/hooks";
import React from "react";
import {DimensionMenu} from "./MenuDimension";

export const ButtonSelectLevel = (
  props: ActionIconProps & {
    children: React.ReactNode;
    onItemSelect: React.ComponentProps<typeof DimensionMenu>["onItemSelect"];
    selectedItems: string[];
  },
) => {
  const {selectedItems, onItemSelect, children, ...buttonProps} = props;
  const theme = useMantineTheme();
  const isMediumScreen = useMediaQuery(`(max-width: ${theme.breakpoints.md}px)`);

  return (
    <Menu
      closeOnClickOutside
      closeOnEscape
      position={isMediumScreen ? "left" : "right"}
      shadow="md"
      withArrow
      withinPortal
    >
      <Menu.Target>
        <ActionIcon {...buttonProps}>{children}</ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <DimensionMenu
          isMediumScreen={isMediumScreen}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
        />
      </Menu.Dropdown>
    </Menu>
  );
};
