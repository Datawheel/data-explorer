import {PlainCube} from "@datawheel/olap-client";
import {
  Alert,
  Anchor,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  createStyles,
} from "@mantine/core";
import {IconAlertTriangle, IconBox, IconWorld} from "@tabler/icons-react";
import React, {Suspense, useMemo} from "react";
import {useSelector} from "react-redux";

import {useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem, selectIsPreviewMode} from "../state/queries";
import {selectOlapCube} from "../state/selectors";
import {selectServerState} from "../state/server";
import {QueryParams, QueryResult} from "../utils/structs";
import {PreviewModeSwitch} from "./PreviewModeSwitch";
import {ModeTabs} from "./ModeTabs";

const useStyles = createStyles(() => ({
  container: {
    minHeight: "40vh",
    display: "flex",
    flexFlow: "column nowrap",
  },
}));

/**
 * Renders the result area in the UI.
 */
export function ExplorerResults(props: {
  className?: string;
  splash: React.ReactElement | null;
}) {
  const cube = useSelector(selectOlapCube);
  const serverStatus = useSelector(selectServerState);
  const {isDirty, params, result} = useSelector(selectCurrentQueryItem);

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
  if (isServerOnline == null || !cube || isDirty) {
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
  params: QueryParams;
  result: QueryResult;
}) {
  const {cube, params, result} = props;

  const {translate: t} = useTranslation();

  const {panels, previewLimit} = useSettings();

  const queryItem = useSelector(selectCurrentQueryItem);
  const isPreviewMode = useSelector(selectIsPreviewMode);

  const [CurrentComponent, panelKey, panelMeta] = useMemo(() => {
    const currentPanel = queryItem.panel || `${panels[0].key}-`;
    const [panelKey, ...panelMeta] = currentPanel.split("-");
    const panel = panels.find(item => item.key === panelKey) || panels[0];
    return [panel.component, panel.key, panelMeta.join("-")];
  }, [panels, queryItem.panel]);

  return (
    <Paper id="query-results-success" className={props.className}>
      {isPreviewMode && (
        <Alert
          id="alert-load-all-results"
          color="yellow"
          radius={0}
          sx={{flex: "0 0 auto"}}
        >
          <Group position="apart">
            <Text>
              <Text fw={700} span>
                {t("previewMode.title_preview")}:{" "}
              </Text>
              <Text span>
                {t("previewMode.description_preview", {limit: previewLimit})}
              </Text>
            </Text>
            <PreviewModeSwitch />
          </Group>
        </Alert>
      )}

      <Stack
        id="query-results-content"
        spacing={0}
        sx={{flex: "1 1", height: "100%"}}
      >
        {panelKey !== "table" && <ModeTabs />}
        <Suspense fallback={props.children}>
          <CurrentComponent
            cube={cube}
            panelKey={`${panelKey}-${panelMeta}`}
            params={params}
            result={result}
          />
        </Suspense>
      </Stack>
    </Paper>
  );
}
