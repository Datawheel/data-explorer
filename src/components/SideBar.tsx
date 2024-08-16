import React, {PropsWithChildren, useState, useMemo, useEffect} from "react";
import {Box, Flex, ActionIcon, Text, ScrollArea, Input, Group, Title} from "@mantine/core";
import {createContext} from "../utils/create-context";
import {IconSearch} from "@tabler/icons-react";
import {DataSetSVG, IconChevronLeft, IconChevronRight} from "./icons";
import {selectLocale} from "../state/queries";
import Graph from "../utils/graph";
import {useSelector} from "react-redux";
import {getKeys} from "./SelectCubes";
import {AnnotatedCube} from "./SelectCubes";
import { LocaleSelector } from "./LocaleSelector";
import {useTranslation} from "../hooks/translation";
import {selectOlapCube} from "../state/selectors";

type SidebarProviderProps = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  graph: Graph;
  setGraph: React.Dispatch<React.SetStateAction<Graph>>;
  setResults: React.Dispatch<React.SetStateAction<string[]>>;
  results: string[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  map: Map<string, string[]> | undefined;
  setMap: React.Dispatch<React.SetStateAction<Map<string, string[]> | undefined>>;
  resetGraph: () => void;
};

export const [useSideBar, Provider] =
  createContext<PropsWithChildren<SidebarProviderProps>>("SideBar");

export function SideBarProvider(props: PropsWithChildren<{}>) {
  const [input, setInput] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [results, setResults] = useState<string[]>([]);
  const [map, setMap] = useState<Map<string, string[]>>();
  const [graph, setGraph] = useState(new Graph());

  const resetGraph = () => {
    setGraph(new Graph());
  };

  return (
    <Provider
      {...props}
      value={{
        expanded,
        setExpanded,
        graph,
        setGraph,
        results,
        setResults,
        input,
        map,
        setMap,
        setInput,
        resetGraph
      }}
    />
  );
}

type SidebarProps = {};

function SideBar(props: PropsWithChildren<SidebarProps>) {
  const {expanded, setExpanded} = useSideBar();

  return (
    <Box
      py="md"
      sx={t => ({
        height: "calc(100vh - 75px)",
        backgroundColor: t.colorScheme === "dark" ? t.colors.dark[8]:  t.colors.gray[2],
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        maxWidth: 300,
        padding: 0,
      })}
    >
      <Flex h="100%" direction="column" justify="flex-start">
        <Box px="sm">
          <Flex direction="column" sx={{flex: 1}}>
            <Flex align="center" justify="center">
              <ActionIcon
                onClick={() => setExpanded(!expanded)}
                variant="subtle"
                sx={t => ({alignSelf: "center", color: t.colorScheme === "dark" ? t.white: t.colors.gray[7]})}
              >
                <DataSetSVG />
              </ActionIcon>
              <Group
                position="apart"
                noWrap
                sx={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: expanded ? 300 : 0,
                }}>
                <Text sx={t => ({color: t.colorScheme === "dark" ? t.white: t.black})} ml={"sm"}>
                  Select Dataset
                </Text>
                <LocaleSelector />
              </Group>
            </Flex>
            <Box my="md">
              <Auto />
            </Box>
            <Box sx={{flexGrow: 1}}></Box>
            
          </Flex>
        </Box>
        <ScrollArea sx={theme => (
          {
            borderTopColor: theme.colorScheme === "dark" ? theme.colors.dark[6] :theme.colors.gray[3],
            borderTopWidth: "1px",
            borderTopStyle: expanded ? "solid": "none"
          }
          )}>
          <Box h={expanded ? "auto": "0px"}>{props.children}</Box>
        </ScrollArea>
        <Group
          align="center"
          position={expanded ? "right": "center"}
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
  const {code: locale} = useSelector(selectLocale);
  const {expanded, graph, setResults, input, setInput, setMap} = useSideBar();
  const items = graph.items;
  const roots = useMemo(() => getKeys(items as AnnotatedCube[], "topic", locale), [items]);

  useEffect(() => {
    if (graph.items.length > 0) {
      let matches: string[] = [];
      let maps = new Map();
      roots.forEach(root => {
        const {matches: result, map} = graph.filter(locale, root, input);
        matches = [...matches, ...result];
        maps = new Map([...maps, ...map]);
      });
      setResults(matches);
      setMap(maps);
    }
  }, [input, graph]);

  return (
    <Box>
      <Input
        icon={<IconSearch />}
        radius="xl"
        size="md"
        placeholder="Search"
        value={input}
        onInput={e => setInput(e.currentTarget.value)}
        styles={{
          wrapper: {
            whiteSpace: "nowrap",
            width: expanded ? "100%" : 0,
            overflow: "hidden",
            animation: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          },
          input: {
            whiteSpace: "nowrap",
            width: expanded ? "100%" : 0,
            overflow: "hidden",
          },
        }}
      />
    </Box>
  );
}
