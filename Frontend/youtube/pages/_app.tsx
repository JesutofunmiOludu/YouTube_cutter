import "@/index.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@components/ui/Toast";
import { QueryProvider } from "@components/providers/QueryProvider";

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <QueryProvider>
      <ToastProvider>
        {getLayout(<Component {...pageProps} />)}
      </ToastProvider>
    </QueryProvider>
  );
}
