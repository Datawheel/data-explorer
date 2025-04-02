import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TableRefreshProvider} from "../components/TableView";
import {LogicLayerProvider} from "../api/context";
import {QueryProvider} from "./query";
import {useSettings} from "../hooks/settings";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: React.ReactNode;
}

function AppProviders({children}: AppProvidersProps) {
  const {serverURL, defaultCube, serverConfig, defaultDataLocale, defaultLocale} = useSettings();
  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider serverURL={serverURL}>
        <LogicLayerProvider serverURL={serverURL} serverConfig={serverConfig}>
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
