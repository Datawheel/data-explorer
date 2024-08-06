import React from "react"
import { MantineTheme, Tabs } from "@mantine/core"
import { useTranslation } from "../main";

const tabsStyles = (t: MantineTheme) => ({
    tab: {
        fontWeight: 700,
        color: t.colors.gray[6],
        [`&[data-active] > span`]: {
            fontWeight: 700,
            color: t.colors[t.primaryColor][5]
        }   
    }
})

export function ExplorerTabs ({
    panels,
    onChange,
    value
}) {
    const {translate: t} = useTranslation();

    return (
        <Tabs
            color="blue"
            id="query-results-tabs"
            onTabChange={onChange} 
            value={value}
            styles={tabsStyles}
        >
            <Tabs.List>
                {panels.map(panel => (
                    <Tabs.Tab key={panel.key} id={panel.key} value={panel.key} h={56}>
                    {t(panel.label)}
                    </Tabs.Tab>
                ))}
            </Tabs.List>
        </Tabs>
    )
}