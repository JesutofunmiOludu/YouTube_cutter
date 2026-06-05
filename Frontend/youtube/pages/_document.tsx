import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Google Fonts ─────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* ── SEO / Theme ──────────────────────────────── */}
        <meta name="application-name" content="VidMind AI" />
        <meta name="author" content="VidMind AI" />
        <meta
          name="description"
          content="Paste any YouTube link. AI splits it into chapters, transcribes it, and builds a cited research report — in seconds."
        />
        <meta
          name="keywords"
          content="YouTube learning, AI video summarizer, video transcription, deep research AI, video chapters, study tool"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#F1EFE8"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#141412"
        />

        {/* ── Open Graph ───────────────────────────────── */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="VidMind AI" />
        <meta
          property="og:title"
          content="VidMind AI — Smart Video Learning & Research"
        />
        <meta
          property="og:description"
          content="Stop watching. Start understanding. AI-powered video learning platform."
        />

        {/* ── Twitter Card ─────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@vidmindai" />
        <meta name="twitter:title" content="VidMind AI" />
        <meta
          name="twitter:description"
          content="Stop watching. Start understanding."
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
