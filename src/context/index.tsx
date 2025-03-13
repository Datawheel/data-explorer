import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();
import {TableRefreshProvider} from "../components/TableView";

function AppProviders({children, serverURL}: {children: React.ReactNode; serverURL: string}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider serverURL={serverURL}>{children}</TableRefreshProvider>
    </QueryClientProvider>
  );
}

export {AppProviders};
