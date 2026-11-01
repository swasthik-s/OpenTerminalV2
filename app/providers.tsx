"use client";

import {useState,type ReactNode} from "react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";

export function Providers({children}:{children:ReactNode}){
  const [queryClient]=useState(()=>new QueryClient({
    defaultOptions:{
      queries:{
        staleTime:15_000,
        refetchOnWindowFocus:false,
        retry:1,
      },
    },
  }));
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
