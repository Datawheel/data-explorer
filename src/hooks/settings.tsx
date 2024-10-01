/* eslint-disable comma-dangle */
import React, {createContext, useCallback, useContext, useMemo} from "react";
import {type ExplorerActionMap} from "../state";
import {Formatter, PanelDescriptor} from "../utils/types";
import {usePermalink} from "./permalink";
import type {Pagination} from "../components/Explorer";

// These types are needed to `.then()` over the returned value of dispatched thunks
export type ExplorerBoundActionMap = {
  [K in keyof ExplorerActionMap]: ExplorerActionMap[K] extends (
    ...args: infer Params
  ) => (...args) => infer R
    ? (...args: Params) => R
    : ExplorerActionMap[K];
};

interface SettingsContextProps {
  actions: ExplorerBoundActionMap;
  defaultMembersFilter: "id" | "name" | "any";
  formatters: Record<string, Formatter>;
  previewLimit: number;
  panels: PanelDescriptor[];
  paginationConfig: Pagination;
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
  panels: PanelDescriptor[];
  previewLimit?: number;
  withPermalink: boolean | undefined;
  pagination?: Pagination;
}) {
  usePermalink(props.withPermalink, {onChange: props.actions.resetAllParams});

  const value: SettingsContextProps = useMemo(
    () => ({
      actions: props.actions,
      defaultMembersFilter: props.defaultMembersFilter || "id",
      formatters: props.formatters || {},
      panels: props.panels,
      previewLimit: props.previewLimit || 50,
      paginationConfig: props.pagination ?? {rowsLimits: [100, 300, 500, 100], defaultLimit: 100}
    }),
    [props.formatters, props.previewLimit]
  );

  return <ContextProvider value={value}>{props.children}</ContextProvider>;
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
