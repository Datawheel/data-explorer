import {PlainCube} from "@datawheel/olap-client";
import {
  Alert,
  Anchor,
  Box,
  Flex,
  Group,
  Paper,
  Stack,
  Tabs,
  TabsValue,
  Text,
  Title,
  createStyles
} from "@mantine/core";
import {IconAlertTriangle, IconBox, IconWorld} from "@tabler/icons-react";
import React, {Suspense, useCallback, useMemo} from "react";
import {useSelector} from "react-redux";
import {useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem, selectIsPreviewMode} from "../state/queries";
import {selectOlapCube} from "../state/selectors";
import {selectServerState} from "../state/server";
import {QueryParams, QueryResult} from "../utils/structs";
import {PanelDescriptor} from "../utils/types";
import {PreviewModeSwitch} from "./PreviewModeSwitch";
import {MRT_TopToolbar} from "mantine-react-table";
import {useTable} from "./TableView";
import {selectLoadingState} from "../state/loading";

const useStyles = createStyles(() => ({
  container: {
    minHeight: "40vh",
    display: "flex",
    flexFlow: "column nowrap"
  }
}));

/**
 * Renders the result area in the UI.
 */
export function ExplorerResults(props: {
  className?: string;
  panels: PanelDescriptor[];
  splash: React.ReactElement | null;
}) {
  const cube = useSelector(selectOlapCube);
  const serverStatus = useSelector(selectServerState);
  const {isDirty, params, result} = useSelector(selectCurrentQueryItem);

  const {loading: isLoading} = useSelector(selectLoadingState);

  const {online: isServerOnline, url: serverUrl} = serverStatus;
  const {data, error} = result;

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
  if (isServerOnline == null || !cube || isDirty || isLoading) {
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
  if (error) {
    return (
      <FailureResult
        className={cx(classes.container, props.className)}
        description={
          <Stack align="center" spacing="xs">
            <Text>{t("results.error_execquery_detail")}</Text>
            <Text>{error}</Text>
          </Stack>
        }
        icon={<IconAlertTriangle color="orange" size="5rem" />}
      />
    );
  }

  // Check if query executed but returned empty dataset
  if (data.length === 0) {
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
    <SuccessResult
      className={cx(classes.container, props.className)}
      cube={cube}
      panels={props.panels}
      params={params}
      result={result}
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
function SuccessResult(props: {
  children?: React.ReactNode;
  className?: string;
  cube: PlainCube;
  panels: PanelDescriptor[];
  params: QueryParams;
  result: QueryResult;
}) {
  const {cube, panels, params, result} = props;
  const {translate: t} = useTranslation();
  const {previewLimit, actions} = useSettings();

  const queryItem = useSelector(selectCurrentQueryItem);
  const isPreviewMode = useSelector(selectIsPreviewMode);

  const {table} = useTable({cube, result});

  const [CurrentComponent, panelKey, panelMeta] = useMemo(() => {
    const currentPanel = queryItem.panel || `${panels[0].key}-`;
    const [panelKey, ...panelMeta] = currentPanel.split("-");
    const panel = panels.find(item => item.key === panelKey) || panels[0];
    return [panel.component, panel.key, panelMeta.join("-")];
  }, [panels, queryItem.panel]);

  const tabHandler = useCallback((newTab: TabsValue) => {
    actions.switchPanel(newTab);
  }, []);

  return (
    <Paper id="query-results-success" className={props.className} radius="md" withBorder m="md">
      <Flex sx={{alignItems: "center"}}>
        <Tabs color="blue" id="query-results-tabs" onTabChange={tabHandler} value={panelKey}>
          <Tabs.List>
            {panels.map(panel => (
              <Tabs.Tab key={panel.key} id={panel.key} value={panel.key}>
                {t(panel.label)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
        {/* need to update this logic */}
        {(!queryItem.panel || queryItem.panel === "table") && (
          <Box sx={{display: "flex", flex: "1 1 auto"}}>
            <MRT_TopToolbar table={table} />
          </Box>
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

      <Box id="query-results-content" sx={{flex: "1 1", height: "calc(100% - 60px)"}}>
        <Suspense fallback={props.children}>
          <Flex h="100%">
            <Box sx={{flex: "1 1"}}>
              <CurrentComponent
                panelKey={`${panelKey}-${panelMeta}`}
                cube={cube}
                params={params}
                result={result}
                table={table}
              />
            </Box>
          </Flex>
        </Suspense>
      </Box>
    </Paper>
  );
}
