import React, { createContext, useCallback, useContext, useMemo } from "react";
import type { TesseractCube, TesseractDataRequest } from "../api";
import type { ExplorerActionMap } from "../state";
import type { Formatter, PanelDescriptor } from "../utils/types";
import { usePermalink } from "./permalink";

// These types are needed to `.then()` over the returned value of dispatched thunks
export type ExplorerBoundActionMap = {
  [K in keyof ExplorerActionMap]:
    ExplorerActionMap[K] extends (...args: infer Params) => (...args) => infer R
      ? (...args: Params) => R
      : ExplorerActionMap[K];
}

export interface ExplorerSettings {
  /**
   * URL to the Tesseract server to use as backend.
   */
  serverUrl: string;

  /**
   * Extra parameters for all server requests. 
   */
  serverRequest: RequestInit;

  /**
   * Defines the default query parameters that will be used after the component first loads.
   */
  defaultQuery: TesseractDataRequest | ((cubes: TesseractCube[]) => TesseractDataRequest);

  /**
   * Specifies which property should be used to filter elements in the member
   * selection control of the Cuts parameter area.
   * @default "id"
   */
  defaultMembersFilter: "id" | "name" | "any";

  /**
   * Defines an index of formatter functions available to the measures shown
   * in the app, besides a limited list of default ones. The key used comes
   * from `measure.annotations.units_of_measurement`, if present.
   */
  formatters: Record<string, Formatter>;

  /**
   * The list of tabs to offer to the user to render the results.
   * Must be an array of objects with the following properties:
   * - `key`: a string to distinguish each panel, will be used in the URL params
   * - `label`: a string used as the title for the panel in the tab bar.
   * It will be passed through the internal translation function, so can be
   * localized via the `translations` property or used directly as is.
   * - `component`: a non-hydrated React Component.
   * This will be passed the needed properties according to the specification.
   * Rendering the panel supports the use of `React.lazy` to defer the load of
   * heavy dependencies.
   */
  panels: PanelDescriptor[];

  /**
   * A component that is rendered to display the default "splash screen";
   * the screen that is shown in the results panel when there is no query,
   * or a query has been dirtied.
   */
  splash: React.ComponentType<{translation: TranslationContextProps}>;

  /**
   * The Translation labels to use in the UI.
   */
  translations: Record<string, TranslationDict>;

  /**
   * The default locale to use in the Explorer component UI.
   * This value is passed to the Translation utility and controls the language
   * for the labels throughout the user interface. Must be equal to one of the
   * keys in the object provided to the `translations` property.
   * @default "en"
   */
  locale: string;

  /**
   * Determines whether Explorer should be rendered within a MantineProvider
   * @default true
   */
  withinMantineProvider: boolean;

  /**
   * Determines whether Explorer should be rendered within a Redux Provider,
   * encapsulating its state, and making easier to install.
   * @default false
   */
  withinReduxProvider: boolean;

  /**
   * Enables multiple queries mode.
   * This adds a column where the user can quickly switch between queries,
   * like tabs in a browser.
   * @default false
   */
  withMultiQuery: boolean;
}

interface SettingsContextProps {
  actions: ExplorerBoundActionMap;
  defaultMembersFilter: "id" | "name" | "any";
  formatters: Record<string, Formatter>;
  previewLimit: number;
  panels: PanelDescriptor[];
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
}) {
  usePermalink(props.withPermalink, {onChange: props.actions.resetAllParams});

  const value: SettingsContextProps = useMemo(() => ({
    actions: props.actions,
    defaultMembersFilter: props.defaultMembersFilter || "id",
    formatters: props.formatters || {},
    panels: props.panels,
    previewLimit: props.previewLimit || 50,
  }), [props.formatters, props.previewLimit]);

  return <ContextProvider value={value}>{props.children}</ContextProvider>;
}

/**
 * A wrapper for the Consumer, for use with class components.
 */
export function SettingsConsumer(props: React.ConsumerProps<SettingsContextProps>) {
  return (
    <ContextConsumer>
      {useCallback(context => {
        if (context === undefined) {
          throw new Error("SettingsConsumer must be used within a SettingsProvider.");
        }
        return props.children(context);
      }, [props.children])}
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
