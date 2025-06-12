import React, {type ReactNode, useCallback, useEffect, useMemo, useState} from "react";
import {useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconX,
  IconAlertCircle
} from "@tabler/icons-react";
import type {MRT_PaginationState, MRT_TableInstance} from "mantine-react-table";
import {MRT_TablePagination} from "mantine-react-table";
import {useClipboard} from "@mantine/hooks";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Loader,
  Menu,
  Text,
  Alert,
  Paper,
  Select
} from "@mantine/core";
import {Format} from "../api/enum";
import {useAsync} from "../hooks/useAsync";
import type {FileDescriptor} from "../utils/types";
import CubeSource from "./CubeSource";
import {LocaleSelector} from "./LocaleSelector";
import {useDownloadQuery} from "../hooks/useQueryApi";
import {useSelector} from "../state";
import {selectCurrentQueryItem} from "../state/queries";
import {useUpdateUrl} from "../hooks/permalink";

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0
});

type TData = Record<string, any> & Record<string, string | number>;

type Props = {
  table: MRT_TableInstance<TData>;
  data?: Record<string, string | number>[];
  isLoading: boolean;
  pagination?: MRT_PaginationState;
  setPagination: (pagination: MRT_PaginationState) => void;
  url: string;
};

type Item = {
  value: string;
  label: string;
};

function TableFooter(props: Props) {
  const {paginationConfig} = useSettings();
  const {table, data = [], isLoading, pagination, url} = props;

  const {translate: t} = useTranslation();
  const {copy, copied} = useClipboard({timeout: 1000});
  const copyHandler = useCallback(() => copy(url), [url]);
  const updateURL = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);

  const totalRowCount = table.options.rowCount;
  const {
    pagination: {pageSize}
  } = table.getState();
  const showPagination = totalRowCount && Boolean(totalRowCount > pageSize);

  const items = useMemo(
    () =>
      paginationConfig?.rowsLimits.map(size => ({
        value: String(size),
        label: String(size)
      })) ?? [],
    [paginationConfig?.rowsLimits]
  );

  const onItemSelect = useCallback(
    (item: Item) => {
      const newPageSize = Number(item.value);
      updateURL({
        ...queryItem,
        params: {
          ...queryItem.params,
          pagiOffset: 0,
          pagiLimit: newPageSize
        }
      });
    },
    [pagination]
  );

  return (
    <Box
      w="100%"
      sx={t => ({
        flex: "0 0 70px",
        maxWidth: "100vw",
        [t.fn.smallerThan("md")]: {
          flex: "0 0 180px"
        },
        [t.fn.smallerThan("xs")]: {
          flex: "0 0 200px"
        },
        [t.fn.smallerThan(345)]: {
          flex: "0 0 240px"
        }
      })}
    >
      <Flex
        id="dex-table-footer"
        px="sm"
        pt={{base: 0, xs: "sm"}}
        justify="space-between"
        align="flex-start"
        direction={{base: "column-reverse", xs: "row"}}
        gap="xs"
      >
        <CubeSource />
        {!isLoading && (
          <Flex
            justify={{base: "space-between", md: "flex-end"}}
            gap="xs"
            w="100%"
            direction={{base: "column", md: "row"}}
            align={{base: "flex-end", md: "flex-start", lg: "center"}}
          >
            <Box display={{base: "none", md: "block"}}>
              <LocaleSelector />
            </Box>

            <Flex align="center" direction={{base: "column", lg: "row"}} gap="xs">
              <Group display={{base: "none", md: "flex"}} noWrap>
                <Box maw="7rem" miw={"fit"} display={{base: "none", md: "block"}}>
                  <Select
                    data={items}
                    defaultValue={String(queryItem.params.pagiLimit)}
                    size="xs"
                    onChange={value => {
                      const item = items.find(i => i.value === value);
                      if (item) onItemSelect(item);
                    }}
                  />
                </Box>
                {totalRowCount && (
                  <Text
                    c="dimmed"
                    display={{base: "none", md: "block"}}
                    sx={{whiteSpace: "nowrap"}}
                  >
                    {t("results.count_rows_plural", {n: formatter.format(totalRowCount)})}
                  </Text>
                )}
              </Group>
              {showPagination && <MRT_TablePagination table={table} />}
            </Flex>
            <Group spacing={"xs"} position="right">
              <Box display={{base: "block", md: "none"}}>
                <LocaleSelector />
              </Box>
              <ApiAndCsvButtons copied={copied} copyHandler={copyHandler} url={url} data={data} />
            </Group>
          </Flex>
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
      <Group spacing="xs" noWrap>
        {url && (
          <Button
            id="dex-api-btn"
            leftIcon={<IconCopy size={20} />}
            sx={{height: 28}}
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
  const {translate: t} = useTranslation();
  const formats = Object.values(Format);
  const components: ReactNode[] = [];
  const {mutateAsync: downloadQuery, isError, error} = useDownloadQuery();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (isError && error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isError, error]);

  const errorAlert =
    isError && error && showError ? (
      <Paper
        sx={{
          position: "absolute",
          bottom: "calc(100% + 15px)",
          right: 0,
          minWidth: "400px",
          maxWidth: "700px",
          width: "fit-content",
          zIndex: 1000
        }}
        shadow="md"
      >
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="red"
          p="xs"
          withCloseButton
          onClose={() => setShowError(false)}
        >
          {error.message}
        </Alert>
      </Paper>
    ) : null;

  components.push(
    <ButtonDownload
      leftIcon={<IconDownload size={20} />}
      sx={{height: 28, position: "relative"}}
      key="download_csv"
      provider={() => downloadQuery({format: "csv"})}
    >
      {t("formats.csv")}
    </ButtonDownload>
  );

  if (components.length === 0 || data.length === 0) {
    return null;
  }

  return (
    <Box id="dex-btn-group-download" sx={{position: "relative"}}>
      {errorAlert}
      <Group spacing={"xs"} noWrap>
        {components}
        <MenuOpts formats={formats.filter(f => f !== "csv")} />
      </Group>
    </Box>
  );
};

const mimeTypes = {
  csv: "text/csv",
  jsonrecords: "application/json",
  tsv: "text/tab-separated-values",
  parquet: "application/octet-stream",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function useDownload(props) {
  const {provider} = props;
  const {run, data: file, error, isLoading} = useAsync<FileDescriptor>();

  useEffect(() => {
    if (file) {
      try {
        const blob =
          file.content instanceof Blob
            ? file.content
            : new Blob([file.content], {
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
      } catch (err) {
        console.error("Error creating download:", err);
      }
    }
  }, [file]);

  const onClick = useCallback(
    (evt, cb = () => {}) => {
      evt.stopPropagation();
      evt.preventDefault();
      return run(provider())
        .then(cb)
        .catch(err => {
          console.error("Error creating download:", err);
        });
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
      onClick={async e => {
        try {
          onClick(e, () => setOpened(false));
        } catch (error) {
          console.error("Download error:", error);
          setOpened(false);
        }
      }}
    >
      <Text fz="sm">{props.children}</Text>
    </Menu.Item>
  );
};

type MenuOptsProps = {
  formats: Format[];
};

function MenuOpts({formats}: MenuOptsProps) {
  const {translate: t} = useTranslation();
  const [opened, setOpened] = useState(false);
  const {mutateAsync: downloadQuery} = useDownloadQuery();

  const buttons = formats.map(format => (
    <ItemDownload
      component="a"
      key={format}
      provider={() => downloadQuery({format})}
      icon={loading => (loading ? <Loader size={15} /> : <IconDownload size={15} />)}
      setOpened={setOpened}
    >
      <Text size={"xs"}>{t(`formats.${format}`)}</Text>
    </ItemDownload>
  ));

  return (
    <Menu
      shadow="md"
      width={200}
      opened={opened}
      onClose={() => setOpened(false)}
      closeOnItemClick={false}
    >
      <Menu.Target>
        <ActionIcon
          onClick={() => setOpened(o => !o)}
          variant="filled"
          color="primary"
          sx={{
            width: 20,
            minWidth: 0
          }}
        >
          <IconDotsVertical size="0.8rem" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("params.title_downloaddata")}</Menu.Label>
        {buttons}
      </Menu.Dropdown>
    </Menu>
  );
}

export default TableFooter;
