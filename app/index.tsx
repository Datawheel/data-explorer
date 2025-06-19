import {Box, Center, Image} from "@mantine/core";
import {IconDatabase} from "@tabler/icons-react";
import React, {useMemo} from "react";
import {createRoot} from "react-dom/client";
import {
  Explorer,
  PivotView,
  RawResponseView,
  TableView,
  TourStep,
  VizbuilderView
} from "../src/main";
import * as translations from "../translations";
import {type ServerOption, SettingsProvider} from "./Settings";

/**
 * Harmonized System (HS) Code Formatter
 *
 * The Harmonized System is an international nomenclature for the classification of products.
 * It allows participating countries to classify traded goods on a common basis for customs purposes.
 *
 * HS Code structure:
 * - Section (Roman numeral): Broad category (I to XXI)
 * - Chapter (2 digits): More specific category
 * - Heading (4 digits): Specific type of good
 * - Subheading (6 digits, HS6): More detailed classification
 * - National tariff lines (8-10 digits): Country-specific classifications
 */

function formatHSCode(code: number): string {
  const codeString = code.toString();

  if (codeString.length > 10) {
    return "Error: Input must be 10 digits or fewer.";
  }

  function toRoman(num: number): string {
    const romanNumerals = [
      {value: 100, numeral: "C"},
      {value: 90, numeral: "XC"},
      {value: 50, numeral: "L"},
      {value: 40, numeral: "XL"},
      {value: 10, numeral: "X"},
      {value: 9, numeral: "IX"},
      {value: 5, numeral: "V"},
      {value: 4, numeral: "IV"},
      {value: 1, numeral: "I"}
    ];
    let result = "";
    for (const {value, numeral} of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }

  // Section (one or two digits)
  if (codeString.length <= 2) {
    return toRoman(Number.parseInt(codeString));
  }

  // Format based on HS Code structure
  switch (codeString.length) {
    case 3:
    case 4:
      return `${codeString.slice(-4, -2).padStart(2, "0")}.${codeString.slice(-2)}`; // Heading
    case 5:
    case 6:
      return `${codeString.slice(-6, -2).padStart(4, "0")}.${codeString.slice(-2)}`; // Subheading (HS6)
    case 7:
    case 8:
    case 9:
    case 10:
      return `${codeString.slice(-10, -6).padStart(4, "0")}.${codeString.slice(-6)}`; // National tariff lines
    default:
      return codeString;
  }
}
/**
 * Default formatters as example.
 * The client app should provide or not custom formatters.
 */
const formatters = {
  Index: n => (typeof n === "number" ? n.toFixed(3) : n || " "),
  "Metric Ton": n => `${n.toFixed()} 📦`,
  Sheep: n => `🐑 ${n.toFixed()}`
};

const idFormatters = {
  "Country ID": function removeFirstTwo(str) {
    return str.slice(2);
  },
  "Importer Country ID": function removeFirstTwo(str) {
    return str.slice(2);
  },
  "Exporter Country ID": function removeFirstTwo(str) {
    return str.slice(2);
  },
  "Section ID": formatHSCode,
  "HS2 ID": formatHSCode,
  "HS4 ID": formatHSCode,
  "HS6 ID": formatHSCode
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
      {value: "https://api-v2.oec.world/tesseract/", label: "OEC"},
      {value: "https://idj-api-prod.datawheel.us/tesseract/", label: "IDJ"},
      {value: "https://api-ts-dev.datausa.io/tesseract/", label: "DATA USA"}
    ],
    []
  );

  return (
    <SettingsProvider locales={locales} servers={items}>
      {settings => (
        <Box className="" h="calc(100vh - 50px)">
          <Explorer
            // pagination={{defaultLimit: 100, rowsLimits: [100, 300, 500, 1000]}}
            // defaultCube="gastat_gdp"
            // locale={settings.locale}
            // defaultDataLocale={settings.locale}
            defaultCube="mot_number_of_overnight_stays_by_tourists_type"
            defaultLocale={settings.locale}
            measuresActive={5}
            serverURL={settings.server.value}
            serverConfig={settings.server.config}
            defaultOpenParams="drilldowns"
            formatters={formatters}
            idFormatters={idFormatters}
            height={"100%"}
            panels={[
              {key: "table", label: "Data Table", component: TableView},
              {key: "matrix", label: "Pivot Table", component: PivotView},
              {key: "vizbuilder", label: "Vizbuilder", component: VizbuilderView},
              {key: "raw", label: "Raw Response", component: RawResponseView}
            ]}
            sortLocale="en"
            tourConfig={{
              introImage: (
                <Center p="xl" bg="dark.1">
                  <Image
                    src="https://datasaudi.sa/images/tour/tour-start.png"
                    height={120}
                    width="auto"
                    fit="contain"
                  />
                </Center>
              ),
              extraSteps: [
                {
                  selector: "body",
                  content: (
                    <TourStep title="Extra Step" texts={"This is an extra step added via props"} />
                  )
                }
              ]
            }}
            toolbarConfig={{
              buttons: [
                {
                  icon: <IconDatabase strokeWidth={1.5} />,
                  label: "Dataset",
                  onClick: () => alert("Explore datasets!")
                }
              ],
              showLabels: true
            }}
            translations={translations}
            withinMantineProvider={false}
            withinReduxProvider
            withMultiQuery
            withPermalink
          />
        </Box>
      )}
    </SettingsProvider>
  );
}

function mount(container) {
  const root = createRoot(container);
  root.render(<App />);
}
