import {TranslationContextProps, TranslationProviderProps} from "@datawheel/use-translation";
import {CSSObject, MantineProvider} from "@mantine/core";
import {bindActionCreators} from "@reduxjs/toolkit";
import React, {useMemo} from "react";
import {Provider as ReduxProvider, useStore} from "react-redux";
import {ExplorerBoundActionMap, ExplorerSettings, SettingsProvider} from "../hooks/settings";
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
export function ExplorerComponent(props: ExplorerSettings) {
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
      version={process.env.BUILD_VERSION || "dev"}
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
          defaultCube={props.defaultCube}
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

ExplorerComponent.displayName = "TesseractExplorer";
