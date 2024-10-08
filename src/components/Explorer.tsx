import type {TranslationContextProps} from "@datawheel/use-translation";
import {type CSSObject, MantineProvider} from "@mantine/core";
import {bindActionCreators} from "@reduxjs/toolkit";
import React, {useMemo} from "react";
import {Provider as ReduxProvider, useStore} from "react-redux";
import {type ExplorerBoundActionMap, SettingsProvider} from "../hooks/settings";
import {type TranslationDict, TranslationProvider} from "../hooks/translation";
import {type ExplorerActionMap, type ExplorerStore, actions, storeFactory} from "../state";
import type {Formatter, PanelDescriptor} from "../utils/types";
import {DebugView} from "./DebugView";
import {ExplorerContent} from "./ExplorerContent";
import {PivotView} from "./PivotView";
import {TableView} from "./TableView";
import ExplorerTour from "./tour/ExplorerTour";
import {TourConfig} from "./tour/types";
import { ToolbarConfigType } from "./Toolbar";

export type Pagination = {
  rowsLimits: number[];
  defaultLimit: Pagination["rowsLimits"][number]; // Ensures defaultLimit is one of the values in rowsLimits
};

const defaultTourConfig: TourConfig = {
  extraSteps: [],
  introImage: null,
  tourProps: {}
}
/**
 * Main DataExplorer component
 * This components wraps the interface components in the needed Providers,
 * and pass the other properties to them.
 */
export function ExplorerComponent<Locale extends string>(props: {
  measuresActive?: number;
  pagination?: Pagination;
  /**
   * The main server endpoint.
   */
  serverURL: string;

  /**
   * Additional request parameters for all requests against the server.
   * Uses the same format used by the second parameter of the fetch API.
   */
  serverConfig?: RequestInit;

  /**
   * The locale to use when retrieving the schema from the server the first time.
   * If not set, the server will use the default locale set in its configuration.
   */
  defaultDataLocale?: string;

  /**
   * Defines the default cube that will be opened when the component first loads.
   * @default undefined
   */
  defaultCube?: string | undefined;

  /**
   * Specifies which property should be used to filter elements in the member
   * selection control of the Cuts parameter area.
   * @default "id"
   */
  defaultMembersFilter?: "id" | "name" | "any";

  /**
   * Defines the parameter panel which will be opened when the component first loads.
   * Available options are `measures`, `drilldowns`, `cuts`, and `options`.
   * @default "measures"
   */
  defaultOpenParams?: "measures" | "drilldowns" | "cuts" | "options";

  /**
   * The locale to use in the Explorer component UI.
   * This value is passed to the Translation utility and controls the language
   * for the labels throughout the user interface. Must be equal to one of the
   * keys in the object provided to the `translations` property.
   * @default "en"
   */
  locale?: Locale;

  /**
   * Defines an index of formatter functions available to the measures shown
   * in the app, besides a limited list of default ones. The key used comes
   * from `measure.annotations.units_of_measurement`, if present.
   */
  formatters?: Record<string, Formatter>;

  /**
   * Defines an alternative height for the component structure.
   * @default "100vh"
   */
  height?: CSSObject["height"];

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
  panels?: PanelDescriptor[];

  /**
   * A component that is rendered to display the default "splash screen";
   * the screen that is shown in the results panel when there is no query,
   * or a query has been dirtied.
   */
  splash?: React.ComponentType<{translation: TranslationContextProps}>;

  toolbarConfig?: Partial<ToolbarConfigType>;
  /**
   * Tour configuration 
   */
  tourConfig?: Partial<TourConfig>;

  /**
   * The Translation labels to use in the UI.
   */
  translations?: Record<Locale, TranslationDict>;

  /**
   * Determines whether Explorer should be rendered within a MantineProvider
   * @default true
   */
  withinMantineProvider?: boolean;

  /**
   * Determines whether Explorer should be rendered within a Redux Provider,
   * encapsulating its state, and making easier to install.
   * @default false
   */
  withinReduxProvider?: boolean;

  /**
   * Enables multiple queries mode.
   * This adds a column where the user can quickly switch between queries,
   * like tabs in a browser.
   * @default false
   */
  withMultiQuery?: boolean;

  /**
   * Enables browser permalink synchronization.
   * @default false
   */
  withPermalink?: boolean;
}) {
  const {
    locale = "en",
    defaultOpenParams = "measures",
    height = "100vh",
    withinMantineProvider = true,
    withinReduxProvider = false,
    withMultiQuery = false,
    pagination,
    tourConfig,
    measuresActive
  } = props;

  const panels = useMemo(
    () =>
      props.panels || [
        {key: "table", label: "table_view.tab_label", component: TableView},
        {key: "pivot", label: "pivot_view.tab_label", component: PivotView},
        {key: "debug", label: "debug_view.tab_label", component: DebugView}
      ],
    [props.panels]
  );

  const store: ExplorerStore = withinReduxProvider ? useMemo(storeFactory, []) : useStore();

  const boundActions = useMemo(
    () => bindActionCreators<ExplorerActionMap, ExplorerBoundActionMap>(actions, store.dispatch),
    []
  );

  let content = (
    <SettingsProvider
      actions={boundActions}
      defaultMembersFilter={props.defaultMembersFilter}
      formatters={props.formatters}
      withPermalink={props.withPermalink}
      panels={panels}
      pagination={pagination}
      measuresActive={measuresActive}
      toolbarConfig={props.toolbarConfig}
    >
      <TranslationProvider defaultLocale={locale} translations={props.translations}>
        <ExplorerTour tourConfig={{...defaultTourConfig, ...tourConfig}}>
          <ExplorerContent
            defaultCube={props.defaultCube}
            defaultDataLocale={props.defaultDataLocale}
            defaultOpenParams={defaultOpenParams}
            height={height}
            locale={locale}
            panels={panels}
            serverConfig={props.serverConfig}
            serverURL={props.serverURL}
            splash={props.splash}
            withMultiQuery={withMultiQuery}
          />
        </ExplorerTour>
      </TranslationProvider>
    </SettingsProvider>
  );

  if (withinMantineProvider) {
    content = (
      <MantineProvider
        withNormalizeCSS
        theme={{
          globalStyles: theme => ({
            "*, *::before, *::after": {
              boxSizing: "border-box"
            },
            "[data-state='expanded']": {
              width: 350
            }
          }),
          components: {
            Text: {
              styles: theme => ({
                root: {
                  fontSize: theme.fontSizes.sm // Apply small font size to Text component
                }
              })
            }
            // Add other component customizations here
          },
          fontSizes: {
            xs: "0.75rem",
            sm: "0.875rem",
            md: "1rem",
            lg: "1.125rem",
            xl: "1.25rem"
          }
        }}
      >
        {content}
      </MantineProvider>
    );
  }
  if (withinReduxProvider) {
    content = <ReduxProvider store={store}>{content}</ReduxProvider>;
  }

  return content;
}

ExplorerComponent.displayName = "TesseractExplorer";
