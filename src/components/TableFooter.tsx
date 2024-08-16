import React, {ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {useActions} from "../hooks/settings";
import {ActionIcon, Menu, Box, Flex, Text, Loader, Button, Group} from "@mantine/core";
import {useTranslation} from "../hooks/translation";
import {IconCopy, IconDotsVertical, IconDownload} from "@tabler/icons-react";
import type {ViewProps} from "../main";
import type {MRT_TableInstance} from "mantine-react-table";
import {MRT_TablePagination} from "mantine-react-table";
import {useClickOutside, useClipboard} from "@mantine/hooks";
import {selectCurrentQueryItem} from "../state/queries";
import {selectServerFormatsEnabled} from "../state/server";
import {FileDescriptor} from "../utils/types";
import {useAsync} from "../hooks/useAsync";
import CubeSource from "./CubeSource";

type TData = Record<string, any> & Record<string, string | number>;
type Props = {table: MRT_TableInstance<TData>} & Pick<ViewProps, "result">;

function TableFooter(props: Props) {
  const {result, table} = props;
  const {translate: t} = useTranslation();
  const {url} = result;

  const {copy, copied} = useClipboard({timeout: 1000});
  const copyHandler = useCallback(() => copy(url), [url]);

  return (
    <Box w="100%" sx={{flex: "0 0 70px"}}>
      <Flex p="md" justify="space-between" align="center">
        <CubeSource />
        <Group noWrap>
          <Text c="dimmed">{t("results.count_rows", {n: result.data.length})}</Text>
          <MRT_TablePagination table={table} />
          <ApiAndCsvButtons copied={copied} copyHandler={copyHandler} url={url} />
        </Group>
      </Flex>
    </Box>
  );
}

type ApiAndCsvButtonsProps = {
  copied: boolean;
  copyHandler: () => void;
  url: string;
};
const ApiAndCsvButtons: React.FC<ApiAndCsvButtonsProps> = props => {
  const {copied, copyHandler, url} = props;
  const {translate: t} = useTranslation();
  return (
    <Box id="query-results-debug-view">
      <Group spacing="xs">
        {url && (
          <Button
            variant="filled"
            color="dark"
            leftIcon={<IconCopy size={20} />}
            sx={{height: 30, backgroundColor: "#5A5A5A"}}
            onClick={copyHandler}
          >
            {copied ? t("action_copy_done") : t("action_copy")} API
          </Button>
        )}
        <DownloadQuery />
      </Group>
    </Box>
  );
};

const DownloadQuery = () => {
  const actions = useActions();
  const {translate: t} = useTranslation();
  const {isDirty, result} = useSelector(selectCurrentQueryItem);
  const formats: string[] = useSelector(selectServerFormatsEnabled);

  const csv = formats.find(format => format === "csv");

  const components: ReactNode[] = [];

  if (csv) {
    components.push(
      <ButtonDownload
        variant="filled"
        color="dark"
        leftIcon={<IconDownload size={20} />}
        sx={{height: 30, backgroundColor: "#5A5A5A"}}
        key={csv}
        provider={() => actions.willDownloadQuery(csv)}
      >
        {t(`formats.${csv}`)}
      </ButtonDownload>
    );
  }

  // if (components.length === 0 || isDirty || result.data.length === 0) {
  //   return null;
  // }

  if (components.length === 0 || result.data.length === 0) {
    return null;
  }

  /* <Input.Wrapper label={t("params.title_downloaddata")}> */
  return (
    <Box id="button-group-download-results">
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
  formats: string[];
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
    [formats]
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
          <IconDotsVertical  size="0.8rem"/>
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
