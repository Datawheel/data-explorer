import * as React from "react";
import {QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";
const queryClient = new QueryClient();

function AppProviders({children}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export {AppProviders};
