import React, { PropsWithChildren, useState } from "react";
import { Box, Flex, ActionIcon, Text, Autocomplete, ScrollArea } from "@mantine/core";
import { createContext } from "../utils/create-context";
import { IconSearch } from "@tabler/icons-react";
import { DataSetSVG, IconChevronLeft, IconChevronRight } from "./icons";

type SidebarProviderProps = {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};

const [useSideBar, Provider] = createContext<PropsWithChildren<SidebarProviderProps>>("SideBar");

export function SideBarProvider(props: PropsWithChildren<{}>) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return <Provider {...props} value={{ expanded, setExpanded }} />;
}

type SidebarProps = {};

function SideBar(props: PropsWithChildren<SidebarProps>) {
  const { expanded, setExpanded } = useSideBar();

  return (
    <Box
      p="md"
      sx={t => ({
        height: "calc(100vh - 50px)",
        border: "1px solid",
        backgroundColor: t.colors.gray[2],
        borderColor: t.colors.gray[1],
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
      })}
    >
      <Flex h="100%" direction="column" justify="space-between">
        <ScrollArea>
          <Box py="sm">
            <Flex direction="column" sx={{ flex: 1 }}>
              <Flex align="center" my="sm">
                <ActionIcon
                  onClick={() => setExpanded(!expanded)}
                  variant="subtle"
                  sx={t => ({ alignSelf: "center", color: t.colors.gray[7] })}
                >
                  <DataSetSVG />
                </ActionIcon>
                <Text
                  ml="sm"
                  sx={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: expanded ? 370 : 0
                  }}
                >
                  Select Dataset
                </Text>
              </Flex>
              <Box my="md">
                <Auto />
              </Box>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Box my="sm">{props.children}</Box>
            </Flex>
          </Box>
        </ScrollArea>
        <ActionIcon
          onClick={() => setExpanded(!expanded)}
          variant="subtle"
          sx={t => ({ alignSelf: "center", color: t.colors.gray[7] })}
        >
          {expanded ? <IconChevronLeft /> : <IconChevronRight />}
        </ActionIcon>
      </Flex>
    </Box>
  );
}

export default SideBar;

type SideBarItemPropos = {};
export function SideBarItem({ children }: PropsWithChildren<SideBarItemPropos>) {
  const { expanded } = useSideBar();

  return (
    <Box
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",

        width: expanded ? 400 : 0,
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      {children}
    </Box>
  );
}

function Auto() {
  const { expanded } = useSideBar();
  return (
    <Box>
      <Autocomplete
        icon={<IconSearch />}
        radius="xl"
        size="md"
        placeholder="Search"
        data={["React", "Angular", "Svelte", "Vue"]}
        sx={t => ({
          overflow: "hidden",
          whiteSpace: "nowrap",
          width: expanded ? 400 : 0,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        })}
      />
    </Box>
  );
}
