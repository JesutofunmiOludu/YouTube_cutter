import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" data-scroll-behavior="smooth">
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
        <meta name="application-name" content="ClipMide" />
        <meta name="author" content="ClipMide" />
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
        <meta property="og:site_name" content="ClipMide" />
        <meta
          property="og:title"
          content="ClipMide — Smart Video Learning & Research"
        />
        <meta
          property="og:description"
          content="Stop watching. Start understanding. AI-powered video learning platform."
        />

        {/* ── Twitter Card ─────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@clipmide" />
        <meta name="twitter:title" content="ClipMide" />
        <meta
          name="twitter:description"
          content="Stop watching. Start understanding."
        />
        {/* ── Suppress MetaMask / Phantom / crypto extension errors ──
            Web3 wallet extensions (Phantom, MetaMask, Rabby) inject
            window.ethereum into every tab and conflict with each other by
            trying to redefine window.ethereum, or throw connection errors.
            This inline script runs before React hydrates and safely guards
            Object.defineProperty and silences extension error events.       */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  // 1. Guard Object.defineProperty for 'ethereum' so conflicting wallet extensions don't crash
  var origDefineProperty = Object.defineProperty;
  Object.defineProperty = function (obj, prop, descriptor) {
    try {
      if (prop === 'ethereum') {
        try {
          return origDefineProperty.call(Object, obj, prop, Object.assign({}, descriptor, { configurable: true }));
        } catch (e) {
          return obj;
        }
      }
      return origDefineProperty.apply(Object, arguments);
    } catch (e) {
      if (prop === 'ethereum' || (e && e.message && e.message.includes('ethereum'))) {
        return obj;
      }
      throw e;
    }
  };

  // 2. Suppress extension console.error from being forwarded to the Next.js dev terminal
  var origConsoleError = console.error;
  console.error = function () {
    var args = Array.prototype.slice.call(arguments);
    var firstArg = args[0] ? String(args[0].message || args[0].stack || args[0]) : '';
    if (
      firstArg.includes('ethereum') ||
      firstArg.includes('evmAsk.js') ||
      firstArg.includes('chrome-extension://') ||
      firstArg.includes('inpage.js') ||
      firstArg.includes('MetaMask')
    ) {
      return;
    }
    return origConsoleError.apply(console, arguments);
  };

  // 3. Suppress extension error events and unhandled rejections from triggering the Next.js dev overlay
  var _origAddEventListener = window.addEventListener.bind(window);
  window.addEventListener = function (type, listener, options) {
    if (type === 'unhandledrejection' || type === 'error') {
      var wrapped = function (event) {
        var err = event && (event.error || event.reason || {});
        var msg = String(event.message || err.message || err.stack || err || '');
        var file = String(event.filename || err.fileName || '');
        if (
          msg.includes('chrome-extension://') ||
          msg.includes('inpage.js') ||
          msg.includes('MetaMask') ||
          msg.includes('Failed to connect to MetaMask') ||
          msg.includes('Cannot redefine property: ethereum') ||
          file.includes('chrome-extension://') ||
          file.includes('evmAsk.js')
        ) {
          if (event.preventDefault) event.preventDefault();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          return;
        }
        listener(event);
      };
      return _origAddEventListener(type, wrapped, options);
    }
    return _origAddEventListener(type, listener, options);
  };
})();
            `,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
