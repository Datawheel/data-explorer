import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TableRefreshProvider} from "../components/TableView";
import {LogicLayerProvider} from "../api/context";
import {QueryProvider} from "./query";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: React.ReactNode;
  serverURL: string;
  defaultCube?: string;
  defaultQuery?: any;
  locale?: string;
  defaultDataLocale?: string;
}

function AppProviders({
  children,
  serverURL,
  defaultCube,
  defaultQuery,
  locale,
  defaultDataLocale
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider serverURL={serverURL}>
        <LogicLayerProvider serverURL={serverURL}>
          <QueryProvider
            defaultCube={defaultCube}
            defaultQuery={defaultQuery}
            serverURL={serverURL}
            locale={locale}
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
