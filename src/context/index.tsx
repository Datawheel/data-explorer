import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {LogicLayerProvider} from "../api/context";
import {QueryProvider} from "./query";
import {useActions, useSettings} from "../hooks/settings";
import {useEffect, useRef} from "react";
import {selectCurrentQueryItem} from "../state/queries";
import {useSelector} from "react-redux";
import {useUpdateUrl} from "../hooks/permalink";
import {useTranslation} from "../hooks/translation";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppProviders({children}: AppProvidersProps) {
  const {serverURL, defaultCube, serverConfig, defaultDataLocale, defaultLocale} = useSettings();
  const updateUrl = useUpdateUrl();
  const queryItem = useSelector(selectCurrentQueryItem);
  const actions = useActions();
  const isInitialMount = useRef(true);
  const {setLocale} = useTranslation();

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
  );
}

export {AppProviders};
