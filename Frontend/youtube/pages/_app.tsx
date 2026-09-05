import { useEffect, ReactElement, ReactNode } from "react";
import Head from "next/head";
import "@/index.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import { ToastProvider } from "@components/ui/Toast";
import { QueryProvider } from "@components/providers/QueryProvider";

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Suppress unhandled promise rejections coming from browser extensions (e.g. MetaMask inpage.js)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason?.stack || event.reason?.message || event.reason || '');
      if (reasonStr.includes('chrome-extension://') || reasonStr.includes('inpage.js') || reasonStr.includes('MetaMask')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <QueryProvider>
      <Head>
        <title>ClipMide</title>
        <meta name="application-name" content="ClipMide" />
        <link rel="icon" href="/logo.png" />
      </Head>
      <ToastProvider>
        {getLayout(<Component {...pageProps} />)}
      </ToastProvider>
    </QueryProvider>
  );
}
