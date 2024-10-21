import React, {useMemo} from "react";
import {createRoot} from "react-dom/client";
import {Explorer, PivotView, TableView, TourStep, VizbuilderView} from "../src/main";
import * as translations from "../translations";
import {type ServerOption, SettingsProvider} from "./Settings";
import {Center, Image} from "@mantine/core";
import {IconDatabase} from "@tabler/icons-react";

/**
 * Default formatters as example.
 * The client app should provide or not custom formatters.
 */
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
          height={"calc(100vh - 60px)"}
          locale={settings.locale}
          panels={[
            {key: "table", label: "Data Table", component: TableView},
            {key: "matrix", label: "Pivot Table", component: PivotView},
            {key: "vizbuilder", label: "Vizbuilder", component: VizbuilderView},
          ]}
          tourConfig={{
            introImage: <Center p="xl" bg="dark.1">
                <Image src="https://datasaudi.sa/images/tour/tour-start.png" height={120} width="auto" fit="contain" />
              </Center>,
            extraSteps: [
              {
                selector: "body",
                content: <TourStep title="Extra Step" texts={"This is an extra step added via props"} />
              }
            ],
          }}
          toolbarConfig={{
            buttons: [
              {icon: <IconDatabase strokeWidth={1.5}/>, label: "Dataset", onClick: () => alert("Explore datasets!")}
            ],
            showLabels: true,
          }}
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
