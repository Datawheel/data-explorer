import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TableRefreshProvider} from "../components/TableView";
import {LogicLayerProvider} from "../api/context";
import {QueryProvider} from "./query";
import {useActions, useSettings} from "../hooks/settings";
import {useEffect} from "react";
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
  console.log(defaultLocale);
  const {translate: t, locale, setLocale} = useTranslation();

  useEffect(() => {
    actions.updateLocale(defaultLocale);
    updateUrl({...queryItem, params: {...queryItem.params, locale: defaultLocale}});
    setLocale(defaultLocale);
  }, [defaultLocale, setLocale]);

  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider serverURL={serverURL}>
        <LogicLayerProvider
          serverURL={serverURL}
          serverConfig={serverConfig}
          defaultDataLocale={defaultDataLocale}
        >
          <QueryProvider
            defaultCube={defaultCube}
            serverURL={serverURL}
            locale={defaultLocale}
            defaultDataLocale={defaultDataLocale}
          >
            {children}
          </QueryProvider>
        </LogicLayerProvider>
      </TableRefreshProvider>
    </QueryClientProvider>
  );
}

export {AppProviders};
