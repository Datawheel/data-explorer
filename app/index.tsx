import {
  Explorer,
  PivotView,
  TableView,
  translationDict as explorerTranslation,
} from "../src/main";
import {MantineProvider} from "@mantine/core";
import React from "react";
import {createRoot} from "react-dom/client";

const formatters = {
  Index: n => (typeof n === "number" ? n.toFixed(3) : n || " "),
  "Metric Ton": n => `${n.toFixed()} 📦`,
  Sheep: n => `🐑 ${n.toFixed()}`,
};

/** @type {import("@mantine/core").MantineThemeOverride} */
const theme = {
  // colorScheme: "dark"
};

const container = document.getElementById("app");
container && mount(container);

/** */
function mount(container) {
  const root = createRoot(container);
  root.render(
    <MantineProvider inherit withNormalizeCSS theme={theme}>
      <Explorer
        source={process.env.TESSERACT_SERVER}
        formatters={formatters}
        dataLocale="en,ar"
        // height="90vh"
        previewLimit={75}
        panels={[
          {key: "table", label: "Data Table", component: TableView},
          {key: "matrix", label: "Pivot Table", component: PivotView},
        ]}
        translations={{en: explorerTranslation}}
        defaultOpenParams="drilldowns"
        withinMantineProvider={false}
        withinReduxProvider
        withMultiQuery
        withPermalink
      />
    </MantineProvider>,
  );
}
