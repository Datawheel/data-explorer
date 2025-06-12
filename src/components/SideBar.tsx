import React, {type PropsWithChildren, useState, useMemo, useRef, useCallback} from "react";
import {
  Box,
  Flex,
  ActionIcon,
  Text,
  ScrollArea,
  Group,
  type MantineTheme,
  useMantineTheme,
  Affix,
  type ActionIconProps,
  type Sx,
  packSx,
  TextInput
} from "@mantine/core";
import {CloseButton} from "@mantine/core";
import {createContext} from "../utils/create-context";
import {IconSearch, IconChevronLeft, IconChevronRight, IconX} from "@tabler/icons-react";
import {DataSetSVG} from "./icons";
import type Graph from "../utils/graph";
import {useTranslation} from "../hooks/translation";
import {useDebouncedState, useMediaQuery} from "@mantine/hooks";
import useBuildGraph from "../hooks/buildGraph";
import {useCubeSearch} from "../hooks/cubeSearch";

type SidebarContextProps = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  graph: Graph;
  results: string[];
  map: Map<string, string[]>;
};

export const [useSideBar, Provider] = createContext<SidebarContextProps>("SideBar");

export function SideBarProvider(props: PropsWithChildren<{locale: string}>) {
  const [input, setInput] = useDebouncedState<string>("", 150, {leading: true});
  const [expanded, setExpanded] = useState<boolean>(true);

  const graph = useBuildGraph(props.locale);
  const {results, map} = useCubeSearch(graph, input, props.locale);

  return (
    <Provider
      {...props}
      value={{
        expanded,
        graph,
        setExpanded,
        results,
        input,
        map,
        setInput
      }}
    />
  );
}

function SideBarControlBtn({actionIconProps = {}}: {actionIconProps?: Partial<ActionIconProps>}) {
  const {expanded, setExpanded} = useSideBar();

  const sx: Sx = (t: MantineTheme) => ({
    alignSelf: "center",
    color: t.colorScheme === "dark" ? t.white : t.colors.gray[7]
  });

  if (expanded) return null;

  return (
    <ActionIcon
      onClick={() => setExpanded(!expanded)}
      variant="subtle"
      {...actionIconProps}
      sx={[sx, ...packSx(actionIconProps.sx)]}
    >
      <DataSetSVG />
    </ActionIcon>
  );
}

function SideBar(props: PropsWithChildren<{}>) {
  const {expanded, input, setExpanded, setInput} = useSideBar();
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  return (
    <>
      <Box
        id="dex-sidebar"
        py="md"
        sx={t => ({
          height: "100%",
          backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1],
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          maxWidth: expanded ? 300 : 54,
          padding: 0,
          zIndex: 9,
          boxSizing: "border-box",
          [t.fn.smallerThan("md")]: {
            position: "absolute",
            width: expanded ? 300 : 0,
            height: expanded ? "100%" : 0,
            bottom: expanded ? "unset" : t.spacing.md,
            left: expanded ? "unset" : t.spacing.md,
            overflow: "hidden",
            paddingTop: expanded ? t.spacing.md : 0,
            paddingBottom: expanded ? t.spacing.md : 0,
            borderRadius: expanded ? 0 : "100%"
          }
        })}
      >
        <Flex h="100%" direction="column" justify="flex-start">
          <Box px="sm" my={"sm"}>
            <Flex direction="column" sx={{flex: 1}}>
              <Flex align="center" justify="apart">
                <SideBarControlBtn />
                <Group
                  position="apart"
                  align="center"
                  noWrap
                  sx={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition:
                      "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: expanded ? 300 : 0
                  }}
                >
                  <Text sx={t => ({color: t.colorScheme === "dark" ? t.white : t.black})} ml={"sm"}>
                    {t("params.label_dataset")}
                  </Text>
                  <ActionIcon
                    onClick={() => setExpanded(!expanded)}
                    variant="subtle"
                    mt="auto"
                    color="primaryColor"
                    sx={t => ({alignSelf: "flex-end"})}
                  >
                    {expanded ? (
                      smallerThanMd ? (
                        <IconX size="1.5rem" />
                      ) : (
                        <IconChevronLeft size="1.5rem" />
                      )
                    ) : (
                      <IconChevronRight size="1.5rem" />
                    )}
                  </ActionIcon>
                </Group>
              </Flex>
              <Box
                my="md"
                sx={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition:
                    "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: expanded ? "100%" : 0
                }}
              >
                <CubeSearchInput expanded={expanded} input={input} setInput={setInput} />
              </Box>
              <Box sx={{flexGrow: 1}}></Box>
            </Flex>
          </Box>
          <ScrollArea
            id="dex-select-cube-area"
            sx={theme => ({
              borderTopColor:
                theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3],
              borderTopWidth: "1px",
              borderTopStyle: expanded ? "solid" : "none"
            })}
          >
            <Box h={expanded ? "auto" : "0px"}>{props.children}</Box>
          </ScrollArea>
          {/* <Group
            align="center"
            position={expanded ? "right" : "center"}
            w="100%"
            p="md"
            sx={{alignSelf: "flex-end", marginTop: "auto"}}
            noWrap
          >
            <ActionIcon
              onClick={() => setExpanded(!expanded)}
              variant="subtle"
              mt="auto"
              color="primaryColor"
              sx={t => ({alignSelf: "flex-end"})}
            >
              {expanded ? <IconChevronLeft size="1.5rem" /> : <IconChevronRight size="1.5rem" />}
            </ActionIcon>
          </Group> */}
        </Flex>
      </Box>
    </>
  );
}

export default SideBar;

export function SideBarItem(props: PropsWithChildren<{}>) {
  const {expanded} = useSideBar();

  return (
    <Box
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        width: expanded ? 300 : 0,
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {props.children}
    </Box>
  );
}

function CubeSearchInput(props: Pick<SidebarContextProps, "expanded" | "input" | "setInput">) {
  const {expanded, input, setInput} = props;
  const {translate: t} = useTranslation();
  // const {expanded, input, setInput} = useSideBar();
  const [inputValue, setInputValue] = useState(input);

  return (
    <TextInput
      icon={<IconSearch />}
      id="dex-search"
      radius="xl"
      size="md"
      placeholder={t("params.label_search")}
      value={inputValue}
      onInput={e => {
        setInputValue(e.currentTarget.value);
        setInput(e.currentTarget.value);
      }}
      styles={{
        wrapper: {
          width: expanded ? "100%" : 0,
          overflow: "hidden",
          transition:
            "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        },
        input: {
          whiteSpace: "nowrap"
        }
      }}
      rightSection={
        <CloseButton
          aria-label="Clear input"
          onClick={() => {
            setInput("");
            setInputValue("");
          }}
          style={{display: input ? undefined : "none"}}
        />
      }
    />
  );
}
