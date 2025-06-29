import React, {ReactNode, useEffect, useState, useRef} from "react";
import {
  Text,
  UnstyledButton,
  Group,
  Sx,
  TextInput,
  Box,
  Flex,
  Menu,
  ActionIcon,
  useMantineTheme
} from "@mantine/core";
import {ClearSVG, FullScreenSVG, SearchSVG} from "./icons";
import {MRT_TableInstance} from "mantine-react-table";
import {useDebouncedValue, useMediaQuery} from "@mantine/hooks";
import {useTranslation} from "../hooks/translation";
import {useSettings} from "../hooks/settings";
import {IconHelpCircle, IconQuestionMark, IconSettings} from "@tabler/icons-react";
import {useTour} from "@reactour/tour";

const toolbarSx: Sx = t => ({
  background: t.colorScheme === "dark" ? t.black : t.white,
  borderRadius: t.radius.xl,
  height: "fit-content",
  svg: {
    height: 15
  }
});

interface ToolBarButtonProps {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
}

export interface ToolbarConfigType {
  buttons: ToolBarButtonProps[];
  showLabels: Boolean;
}

export function ToolbarButton({icon, label, onClick = () => undefined}: ToolBarButtonProps) {
  const {toolbarConfig} = useSettings();
  return (
    <UnstyledButton
      onClick={onClick}
      py={{base: "0.2rem", md: 0}}
      sx={t => ({"& svg path": {stroke: t.colorScheme === "dark" ? "white" : "black"}})}
    >
      <Group spacing={"xs"} noWrap>
        {icon}
        {toolbarConfig?.showLabels && label && (
          <Text size="sm" sx={{whiteSpace: "nowrap"}} color="dimmed">
            {label}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );
}

function ToolbarSearch({table}: {table: MRT_TableInstance}) {
  // MRT table store
  const {translate: t} = useTranslation();
  const {setShowGlobalFilter, setGlobalFilter} = table;
  const {showGlobalFilter} = table.getState();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>(table.getState().globalFilter);
  const [debouncedQuery] = useDebouncedValue(query, 200);

  useEffect(() => {
    setGlobalFilter(debouncedQuery);
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery("");
    setGlobalFilter("");
  };

  const handleShowFilter = (show: boolean) => {
    setShowGlobalFilter(show);
    if (show) setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Flex justify="flex-start" direction={{base: "column", md: "row"}} gap="xs">
      <ToolbarButton icon={<ClearSVG />} label={t("params.label_clear")} onClick={handleClear} />
      <ToolbarButton
        icon={<SearchSVG />}
        label={t("params.label_search")}
        onClick={() => handleShowFilter(!showGlobalFilter)}
      />
      <Box
        w={showGlobalFilter ? 120 : 0}
        h={showGlobalFilter ? "auto" : 0}
        sx={{
          transition: "width .2s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden"
        }}
      >
        <TextInput
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          size="xs"
          variant="filled"
          radius="xl"
        />
      </Box>
    </Flex>
  );
}

function TourButton() {
  const {setIsOpen, setCurrentStep} = useTour();
  const {translate: t} = useTranslation();
  const startTour = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };
  return (
    <ToolbarButton
      icon={<IconHelpCircle strokeWidth={1.5} />}
      label={t("tour.controls.help")}
      onClick={startTour}
    ></ToolbarButton>
  );
}
export default function Toolbar({
  table,
  fullscreen
}: {
  table: MRT_TableInstance;
  fullscreen: {toggle: () => void; fullscreen: boolean};
}) {
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanLg = useMediaQuery(
    `(max-width: ${theme.breakpoints.xs}${
      /(?:px|em|rem|vh|vw|%)$/.test(theme.breakpoints.xs) ? "" : "px"
    })`
  );

  const {toolbarConfig} = useSettings();

  const settings = (
    <Flex
      direction={{base: "column", xs: "row"}}
      justify={"flex-start"}
      sx={toolbarSx}
      p="0.25rem"
      px="md"
      wrap="nowrap"
      gap="xs"
    >
      {toolbarConfig?.buttons.map(b => (
        <ToolbarButton key={b.label} {...b} />
      ))}
      <TourButton />
      <ToolbarButton
        icon={<FullScreenSVG />}
        label={t("params.label_fullscreen")}
        onClick={fullscreen.toggle}
      />
    </Flex>
  );
  return smallerThanLg ? (
    <Menu>
      <Menu.Target>
        <ActionIcon size="md">
          <IconSettings />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>{settings}</Menu.Dropdown>
    </Menu>
  ) : (
    settings
  );
}
