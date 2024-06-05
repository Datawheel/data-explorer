import {Tabs, TabsValue} from "@mantine/core";
import React, {useCallback, useMemo} from "react";

import {useSettings} from "../hooks/settings";
import {useSelector} from "../state";
import {selectCurrentQueryItem} from "../state/queries";
import {useTranslation} from "../hooks/translation";

export function ModeTabs(props: {}) {
  const {actions, panels} = useSettings();

  const {t} = useTranslation();

  const {panel} = useSelector(selectCurrentQueryItem);

  const tabHandler = useCallback(
    (newTab: TabsValue) => {
      actions.switchPanel(newTab);
    },
    [actions],
  );

  const currentPanel = useMemo(() => {
    const [panelKey] = (panel || `${panels[0].key}-`).split("-");
    return panels.find(item => item.key === panelKey) || panels[0];
  }, [panels, panel]);

  return (
    <Tabs
      color="blue"
      id="query-results-tabs"
      onTabChange={tabHandler}
      value={currentPanel.key}
      styles={{
        tab: {
          padding: "md",
        }
      }}
    >
      <Tabs.List>
        {panels.map(panel => (
          <Tabs.Tab key={panel.key} id={panel.key} value={panel.key}>
            {t(panel.label)}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
