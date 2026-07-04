import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function RootHtml({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();

  return (
    <html {...htmlAttributes} lang="en" style={{ width: '100%', height: '100%' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#030303" />
        <meta name="color-scheme" content="light dark" />
        <meta name="strix-verification" content="strix-verify-0082" />
        {headNodes}
        <ScrollViewStyleReset />
        <style>{`
          :root {
            --mk-scrollbar-track: rgba(9, 9, 9, 0.08);
            --mk-scrollbar-track-hover: rgba(9, 9, 9, 0.12);
            --mk-scrollbar-thumb: rgba(9, 9, 9, 0.34);
            --mk-scrollbar-thumb-hover: rgba(9, 9, 9, 0.52);
            --mk-scrollbar-thumb-active: rgba(9, 9, 9, 0.68);
            --mk-focus-ring: #B68A2C;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --mk-scrollbar-track: rgba(248, 248, 245, 0.08);
              --mk-scrollbar-track-hover: rgba(248, 248, 245, 0.12);
              --mk-scrollbar-thumb: rgba(248, 248, 245, 0.32);
              --mk-scrollbar-thumb-hover: rgba(214, 184, 102, 0.52);
              --mk-scrollbar-thumb-active: rgba(214, 184, 102, 0.72);
              --mk-focus-ring: #D6B866;
            }
          }

          html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          html {
            scrollbar-gutter: stable;
          }

          *, *::before, *::after {
            box-sizing: border-box;
          }

          body {
            overflow-y: scroll;
            overflow-x: hidden;
            background: #F4F7F5;
            color: #13211D;
            color-scheme: light dark;
          }

          * {
            scrollbar-color: var(--mk-scrollbar-thumb) var(--mk-scrollbar-track);
            scrollbar-width: thin;
          }

          *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }

          *::-webkit-scrollbar-track {
            background: var(--mk-scrollbar-track);
            border-radius: 999px;
          }

          *::-webkit-scrollbar-thumb {
            min-height: 48px;
            background: var(--mk-scrollbar-thumb);
            background-clip: content-box;
            border: 2px solid transparent;
            border-radius: 999px;
          }

          *::-webkit-scrollbar-track:hover {
            background: var(--mk-scrollbar-track-hover);
          }

          *::-webkit-scrollbar-thumb:hover {
            background: var(--mk-scrollbar-thumb-hover);
            background-clip: content-box;
          }

          *::-webkit-scrollbar-thumb:active {
            background: var(--mk-scrollbar-thumb-active);
            background-clip: content-box;
          }

          *::-webkit-scrollbar-button {
            display: none;
            width: 0;
            height: 0;
          }

          *::-webkit-scrollbar-corner {
            background: transparent;
          }

          *:focus-visible {
            outline: 3px solid var(--mk-focus-ring);
            outline-offset: 3px;
          }

          .moneykai-boneyard-shell {
            display: flex;
            flex: 1 1 auto;
            min-height: 100vh;
            width: 100%;
            background: #F4F7F5;
          }

          .moneykai-boneyard-shell > [data-boneyard-content] {
            display: flex;
            flex: 1 1 auto;
            min-height: 100vh;
            width: 100%;
          }

          .moneykai-boneyard-shell > [data-boneyard-content] > * {
            flex: 1 1 auto;
            min-width: 0;
            width: 100%;
          }

          .moneykai-boneyard-fallback {
            min-height: 100vh;
            width: 100%;
            background:
              linear-gradient(100deg, rgba(232, 238, 242, 0.92) 8%, rgba(247, 250, 252, 0.96) 18%, rgba(232, 238, 242, 0.92) 33%),
              #F4F7F5;
            background-size: 200% 100%;
            animation: moneykai-boneyard-fallback 1.6s linear infinite;
          }

          @keyframes moneykai-boneyard-fallback {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
          }

          .skip-link {
            position: absolute;
            left: 16px;
            top: -64px;
            z-index: 10000;
            border-radius: 8px;
            background: #0F766E;
            color: #FFFFFF;
            font: 600 14px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 10px 14px;
            text-decoration: none;
            transition: top 160ms ease-out;
          }

          .skip-link:focus {
            top: 16px;
          }
        `}</style>
      </head>
      <body {...bodyAttributes}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
