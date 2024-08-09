import {Explorer, PivotView, TableView, translationDict as explorerTranslation} from "../src/main";
import {MantineProvider, useMantineTheme, Affix, Select, Text, Group, Box, ActionIcon, Dialog, Stack, MantineThemeOverride, MantineThemeColors} from "@mantine/core";
import { IconPalette, IconSun, IconMoon } from "@tabler/icons-react";
import React, { useMemo, useState, forwardRef } from "react";
import {createRoot} from "react-dom/client";

const formatters = {
  Index: n => (typeof n === "number" ? n.toFixed(3) : n || " "),
  "Metric Ton": n => `${n.toFixed()} 📦`,
  Sheep: n => `🐑 ${n.toFixed()}`
};

const container = document.getElementById("app");
container && mount(container);

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string;
  hex: string;
}

const ColorElement = forwardRef<HTMLDivElement, ItemProps>(
  ({ hex, label, ...others }, ref) => {
    return (
    <div ref={ref} {...others}>
      <Group noWrap>
        <Box sx={{background: hex, height: 15, width: 15, borderRadius: 15}} />
        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )}
);
function ColorPicker ({
  primaryColor,
  setPrimaryColor,
  toggleColorScheme
}) {
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();
  
  const data = Object.keys(theme.colors).map(c => ({
    label: c,
    value: c,
    hex: theme.colors[c][theme.fn.primaryShade()]
  }));

  const position = {top: "0.65rem", right: "0.5rem"};

  return (
    <>
      <Affix position={position}>
        <ActionIcon onClick={() => setOpened(v => !v)}>
          <IconPalette />
        </ActionIcon>
      </Affix>
      <Dialog
        w={250}
        opened={opened}
        position={position}
        onClose={() => setOpened(false)}
        withCloseButton
      >
        <Group>
        <Select
            size="xs"
            label={"Color"}
            icon={<Box sx={{background: theme.colors[theme.primaryColor][theme.fn.primaryShade()], height: 15, width: 15, borderRadius: 15}} />}
            value={primaryColor || "blue"}
            w={120}
            itemComponent={ColorElement}
            data={data}
            onChange={setPrimaryColor}
          />
          <Stack spacing={0}>
            <Text size="xs" fw={500}>Theme</Text>
            <ActionIcon onClick={() => toggleColorScheme()}>
              {theme.colorScheme === "dark" ? <IconSun />: <IconMoon />}
            </ActionIcon>
          </Stack>
          </Group>
      </Dialog>
    </>
  )
}
function ThemeProvider ({children}) {
  const [primaryColor, setPrimaryColor] = useState("blue");
  const [colorScheme, setColorScheme] = useState<"light" | "dark">('light');
  
  const toggleColorScheme = (value) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  const theme: MantineThemeOverride = useMemo(() => ({
    primaryColor,
    colorScheme,
  }), [primaryColor, colorScheme]);

  return <MantineProvider inherit withNormalizeCSS theme={theme}>
          <ColorPicker
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            toggleColorScheme={toggleColorScheme}
          />
          {children}
    </MantineProvider>
}
/** */
function mount(container) {
  const root = createRoot(container);
  root.render(
    <ThemeProvider>
      <Explorer
        source={process.env.TESSERACT_SERVER}
        // source={"https://api.oec.world/tesseract/"}
        // source={"https://api.datasaudi.sa/"}
        formatters={formatters}
        dataLocale="en,ar"
        // height="90vh"
        previewLimit={75}
        panels={[
          {key: "table", label: "Data Table", component: TableView},
          {key: "matrix", label: "Pivot Table", component: PivotView}
        ]}
        translations={{en: explorerTranslation}}
        defaultOpenParams="drilldowns"
        withinMantineProvider={false}
        withinReduxProvider
        withMultiQuery
        withPermalink
      />
    </ThemeProvider>
  );
}
