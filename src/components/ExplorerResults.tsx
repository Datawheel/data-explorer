import {
  Alert,
  Anchor,
  Box,
  Flex,
  Group,
  Paper,
  Stack,
  type TabsValue,
  Text,
  Title,
  createStyles
} from "@mantine/core";
import {useFullscreen} from "@mantine/hooks";
import {IconAlertTriangle, IconBox, IconWorld} from "@tabler/icons-react";
import React, {Suspense, useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import type {TesseractCube} from "../api";
import {useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem, selectIsPreviewMode} from "../state/queries";
import type {QueryParams, QueryResult} from "../utils/structs";
import type {PanelDescriptor, ViewProps} from "../utils/types";
import AddColumnsDrawer from "./DrawerMenu";
import {ExplorerTabs} from "./ExplorerTabs";
import {PreviewModeSwitch} from "./PreviewModeSwitch";
import {useTable} from "./TableView";
import Toolbar from "./Toolbar";
// import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {useServerSchema} from "../hooks/useQueryApi";
import {useUpdateUrl} from "../hooks/permalink";
import {useQueryItem} from "../context/query";

const useStyles = createStyles(() => ({
  container: {
    minHeight: "40vh",
    display: "flex",
    flexFlow: "column nowrap"
  }
}));

type TData = Record<string, string | number>;

/**
 * Renders the result area in the UI.
 */
export function ExplorerResults(props: {
  className?: string;
  panels: PanelDescriptor[];
  splash: React.ReactElement | null;
  serverURL: string;
  defaultDataLocale?: string;
}) {
  const {
    data: schema,
    isLoading: schemaLoading,
    isError: schemaError,
    error: schemaErrorDetail
  } = useServerSchema();
  const {transintionLocaleLoading} = useQueryItem();
  const {params} = useSelector(selectCurrentQueryItem);
  const cubeMap = schema?.cubeMap || {};
  const cube = cubeMap[params.cube];
  const {online: isServerOnline, url: serverUrl} = schema || {};
  const {translate: t} = useTranslation();
  const {classes, cx} = useStyles();

  // Check if client is browser not connected to internet
  if (typeof window === "object" && window.navigator.onLine === false) {
    return (
      <FailureResult
        className={cx(classes.container, props.className)}
        icon={<IconWorld color="orange" size="5rem" />}
        title={t("results.error_disconnected_title")}
      />
    );
  }

  // Check if the remote server is not working
  if (isServerOnline === false) {
    return (
      <FailureResult
        className={cx(classes.container, props.className)}
        icon={<IconAlertTriangle color="orange" size="5rem" />}
        title={t("results.error_serveroffline_title")}
        description={
          <Text span>
            {t("results.error_serveroffline_detail")}
            <Anchor href={serverUrl} target="_blank" rel="noopener noreferrer">
              {serverUrl}
            </Anchor>
            .
          </Text>
        }
      />
    );
  }

  // Show splash if the schema is not fully loaded, server hasn't been checked,
  // or the user changed parameters since last query
  // check is loading
  // use set loading when seraching members.

  if (isServerOnline == null || !cube || schemaLoading || transintionLocaleLoading) {
    return (
      <Paper
        className={cx(classes.container, props.className)}
        id="query-results-transient"
        radius={0}
      >
        {props.splash || null}
      </Paper>
    );
  }

  // Check if there was an error in the last query
  if (schemaError) {
    return (
      <FailureResult
        className={cx(classes.container, props.className)}
        description={
          <Stack align="center" spacing="xs">
            <Text>{t("results.error_execquery_detail")}</Text>
            <Text>{schemaErrorDetail.message}</Text>
          </Stack>
        }
        icon={<IconAlertTriangle color="orange" size="5rem" />}
      />
    );
  }

  return (
    <SuccessResult
      className={cx(classes.container, props.className)}
      cube={cube}
      panels={props.panels}
      params={params}
      panelKey={null}
    >
      {props.splash}
    </SuccessResult>
  );
}

/** */
function FailureResult(props: {
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string | undefined;
}) {
  return (
    <Paper
      id="query-results-failure"
      className={props.className}
      radius={0}
      withBorder
      sx={{justifyContent: "center"}}
    >
      <Stack align="center" spacing="xs">
        {props.icon && props.icon}
        {props.title && <Title order={5}>{props.title}</Title>}
        {props.description && <Text>{props.description}</Text>}
        {props.children && props.children}
        {props.action && props.action}
      </Stack>
    </Paper>
  );
}

/**
 * Handles the currently active tab and its contents.
 */
function SuccessResult(
  props: ViewProps<TData> & {
    children?: React.ReactNode;
    panels: PanelDescriptor[];
  }
) {
  const updateUrl = useUpdateUrl();
  const {cube, panels, params} = props;
  const {translate: t} = useTranslation();
  const {previewLimit, actions} = useSettings();
  const queryItem = useSelector(selectCurrentQueryItem);
  const isPreviewMode = useSelector(selectIsPreviewMode);
  const fullscreen = useFullscreen();
  const {classes, cx} = useStyles();

  const [CurrentComponent, panelKey, panelMeta] = useMemo(() => {
    const currentPanel = queryItem.panel || `${panels[0].key}-`;
    const [panelKey, ...panelMeta] = currentPanel.split("-");
    const panel = panels.find(item => item.key === panelKey) || panels[0];
    return [panel.component, panel.key, panelMeta.join("-")];
  }, [panels, queryItem.panel]);

  const tabHandler = (newTab: TabsValue) => {
    actions.switchPanel(newTab);
    updateUrl({...queryItem, panel: newTab});
  };

  const {table, isError, isLoading, data, columns, result, pagination, isFetching, setPagination} =
    useTable({
      cube
    });

  if (data?.length === 0 && !isLoading && !isError) {
    return (
      <FailureResult
        className={cx(classes.container, props.className)}
        icon={<IconBox color="orange" size="5rem" />}
        title={t("results.error_emptyresult_title")}
        description={t("results.error_emptyresult_detail")}
      />
    );
  }

  return (
    <Flex
      gap="xs"
      direction="column"
      w="100%"
      className={props.className}
      h="100%"
      sx={{overflow: "hidden"}}
    >
      <Paper
        ref={fullscreen.ref}
        id="query-results-success"
        h={"100%"}
        sx={{display: "flex", flexDirection: "column", overflow: "hidden"}}
      >
        <Flex
          sx={t => ({
            alignItems: "center",
            background: t.colorScheme === "dark" ? t.colors.dark[7] : t.colors.gray[1],
            justifyContent: "space-between"
          })}
          w="100%"
          h="fit-content"
        >
          <ExplorerTabs panels={panels} onChange={tabHandler} value={panelKey} />
          {(!queryItem.panel || queryItem.panel === "table") && (
            <Group sx={{display: "flex", flex: "0 1 auto", gap: "0.5rem"}} mr="sm" noWrap>
              {table && <Toolbar table={table} fullscreen={fullscreen} />}
              <AddColumnsDrawer />
            </Group>
          )}
        </Flex>
        {isPreviewMode && (
          <Alert id="alert-load-all-results" color="yellow" radius={0} sx={{flex: "0 0 auto"}}>
            <Group position="apart">
              <Text>
                <Text fw={700} span>
                  {t("previewMode.title_preview")}:{" "}
                </Text>
                <Text span>{t("previewMode.description_preview", {limit: previewLimit})}</Text>
              </Text>
              <PreviewModeSwitch />
            </Group>
          </Alert>
        )}

        <Box
          id="query-results-content"
          sx={{flex: "1 1 calc(100% - 70px)", maxHeight: "calc(100% - 70px)"}}
        >
          <Suspense fallback={props.children}>
            <Flex h="100%">
              <Box sx={{flex: "1 1", overflowX: "scroll"}}>
                <CurrentComponent
                  panelKey={`${panelKey}-${panelMeta}`}
                  cube={cube}
                  params={params}
                  data={data as TData[]}
                  result={result}
                  table={table}
                  isError={isError}
                  isLoading={isLoading}
                  columns={columns}
                  pagination={pagination}
                  setPagination={setPagination}
                  isFetching={isFetching}
                />
              </Box>
            </Flex>
          </Suspense>
        </Box>
      </Paper>
      {/* <ReactQueryDevtools initialIsOpen /> */}
    </Flex>
  );
}
