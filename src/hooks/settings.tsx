/* eslint-disable comma-dangle */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef} from "react";
import {type ExplorerActionMap} from "../state";
import {DrilldownFormatter, Formatter, PanelDescriptor} from "../utils/types";
import type {Pagination} from "../components/Explorer";
import type {ToolbarConfigType} from "../components/Toolbar";
import {Translation, TranslationProvider} from "./translation";
import {useLocation, useNavigate} from "react-router-dom";

// These types are needed to `.then()` over the returned value of dispatched thunks
export type ExplorerBoundActionMap = {
  [K in keyof ExplorerActionMap]: ExplorerActionMap[K] extends (
    ...args: infer Params
  ) => (...args) => infer R
    ? (...args: Params) => R
    : ExplorerActionMap[K];
};

const defaultToolbarConfig: ToolbarConfigType = {
  buttons: [],
  showLabels: true
};

interface SettingsContextProps {
  actions: ExplorerBoundActionMap;
  defaultMembersFilter: "id" | "name" | "any";
  formatters: Record<string, Formatter>;
  idFormatters: Record<string, Formatter>;
  drilldownFormatters: Record<string, DrilldownFormatter>;
  previewLimit: number;
  panels: PanelDescriptor[];
  paginationConfig: Pagination;
  measuresActive?: number;
  toolbarConfig?: ToolbarConfigType;
  serverConfig?: RequestInit;
  serverURL: string;
  defaultDataLocale?: string;
  defaultCube?: string;
  defaultLocale: string;
  locale: string;
}

/**
 * The shared Context object.
 */
const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

const {Consumer: ContextConsumer, Provider: ContextProvider} = SettingsContext;

/**
 * A wrapper for the Provider, to handle the changes and API given by the hook.
 */
export function SettingsProvider(props: {
  actions: ExplorerBoundActionMap;
  children?: React.ReactElement;
  defaultMembersFilter?: "id" | "name" | "any";
  formatters?: Record<string, Formatter>;
  idFormatters?: Record<string, Formatter>;
  drilldownFormatters?: Record<string, DrilldownFormatter>;
  panels: PanelDescriptor[];
  previewLimit?: number;
  withPermalink: boolean | undefined;
  pagination?: Pagination;
  measuresActive?: number;
  toolbarConfig?: Partial<ToolbarConfigType>;
  serverConfig?: RequestInit;
  serverURL: string;
  defaultDataLocale?: string;
  defaultCube?: string;
  defaultLocale: string;
  translations?: Record<string, Translation>;
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const locale = searchParams.get("locale");

  const navigate = useNavigate();
  const initialServerURL = useRef(props.serverURL);

  useEffect(() => {
    if (props.serverURL && props.serverURL !== initialServerURL.current) {
      const nextLocation = window.location.pathname;
      navigate(nextLocation, {replace: true});
      initialServerURL.current = props.serverURL;
    }
  }, [props.serverURL, navigate]);

  const value: SettingsContextProps = useMemo(
    () => ({
      actions: props.actions,
      defaultMembersFilter: props.defaultMembersFilter || "id",
      formatters: props.formatters || {},
      idFormatters: props.idFormatters || {},
      drilldownFormatters: props.drilldownFormatters || {},
      panels: props.panels,
      previewLimit: props.previewLimit || 50,
      paginationConfig: props.pagination ?? {rowsLimits: [100, 300, 500, 1000], defaultLimit: 100},
      measuresActive: props.measuresActive,
      toolbarConfig: {...defaultToolbarConfig, ...props.toolbarConfig},
      serverConfig: props.serverConfig,
      serverURL: props.serverURL,
      defaultDataLocale: props.defaultDataLocale,
      defaultCube: props.defaultCube,
      defaultLocale: props.defaultLocale,
      locale: locale || props.defaultLocale
    }),
    [
      props.formatters,
      props.previewLimit,
      props.toolbarConfig,
      locale,
      props.defaultLocale,
      props.defaultCube
    ]
  );

  return (
    <TranslationProvider defaultLocale={props.defaultLocale} translations={props.translations}>
      <ContextProvider value={value}>{props.children}</ContextProvider>
    </TranslationProvider>
  );
}

/**
 * A wrapper for the Consumer, for use with class components.
 */
export function SettingsConsumer(props: React.ConsumerProps<SettingsContextProps>) {
  return (
    <ContextConsumer>
      {useCallback(
        context => {
          if (context === undefined) {
            throw new Error("SettingsConsumer must be used within a SettingsProvider.");
          }
          return props.children(context);
        },
        [props.children]
      )}
    </ContextConsumer>
  );
}

/**
 * The React hook associated to the settings context.
 */
export function useSettings(): SettingsContextProps {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider.");
  }
  return context;
}

/**
 * Returns a set of ready-to-call actions.
 */
export function useActions() {
  const context = useSettings();
  return context.actions;
}
