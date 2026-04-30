import React, {useState} from "react";
import {MantineTheme, Tabs, Menu, ActionIcon, useMantineTheme} from "@mantine/core";
import {useTranslation} from "../main";
import {IconDotsVertical} from "@tabler/icons-react";
import {useMediaQuery} from "@mantine/hooks";

const tabsStyles = (t: MantineTheme) => ({
  root: {
    alignSelf: "flex-start",
    width: "100%"
  },
  tab: {
    fontWeight: 700,
    color: t.colors.gray[6],
    [`&[data-active]`]: {
      borderColor: t.colors[t.primaryColor][t.fn.primaryShade()]
    },
    [`&[data-active] > span`]: {
      fontWeight: 700,
      color: t.colors[t.primaryColor][t.fn.primaryShade()]
    }
  }
});

export function ExplorerTabs({panels, onChange, value}) {
  const {translate: t} = useTranslation();
  const [menuOpened, setMenuOpened] = useState(false);
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(
    `(max-width: ${theme.breakpoints.xs}${
      /(?:px|em|rem|vh|vw|%)$/.test(theme.breakpoints.xs) ? "" : "px"
    })`
  );

  // When screen is smaller than md, only show the first 2 tabs
  const visiblePanels = isMobile ? panels.slice(0, 2) : panels;

  // The panels that will be shown in the dropdown menu
  const menuPanels = isMobile ? panels.slice(2) : [];

  // Handle selection from dropdown menu
  const handleMenuItemClick = panelKey => {
    onChange(panelKey);
    setMenuOpened(false);
  };

  return (
    <Tabs
      color="blue"
      id="query-results-tabs"
      className="dex-tabs"
      onTabChange={onChange}
      value={value}
      styles={tabsStyles}
    >
      <Tabs.List className="dex-tabs-list" sx={{flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between"}}>
        <div style={{display: "flex"}}>
          {visiblePanels.map(panel => (
            <Tabs.Tab className="dex-tab" key={panel.key} id={panel.key} value={panel.key} h={56}>
              {t(panel.label)}
            </Tabs.Tab>
          ))}
        </div>

        {/* Show menu button when there are panels to show in the menu */}
        {menuPanels.length > 0 && (
          <Menu opened={menuOpened} onChange={setMenuOpened} withinPortal>
            <Menu.Target>
              <ActionIcon
                className="dex-tabs-overflow-trigger"
                data-open={String(menuOpened)}
                size="lg"
                variant="subtle"
                color={theme.primaryColor}
                sx={{display: "flex", alignItems: "center", height: "100%", marginLeft: "auto"}}
              >
                <IconDotsVertical size="1.2rem" />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {menuPanels.map(panel => (
                <Menu.Item
                  className="dex-tab"
                  data-active={String(value === panel.key)}
                  key={panel.key}
                  onClick={() => handleMenuItemClick(panel.key)}
                  color={value === panel.key ? theme.primaryColor : undefined}
                  fw={value === panel.key ? 700 : undefined}
                >
                  {t(panel.label)}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        )}
      </Tabs.List>
    </Tabs>
  );
}
