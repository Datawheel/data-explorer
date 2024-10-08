import React, {useMemo} from "react";
import {Explorer, PivotView, TableView, createVizbuilderView} from "../src/main";
import {createRoot} from "react-dom/client";
import * as translations from "../translations";
import {type ServerOption, SettingsProvider} from "./Settings";

const VizbuilderView = createVizbuilderView({
  downloadFormats: ["png", "svg"]
});

//default formatters as example. The client app should provide or not custom formatters.
const formatters = {
  Index: n => (typeof n === "number" ? n.toFixed(3) : n || " "),
  "Metric Ton": n => `${n.toFixed()} 📦`,
  Sheep: n => `🐑 ${n.toFixed()}`
};

const locales = Object.keys(translations);

const container = document.getElementById("app");
container && mount(container);

function App() {
  // would be a good idea to add formatters and default cube,
  //  specific config for clients in this object.
  // defaultCube="gastat_gdp"
  // move to env variables
  const items: ServerOption[] = useMemo(
    () => [
      {value: "https://api.datasaudi.datawheel.us/tesseract/", label: "Data Saudi"},
      {value: "https://pytesseract-dev.oec.world/tesseract/", label: "OEC"},
      {value: "https://idj.api.dev.datawheel.us/tesseract/", label: "IDJ"},
      {value: "https://api-ts-dev.datausa.io/tesseract/", label: "DATA USA"}
    ],
    []
  );

  return (
    <SettingsProvider locales={locales} servers={items}>
      {settings => (
        <Explorer
          // pagination={{defaultLimit: 100, rowsLimits: [100, 300, 500, 1000]}}
          // defaultCube="gastat_gdp"
          measuresActive={5}
          serverURL={settings.server.value}
          serverConfig={settings.server.config}
          defaultOpenParams="drilldowns"
          formatters={formatters}
          height={"calc(100vh - 50px)"}
          locale={settings.locale}
          panels={[
            {key: "table", label: "Data Table", component: TableView},
            {key: "matrix", label: "Pivot Table", component: PivotView},
            {key: "vizbuilder", label: "Vizbuilder", component: VizbuilderView}
          ]}
          translations={translations}
          withinMantineProvider={false}
          withinReduxProvider
          withMultiQuery
          withPermalink
        />
      )}
    </SettingsProvider>
  );
}

function mount(container) {
  const root = createRoot(container);
  root.render(<App />);
}
