import {
  VizbuilderProvider,
  type VizbuilderProviderProps,
} from "@datawheel/vizbuilder/react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {assign} from "d3plus-common";
import identity from "lodash-es/identity";
import * as React from "react";
import {useEffect, useMemo, useRef} from "react";
import {useSelector} from "react-redux";

import {LogicLayerProvider} from "../api/context";
import {useFormatter} from "../hooks/formatter";
import {useUpdateUrl} from "../hooks/permalink";
import {useActions, useSettings} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectCurrentQueryItem} from "../state/queries";
import {QueryProvider} from "./query";

const queryClient = new QueryClient();

const defaultVizbuilderConfig: VizbuilderProviderProps = {
  chartLimits: {
    BARCHART_MAX_BARS: 20,
    BARCHART_MAX_STACKED_BARS: 10,
    BARCHART_VERTICAL_MAX_GROUPS: 12,
    BARCHART_VERTICAL_TOTAL_BARS: 240,
    BARCHART_YEAR_MAX_BARS: 20,
    DONUT_SHAPE_MAX: 30,
    LINEPLOT_LINE_MAX: 20,
    LINEPLOT_LINE_POINT_MIN: 2,
    STACKED_SHAPE_MAX: 200,
    STACKED_TIME_MEMBER_MIN: 2,
    TREE_MAP_SHAPE_MAX: 1000,
  },
  downloadFormats: ["SVG", "PNG"],
  CardErrorComponent: () => null, // Hides via Boundary ChartCards that throw error
};

export function AppProviders(props: {
  children: React.ReactNode;
  vizbuilderSettings?: VizbuilderProviderProps;
}) {
  const {children} = props;

  const {serverURL, defaultCube, serverConfig, defaultDataLocale, defaultLocale} =
    useSettings();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);
  const actions = useActions();
  const isInitialMount = useRef(true);
  const {setLocale, translate} = useTranslation();

  const {getFormatter} = useFormatter();

  const vizbuilderSettings = useMemo<VizbuilderProviderProps>(() => {
    const settings = assign(
      {
        translate(key, data) {
          return translate(`vizbuilder.${key}`, data);
        },
        getFormatter,
      },
      defaultVizbuilderConfig,
      props.vizbuilderSettings || {},
    );
    const vbPostprocessConfig = props.vizbuilderSettings?.postprocessConfig || identity;
    settings.postprocessConfig = (config, chart, params) => {
      config.scrollContainer = ".vb-wrapper";
      return vbPostprocessConfig(config, chart, params);
    };
    return settings;
  }, [props.vizbuilderSettings, getFormatter, translate]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    actions.updateLocale(defaultLocale);
    updateUrl({...queryItem, params: {...queryItem.params, locale: defaultLocale}});
    setLocale(defaultLocale);
  }, [defaultLocale, setLocale, actions]);

  return (
    <VizbuilderProvider {...vizbuilderSettings}>
      <QueryClientProvider client={queryClient}>
        <LogicLayerProvider
          serverURL={serverURL}
          serverConfig={serverConfig}
          defaultDataLocale={defaultDataLocale}
        >
          <QueryProvider defaultCube={defaultCube} serverURL={serverURL}>
            {children}
          </QueryProvider>
        </LogicLayerProvider>
      </QueryClientProvider>
    </VizbuilderProvider>
  );
}
