import {ServerConfig} from "@datawheel/olap-client";
import {TranslationContextProps, TranslationProviderProps} from "@datawheel/use-translation";
import {CSSObject, MantineProvider} from "@mantine/core";
import {bindActionCreators} from "@reduxjs/toolkit";
import React, {useMemo} from "react";
import {Provider as ReduxProvider, useStore} from "react-redux";
import {ExplorerBoundActionMap, SettingsProvider} from "../hooks/settings";
import {TranslationDict, TranslationProvider} from "../hooks/translation";
import {ExplorerActionMap, ExplorerStore, actions, storeFactory} from "../state";
import {Formatter, PanelDescriptor} from "../utils/types";
import {DebugView} from "./DebugView";
import {ExplorerContent} from "./ExplorerContent";
import {PivotView} from "./PivotView";
import {TableView} from "./TableView";

/**
 * Main DataExplorer component
 * This components wraps the interface components in the needed Providers,
 * and pass the other properties to them.
 */
export function ExplorerComponent(props: {
  /**
   * A reference to the server with the data.
   * Can be setup as a string with the URL of the server, or a
   * [AxiosRequestConfig](https://github.com/axios/axios#request-config)
   * for more complex handling of authorization/authentication.
   */
  source: ServerConfig;

  /**
   * A list of the available locale options.
   * If passed a string, will be splitted by commas (`,`) to try to interpret a list.
   */
  dataLocale?: string | string[];

  /**
   * Defines the parameter panel which will be opened when the component first loads.
   * Available options are `measures`, `drilldowns`, `cuts`, and `options`.
   * @default "measures"
   */
  defaultOpenParams?: "measures" | "drilldowns" | "cuts" | "options";

  /**
   * Specifies which property should be used to filter elements in the member
   * selection control of the Cuts parameter area.
   * @default "id"
   */
  defaultMembersFilter?: "id" | "name" | "any";

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
   * The default limit for preview queries.
   * @default 50
   */
  previewLimit?: number;

  /**
   * A component that is rendered to display the default "splash screen";
   * the screen that is shown in the results panel when there is no query,
   * or a query has been dirtied.
   */
  splash?: React.ComponentType<{translation: TranslationContextProps}>;

  /**
   * The Translation labels to use in the UI.
   */
  translations?: Record<string, TranslationDict>;

  /**
   * The default locale to use in the Explorer component UI.
   * This value is passed to the Translation utility and controls the language
   * for the labels throughout the user interface. Must be equal to one of the
   * keys in the object provided to the `translations` property.
   * @default "en"
   */
  uiLocale?: TranslationProviderProps["defaultLocale"];

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
    dataLocale = "en",
    defaultOpenParams = "measures",
    height = "100vh",
    previewLimit = 50,
    withinMantineProvider = true,
    withinReduxProvider = false,
    withMultiQuery = false
  } = props;

  const locale = useMemo(() => dataLocale.toString().split(","), [dataLocale]);

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

  useMemo(() => {
    // Keep the previewLimit value in sync with the value stored in Settings
    // TODO: There's probably a better way, but we need previewLimit in the extraArg
    store.dispatch((_, __, extra) => {
      extra.previewLimit = previewLimit;
    });
  }, [previewLimit]);

  let content = (
    <SettingsProvider
      actions={boundActions}
      defaultMembersFilter={props.defaultMembersFilter}
      formatters={props.formatters}
      previewLimit={previewLimit}
      withPermalink={props.withPermalink}
      panels={panels}
    >
      <TranslationProvider defaultLocale={props.uiLocale} translations={props.translations}>
        <ExplorerContent
          dataLocale={locale}
          defaultOpenParams={defaultOpenParams}
          height={height}
          panels={panels}
          source={props.source}
          splash={props.splash}
          uiLocale={props.uiLocale}
          withMultiQuery={withMultiQuery}
        />
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

ExplorerComponent.defaultProps = {
  version: process.env.BUILD_VERSION || "dev"
};
ExplorerComponent.displayName = "TesseractExplorer";
