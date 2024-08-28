import React, { ReactNode, useEffect, useState, useRef } from "react";
import { Text, UnstyledButton, Group, Sx, TextInput, Box } from "@mantine/core";
import { ClearSVG, FullScreenSVG, SearchSVG } from "./icons";
import { MRT_TableInstance } from "mantine-react-table";
import { useDebouncedValue } from "@mantine/hooks";
import { useTranslation } from "../main";

const toolbarSx: Sx = (t) => ({
    background: t.colorScheme === "dark" ? t.black: t.white,
    borderRadius: t.radius.xl,
})

interface ToolBarButtonProps {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
}

function ToolbarButton ({icon, label, onClick = () => undefined}: ToolBarButtonProps) {
    return (
        <UnstyledButton onClick={onClick} sx={t => ({"& svg path": {stroke: t.colorScheme === "dark" ? "white": "black"}})}>
            <Group spacing={"xs"} noWrap>
                {icon}
                <Text size="sm">{label}</Text>
            </Group>
        </UnstyledButton>
    )
}

function ToolbarSearch ({table}: {table: MRT_TableInstance}) {
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
        setQuery("")
        setGlobalFilter("")
    }

    const handleShowFilter = (show: boolean) => {
        setShowGlobalFilter(show);
        if (show) setTimeout(() => inputRef.current?.focus(), 100);
    }

    return (
        <Group position="left">
            <ToolbarButton
                icon={<ClearSVG />}
                label={t("params.label_clear")}
                onClick={handleClear}
            />
            <ToolbarButton
                icon={<SearchSVG />}
                label={t("params.label_search")}
                onClick={() => handleShowFilter(!showGlobalFilter)}
            />
            <Box
                w={showGlobalFilter ? 120: 0}
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
           
        </Group>
    )
}
export default function Toolbar({table, fullscreen}: {table: MRT_TableInstance, fullscreen: {toggle: () => void; fullscreen: boolean}}) {
    const {translate: t} = useTranslation();
    return (
      <Group sx={toolbarSx} p="0.325rem" px="md" noWrap>
        <ToolbarSearch table={table} />
        <ToolbarButton icon={<FullScreenSVG />} label={t("params.label_fullscreen")} onClick={fullscreen.toggle}/>
      </Group>
    )
  }