import React from "react";
import {ActionIcon, Flex, Text, useMantineTheme, Button, Group} from "@mantine/core";
import {useTranslation} from "../hooks/translation";
import {IconCopy, IconDownload} from "@tabler/icons-react";
import type {ViewProps} from "../main";
import type {MRT_TableInstance} from "mantine-react-table";
import {MRT_TablePagination} from "mantine-react-table";

type TData = Record<string, any> & Record<string, string | number>;
type Props = {table: MRT_TableInstance<TData>} & Pick<ViewProps, "result">;

function TableFooter(props: Props) {
  const {result, table} = props;
  const {translate: t} = useTranslation();
  const theme = useMantineTheme();

  return (
    <Flex sx={{alignSelf: "end"}} align="center">
      <Text c="dimmed">{t("results.count_rows", {n: result.data.length})}</Text>
      <MRT_TablePagination table={table} />
      {/* <ActionIcon>
        <IconDownload size={35} color={theme.colors[theme.primaryColor][5]} />
      </ActionIcon> */}
      <ApiAndCsvButtons />
    </Flex>
  );
}

const ApiAndCsvButtons: React.FC = () => {
  return (
    <Group spacing="sm">
      <Button
        variant="filled"
        color="dark"
        leftIcon={<IconCopy size={20} />}
        sx={{height: 30, backgroundColor: "#5A5A5A"}}
      >
        API
      </Button>
      <Button
        variant="filled"
        color="dark"
        leftIcon={<IconDownload size={20} />}
        sx={{height: 30, backgroundColor: "#5A5A5A"}}
      >
        CSV
      </Button>
    </Group>
  );
};

export default TableFooter;
