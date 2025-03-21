import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TableRefreshProvider} from "../components/TableView";
import {LogicLayerProvider} from "../api/context";
import {QueryProvider} from "./query";
import {BrowserRouter as Router} from "react-router-dom";

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: React.ReactNode;
  serverURL: string;
  defaultCube?: string;
  defaultQuery?: any;
}

function AppProviders({children, serverURL, defaultCube, defaultQuery}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider serverURL={serverURL}>
        <LogicLayerProvider serverURL={serverURL}>
          <QueryProvider
            defaultCube={defaultCube}
            defaultQuery={defaultQuery}
            serverURL={serverURL}
          >
            {children}
          </QueryProvider>
        </LogicLayerProvider>
      </TableRefreshProvider>
    </QueryClientProvider>
  );
}

export {AppProviders};
