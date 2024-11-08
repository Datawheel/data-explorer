import React, {type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {useActions, useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {IconCopy, IconDotsVertical, IconDownload} from "@tabler/icons-react";
import type {ViewProps} from "../main";
import type {MRT_PaginationState, MRT_TableInstance} from "mantine-react-table";
import {MRT_TablePagination} from "mantine-react-table";
import {useClickOutside, useClipboard} from "@mantine/hooks";
// import {selectServerFormatsEnabled} from "../state/server";
import {ActionIcon, Box, Button, Flex, Group, Loader, Menu, Text} from "@mantine/core";
import {TesseractFormat} from "../api";
import {useAsync} from "../hooks/useAsync";
import {selectLoadingState} from "../state/loading";
import {SelectObject} from "./Select";
import type {FileDescriptor} from "../utils/types";
import CubeSource from "./CubeSource";
import { LocaleSelector } from "./LocaleSelector";

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

type TData = Record<string, any> & Record<string, string | number>;

type Props = {table: MRT_TableInstance<TData>} & Pick<ViewProps, "result"> & {
    data?: Record<string, string | number>[];
    isLoading: boolean;
    pagination?: MRT_PaginationState;
    setPagination?: React.Dispatch<React.SetStateAction<MRT_PaginationState>>;
  };

type Item = {
  value: number;
  label: string;
};

function TableFooter(props: Props) {
  const loading = useSelector(selectLoadingState);
  const {paginationConfig} = useSettings();
  const {result, table, data = [], isLoading, pagination, setPagination} = props;
  const {translate: t} = useTranslation();
  const {url} = result;

  const {copy, copied} = useClipboard({timeout: 1000});
  const copyHandler = useCallback(() => copy(url), [url]);

  const totalRowCount = table.options.rowCount;
  const {
    pagination: {pageSize}
  } = table.getState();
  const showPagination = totalRowCount && Boolean(totalRowCount > pageSize);
  return (
    <Box w="100%" sx={{flex: "0 0 70px"}}>
      <Flex
        p="md"
        justify="space-between"
        align="center"
        direction={{base: "column-reverse", md: "row"}}
        gap="sm"
      >
        <CubeSource />
        {!loading.loading && !isLoading && (
          <Group position="right" spacing="sm">
            <LocaleSelector />
            <Box maw="7rem" miw={"fit"}>
              <SelectObject
                getValue={(item: Item) => item.value}
                getLabel={(item: Item) => item.label}
                items={paginationConfig.rowsLimits.map(value => ({value, label: String(value)}))}
                selectedItem={{value: pagination?.pageSize}}
                onItemSelect={(item: Item) =>
                  setPagination && setPagination({pageIndex: 0, pageSize: item.value})
                }
              />
            </Box>
            {totalRowCount && (
              <Text c="dimmed">
                {t("results.count_rows_plural", {n: formatter.format(totalRowCount)})}
              </Text>
            )}
            {showPagination && <MRT_TablePagination table={table} />}
            <ApiAndCsvButtons copied={copied} copyHandler={copyHandler} url={url} data={data} />
          </Group>
        )}
      </Flex>
    </Box>
  );
}

type ApiAndCsvButtonsProps = {
  copied: boolean;
  copyHandler: () => void;
  url: string;
  data: Record<string, string | number>[];
};
const ApiAndCsvButtons: React.FC<ApiAndCsvButtonsProps> = props => {
  const {copied, copyHandler, url, data} = props;
  const {translate: t} = useTranslation();
  return (
    <Box id="query-results-debug-view">
      <Group spacing="xs">
        {url && (
          <Button
            id="dex-api-btn"
            variant="subtle"
            leftIcon={<IconCopy size={20} />}
            sx={{height: 30}}
            onClick={copyHandler}
          >
            {copied ? t("action_copy_done") : t("action_copy")} API
          </Button>
        )}
        <DownloadQuery data={data} />
      </Group>
    </Box>
  );
};

const DownloadQuery = ({data}) => {
  const actions = useActions();
  const {translate: t} = useTranslation();
  const formats = Object.values(TesseractFormat);
  // const {isDirty, result} = useSelector(selectCurrentQueryItem);
  const components: ReactNode[] = [];

  components.push(
    <ButtonDownload
      variant="light"
      leftIcon={<IconDownload size={20} />}
      sx={{height: 30}}
      key="download_csv"
      provider={() => actions.willDownloadQuery("csv")}
    >
      {t("formats.csv")}
    </ButtonDownload>
  );

  if (components.length === 0 || data.length === 0) {
    return null;
  }

  return (
    <Box id="dex-btn-group-download">
      <Group spacing={"xs"}>
        {components}
        <MenuOpts formats={formats.filter(f => f !== "csv")} />
      </Group>
    </Box>
  );
};

const mimeTypes = {
  csv: "text/csv",
  json: "application/json",
  tsv: "text/tab-separated-values",
  txt: "text/plain",
  xls: "application/vnd.ms-excel"
};

function useDownload(props) {
  const {provider} = props;
  const {run, data: file, error, isLoading} = useAsync<FileDescriptor>();

  useEffect(() => {
    if (file) {
      const blob =
        typeof file.content !== "string"
          ? file.content
          : new window.Blob([file.content], {
              type: mimeTypes[file.extension] || "application/octet-stream"
            });
      
      const blobURL = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobURL;
      anchor.download = `${file.name}.${file.extension}`;
      anchor.addEventListener(
        "click",
        () => {
          setTimeout(() => {
            window.URL.revokeObjectURL(blobURL);
          }, 5000);
        },
        false
      );
      anchor.click();
    }
  }, [file]);

  const onClick = useCallback(
    evt => {
      evt.stopPropagation();
      evt.preventDefault();
      return run(provider());
    },
    [run]
  );

  return {onClick, isLoading, data: file, error};
}

const ButtonDownload = props => {
  const {provider, ...buttonProps} = props;
  const {onClick, isLoading} = useDownload({provider});
  return (
    <Button {...buttonProps} onClick={onClick} loading={isLoading}>
      <Text fz="sm">{props.children}</Text>
    </Button>
  );
};

const ItemDownload = props => {
  const {provider, icon, setOpened, ...itemProps} = props;
  const {onClick, isLoading} = useDownload({provider});
  return (
    <Menu.Item
      {...itemProps}
      icon={icon(isLoading)}
      onClick={e => {
        e.preventDefault();
        onClick(e).then(() => {
          setOpened(false);
        });
      }}
    >
      <Text fz="sm">{props.children}</Text>
    </Menu.Item>
  );
};

type MenuOptsProps = {
  formats: TesseractFormat[];
};
function MenuOpts({formats}: MenuOptsProps) {
  const actions = useActions();
  const {translate: t} = useTranslation();
  const [opened, setOpened] = useState(false);
  const ref = useClickOutside(() => setOpened(false));

  const buttons = useMemo(
    () =>
      formats.map(format => (
        <ItemDownload
          component="a"
          key={format}
          provider={() => actions.willDownloadQuery(format)}
          icon={loading => (loading ? <Loader size={15} /> : <IconDownload size={15} />)}
          setOpened={setOpened}
        >
          <Text size={"xs"}>{t(`formats.${format}`)}</Text>
        </ItemDownload>
      )),
    [formats, t]
  );
  return (
    <Menu shadow="md" width={200} opened={opened}>
      <Menu.Target>
        <ActionIcon
          onClick={() => setOpened(o => !o)}
          variant="filled"
          color="gray"
          sx={{
            width: 20,
            minWidth: 0
          }}
        >
          <IconDotsVertical size="0.8rem" />
        </ActionIcon>
        {/* <Button
          onClick={() => setOpened(o => !o)}
          variant="filled"
          color="dark"
          sx={{height: 30, backgroundColor: "#5A5A5A"}}
        >
          All
        </Button> */}
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("params.title_downloaddata")}</Menu.Label>
        <div ref={ref}>{buttons}</div>
      </Menu.Dropdown>
    </Menu>
  );
}

export default TableFooter;
