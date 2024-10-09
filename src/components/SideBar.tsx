import React, {PropsWithChildren, useState} from "react";
import {Box, Flex, ActionIcon, Text, ScrollArea, Input, Group, MantineTheme, useMantineTheme, Affix, ActionIconProps, Sx, packSx} from "@mantine/core";
import {CloseButton} from "@mantine/core";
import {createContext} from "../utils/create-context";
import {IconSearch} from "@tabler/icons-react";
import {DataSetSVG, IconChevronLeft, IconChevronRight} from "./icons";
import Graph from "../utils/graph";
import {LocaleSelector} from "./LocaleSelector";
import {useTranslation} from "../hooks/translation";
import {useDebouncedState, useMediaQuery} from "@mantine/hooks";
import useBuildGraph from "../hooks/buildGraph";
import useCubeSearch from "../hooks/cubeSearch";

type SidebarProviderProps = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  graph: Graph;
  results: string[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  map: Map<string, string[]> | undefined;
};

export const [useSideBar, Provider] =
  createContext<PropsWithChildren<SidebarProviderProps>>("SideBar");

export function SideBarProvider(props: PropsWithChildren<{}>) {
  const [input, setInput] = useDebouncedState<string>("", 200);
  const [expanded, setExpanded] = useState<boolean>(true);

  const graph = useBuildGraph();
  const {results, map} = useCubeSearch(input, graph);

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
        setInput,
      }}
    />
  );
}

type SidebarProps = {};

function SideBarControlBtn ({actionIconProps = {}}: {actionIconProps?: Partial<ActionIconProps>}) {
  const {expanded, setExpanded} = useSideBar();
  
  const sx: Sx = (t: MantineTheme) => ({
    alignSelf: "center",
    color: t.colorScheme === "dark" ? t.white : t.colors.gray[7],
    
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
)
}

function SideBarControlBtnFixed () {
  const actionIconProps: Partial<ActionIconProps> = {
    sx: t => ({
      backgroundColor: `${t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1]} !important`,
      padding: `calc(${t.spacing.xs} / 2)`,
      borderRadius: t.radius.xl,
      width: 50,
      height: 50
    })
  }
  return (
    <Affix position={{left: "1rem", bottom: 150}}>
      <SideBarControlBtn actionIconProps={actionIconProps}/>
    </Affix>
  )
}
function SideBar(props: PropsWithChildren<SidebarProps>) {
  const {expanded, setExpanded} = useSideBar();
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();
  const smallerThanMd = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  console.log(smallerThanMd)
  return (
    <>
      {smallerThanMd && <SideBarControlBtnFixed />}
      <Box
        id="dex-sidebar"
        py="md"
        sx={t => ({
          height: "calc(100vh - 50px)",
          backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8] : t.colors.gray[1],
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          maxWidth: expanded ? 300 : 54,
          padding: 0,
          zIndex: 99,
          boxSizing: "border-box",
          [t.fn.smallerThan("md")]: {
            position: "absolute",
            width: expanded ? 300 : 0,
            height: expanded ? "calc(100vh - 50px)" : 0,
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
                  <LocaleSelector />
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
                <Auto  />
              </Box>
              <Box sx={{flexGrow: 1}}></Box>
            </Flex>
          </Box>
          <ScrollArea
            sx={theme => ({
              borderTopColor:
                theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[3],
              borderTopWidth: "1px",
              borderTopStyle: expanded ? "solid" : "none"
            })}
          >
            <Box h={expanded ? "auto" : "0px"}>{props.children}</Box>
          </ScrollArea>
          <Group
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
              sx={t => ({alignSelf: "flex-end", color: t.colors.gray[7]})}
            >
              {expanded ? <IconChevronLeft /> : <IconChevronRight />}
            </ActionIcon>
          </Group>
        </Flex>
      </Box>
    </>
  );
}

export default SideBar;

type SideBarItemProps = {};
export function SideBarItem({children}: PropsWithChildren<SideBarItemProps>) {
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
      {children}
    </Box>
  );
}

function Auto() {
  const {translate: t} = useTranslation();
  const {expanded, input, setInput} = useSideBar();

  return (
    <Input
      icon={<IconSearch />}
      radius="xl"
      size="md"
      placeholder={t("params.label_search")}
      defaultValue={input}
      onInput={e => setInput(e.currentTarget.value)}
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
          onClick={() => setInput("")}
          style={{display: input ? undefined : "none"}}
        />
      }
    />
  );
}
