import * as React from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
const queryClient = new QueryClient();
import {TableRefreshProvider} from "../components/TableView";

function AppProviders({children}) {
  return (
    <QueryClientProvider client={queryClient}>
      <TableRefreshProvider>{children}</TableRefreshProvider>
    </QueryClientProvider>
  );
}

export {AppProviders};
