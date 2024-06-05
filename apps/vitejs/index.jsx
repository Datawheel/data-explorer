// @ts-check
import {DebugView, Explorer, PivotView, TableView, translationDict as explorerTranslation} from "@datawheel/tesseract-explorer";
import {createVizbuilderView} from "@datawheel/tesseract-vizbuilder";
import {translationDict as vizbuilderTranslation} from "@datawheel/vizbuilder";
import {MantineProvider} from "@mantine/core";
import React from "react";
import {createRoot} from "react-dom/client";

import "normalize.css";

const formatters = {
  "Index": n => typeof n === "number" ? n.toFixed(3) : n || " ",
  "Metric Ton": n => `${n.toFixed()} 📦`,
  "Sheep": n => `🐑 ${n.toFixed()}`
};

const VizbuilderPanel = createVizbuilderView({
  chartTypes: ["barchart", "barchartyear", "lineplot", "stacked", "treemap", "geomap", "donut"],
  downloadFormats: ["svg", "png"],
  showConfidenceInt: false
});

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
          {key: "vizbuilder", label: "Vizbuilder", component: VizbuilderPanel},
          // {key: "debug", label: "Raw response", component: DebugView},
        ]}
        translations={{
          en: {...explorerTranslation, vizbuilder: vizbuilderTranslation}
        }}
        defaultOpenParams="drilldowns"
        withinMantineProvider={false}
        withinReduxProvider
        withMultiQuery
        withPermalink
      />
    </MantineProvider>
  );
}
