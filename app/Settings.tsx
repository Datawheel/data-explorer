import {
  ActionIcon,
  Box,
  Dialog,
  Divider,
  Flex,
  Group,
  Header,
  MantineProvider,
  type MantineThemeOverride,
  Select,
  Text,
  createEmotionCache,
  useMantineTheme
} from "@mantine/core";
import {
  IconLanguage,
  IconMoon,
  IconSettings,
  IconSun,
  IconTextDirectionLtr,
  IconTextDirectionRtl
} from "@tabler/icons-react";
import React, {forwardRef, useCallback, useEffect, useMemo, useReducer, useState} from "react";
import rtlPlugin from "stylis-plugin-rtl";
import {HomeSVG} from "../src/components/icons";

export type ServerOption = {
  value: string;
  label: string;
  config?: RequestInit;
};

interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  label: string;
  hex: string;
}

interface SettingsParams {
  primaryColor: string;
  direction: "rtl" | "ltr";
  colorScheme: "light" | "dark";
  locale: string;
  server: ServerOption;
}

const rtlCache = createEmotionCache({
  key: "mantine-rtl",
  stylisPlugins: [rtlPlugin]
});

export function SettingsProvider({
  children,
  locales,
  servers
}: {
  children: (settings: SettingsParams) => JSX.Element;
  locales: string[];
  servers: ServerOption[];
}) {
  const [settings, setSettings] = useReducer(
    (state: SettingsParams, action: Partial<SettingsParams>) => ({...state, ...action}),
    {
      primaryColor: "blue",
      direction: "ltr",
      colorScheme: "light",
      locale: "en",
      server: servers[0]
    }
  );
  const {primaryColor, colorScheme, direction, server} = settings;

  const selectServer = useCallback(
    (value: string | null) => {
      const nextLocation = `${window.location.pathname}`;
      window.history.pushState({}, "", nextLocation);
      const server = servers.find(item => item.value === value);
      server && setSettings({server});
    },
    [servers]
  );

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
          <Group>
            <Select data={servers} value={server.value} onChange={selectServer} />
            <SiteSettings locales={locales} settings={settings} setSettings={setSettings} />
          </Group>
        </Flex>
      </Header>

      {children(settings)}
    </MantineProvider>
  );
}

function SiteSettings({
  locales,
  settings,
  setSettings
}: {
  locales: string[];
  settings: SettingsParams;
  setSettings: React.Dispatch<Partial<SettingsParams>>;
}) {
  const {colorScheme, direction, locale, primaryColor} = settings;

  const [opened, setOpened] = useState(false);
  const theme = useMantineTheme();

  const data = Object.keys(theme.colors).map(c => ({
    label: c,
    value: c,
    hex: theme.colors[c][theme.fn.primaryShade()]
  }));

  const position =
    direction === "ltr" ? {top: "0.65rem", right: "0.5rem"} : {top: "0.65rem", left: "0.5rem"};

  const setDirection = useCallback(
    evt => setSettings({direction: direction === "rtl" ? "ltr" : "rtl"}),
    [setSettings, direction]
  );

  const setLocale = useCallback(
    (value: string | null) => value && setSettings({locale: value}),
    [setSettings]
  );

  const setPrimaryColor = useCallback(
    (value: string | null) => value && setSettings({primaryColor: value}),
    [setSettings]
  );

  const toggleColorScheme = useCallback(
    evt => setSettings({colorScheme: colorScheme === "dark" ? "light" : "dark"}),
    [setSettings, colorScheme]
  );

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
          <ActionIcon onClick={setDirection}>
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
          <ActionIcon onClick={toggleColorScheme}>
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
