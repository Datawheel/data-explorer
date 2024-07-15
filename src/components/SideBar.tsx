import React, {PropsWithChildren, useState, useMemo, useEffect} from "react";
import {Box, Flex, ActionIcon, Text, Autocomplete, ScrollArea, Select, Input} from "@mantine/core";
import {createContext} from "../utils/create-context";
import {IconSearch} from "@tabler/icons-react";
import {DataSetSVG, IconChevronLeft, IconChevronRight} from "./icons";
import {selectLocale} from "../state/queries";
import Graph from "../utils/graph";
import {useSelector} from "react-redux";
import {getKeys} from "./SelectCubes";
import {AnnotatedCube} from "./SelectCubes";

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
};

export const [useSideBar, Provider] =
  createContext<PropsWithChildren<SidebarProviderProps>>("SideBar");

export function SideBarProvider(props: PropsWithChildren<{}>) {
  const [input, setInput] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [results, setResults] = useState<string[]>([]);
  const [map, setMap] = useState<Map<string, string[]>>();
  const [graph, setGraph] = useState(new Graph());

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
        setInput
      }}
    />
  );
}

type SidebarProps = {};

function SideBar(props: PropsWithChildren<SidebarProps>) {
  const {expanded, setExpanded} = useSideBar();

  return (
    <Box
      p="md"
      sx={t => ({
        height: "calc(100vh - 50px)",
        border: "1px solid",
        backgroundColor: t.colors.gray[2],
        borderColor: t.colors.gray[1],
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        maxWidth: 375
      })}
    >
      <Flex h="100%" direction="column" justify="space-between">
        <ScrollArea>
          <Box py="sm">
            <Flex direction="column" sx={{flex: 1}}>
              <Flex align="center" my="sm">
                <ActionIcon
                  onClick={() => setExpanded(!expanded)}
                  variant="subtle"
                  sx={t => ({alignSelf: "center", color: t.colors.gray[7]})}
                >
                  <DataSetSVG />
                </ActionIcon>
                <Text
                  ml="sm"
                  sx={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: expanded ? 300 : 0
                  }}
                >
                  Select Dataset
                </Text>
              </Flex>
              <Box my="md">
                <Auto />
              </Box>
              <Box sx={{flexGrow: 1}}></Box>
              <Box my="sm">{props.children}</Box>
            </Flex>
          </Box>
        </ScrollArea>
        <ActionIcon
          onClick={() => setExpanded(!expanded)}
          variant="subtle"
          sx={t => ({alignSelf: "center", color: t.colors.gray[7]})}
        >
          {expanded ? <IconChevronLeft /> : <IconChevronRight />}
        </ActionIcon>
      </Flex>
    </Box>
  );
}

export default SideBar;

type SideBarItemPropos = {};
export function SideBarItem({children}: PropsWithChildren<SideBarItemPropos>) {
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
        sx={t => ({
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: expanded ? 300 : 0,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        })}
      />
    </Box>
  );
}
