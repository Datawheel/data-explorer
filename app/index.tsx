import {Explorer, PivotView, TableView, createVizbuilderView} from "../src/main";
import {
  MantineProvider,
  useMantineTheme,
  Header,
  Select,
  Text,
  Group,
  Box,
  ActionIcon,
  Dialog,
  MantineThemeOverride,
  Divider,
  Flex,
  createEmotionCache
} from "@mantine/core";
import {
  IconSettings,
  IconSun,
  IconMoon,
  IconTextDirectionLtr,
  IconTextDirectionRtl,
  IconLanguage
} from "@tabler/icons-react";
import React, {useMemo, useState, forwardRef, useEffect} from "react";
import {createRoot} from "react-dom/client";
import {HomeSVG} from "../src/components/icons";
import translations from "../translations";

import rtlPlugin from "stylis-plugin-rtl";

const rtlCache = createEmotionCache({
  key: "mantine-rtl",
  stylisPlugins: [rtlPlugin]
});

const VizbuilderView = createVizbuilderView({
  downloadFormats: ["png", "svg"]
});

const formatters = {
  Index: n => (typeof n === "number" ? n.toFixed(3) : n || " "),
  "Metric Ton": n => `${n.toFixed()} 📦`,
  Sheep: n => `🐑 ${n.toFixed()}`
};

const locales = Object.keys(translations);

const container = document.getElementById("app");
container && mount(container);

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  label: string;
  hex: string;
}

const ColorElement = forwardRef<HTMLDivElement, ItemProps>(({hex, label, ...others}, ref) => {
  return (
    <div ref={ref} {...others}>
      <Group noWrap>
        <Box sx={{background: hex, height: 15, width: 15, borderRadius: 15}} />
        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  );
});
function SiteSettings({
  primaryColor,
  setPrimaryColor,
  toggleColorScheme,
  direction,
  setDirection,
  locales,
  locale,
  setLocale
}) {
  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();

  const data = Object.keys(theme.colors).map(c => ({
    label: c,
    value: c,
    hex: theme.colors[c][theme.fn.primaryShade()]
  }));

  const position =
    direction === "ltr" ? {top: "0.65rem", right: "0.5rem"} : {top: "0.65rem", left: "0.5rem"};

  return (
    <>
      <Dialog
        w={250}
        opened={opened}
        position={position}
        onClose={() => setOpened(false)}
        withCloseButton
      >
        <Text fw={700}>Settings</Text>
        <Divider label="Text" labelPosition="center" />
        <Group position="apart">
          <Text size="xs" fw={500}>
            Direction
          </Text>
          <ActionIcon onClick={() => setDirection(d => (d === "rtl" ? "ltr" : "rtl"))}>
            {direction === "ltr" ? <IconTextDirectionLtr /> : <IconTextDirectionRtl />}
          </ActionIcon>
        </Group>

        <Group position="apart">
          <Text size="xs" fw={500}>
            Language
          </Text>
          <Select
            size="xs"
            icon={<IconLanguage size="0.9rem" />}
            value={locale}
            w={120}
            data={locales}
            onChange={setLocale}
          />
        </Group>

        <Divider label="Theme" labelPosition="center" />

        <Group position="apart">
          <Text size="xs" fw={500}>
            Color
          </Text>
          <Select
            size="xs"
            icon={
              <Box
                sx={{
                  background: theme.colors[theme.primaryColor][theme.fn.primaryShade()],
                  height: 15,
                  width: 15,
                  borderRadius: 15
                }}
              />
            }
            value={primaryColor || "blue"}
            w={120}
            itemComponent={ColorElement}
            data={data}
            onChange={setPrimaryColor}
          />
        </Group>

        <Group position="apart">
          <Text size="xs" fw={500}>
            Theme
          </Text>
          <ActionIcon onClick={() => toggleColorScheme()}>
            {theme.colorScheme === "dark" ? <IconSun /> : <IconMoon />}
          </ActionIcon>
        </Group>
      </Dialog>
      <ActionIcon onClick={() => setOpened(v => !v)}>
        <IconSettings />
      </ActionIcon>
    </>
  );
}
function SettingsProvider({children, locales, locale, setLocale}) {
  const [primaryColor, setPrimaryColor] = useState("blue");
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  const toggleColorScheme = value =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  const theme: MantineThemeOverride = useMemo(
    () => ({
      primaryColor,
      colorScheme,
      dir: direction,
      emotionCache: direction === "rtl" ? rtlCache : undefined
    }),
    [primaryColor, colorScheme, direction]
  );

  useEffect(() => {
    document.querySelector("html")?.setAttribute("dir", direction);
  }, [direction]);

  return (
    <MantineProvider inherit withNormalizeCSS withGlobalStyles theme={theme}>
      <Header height={{base: 50}} p="md">
        <Flex
          align="center"
          justify="space-between"
          p={"xs"}
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            padding: 5,
            justifyContent: "space-between"
          }}
        >
          <HomeSVG />
          <SiteSettings
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            toggleColorScheme={toggleColorScheme}
            direction={direction}
            setDirection={setDirection}
            locales={locales}
            locale={locale}
            setLocale={setLocale}
          />
        </Flex>
      </Header>

      {children}
    </MantineProvider>
  );
}

function App() {
  const [locale, setLocale] = useState(locales[0]);
  return (
    <SettingsProvider locales={locales} locale={locale} setLocale={setLocale}>
      <Explorer
        source={process.env.TESSERACT_SERVER}
        defaultCube="gastat_gdp"
        formatters={formatters}
        dataLocale={"en,ar"}
        previewLimit={75}
        height={"calc(100vh - 50px)"}
        panels={[
          {key: "table", label: "Data Table", component: TableView},
          {key: "matrix", label: "Pivot Table", component: PivotView},
          {key: "vizbuilder", label: "Vizbuilder", component: VizbuilderView}
        ]}
        translations={translations}
        uiLocale={locale}
        defaultOpenParams="drilldowns"
        withinMantineProvider={false}
        withinReduxProvider
        withMultiQuery
        withPermalink
      />
    </SettingsProvider>
  );
}
/** */
function mount(container) {
  const root = createRoot(container);

  root.render(<App />);
}
