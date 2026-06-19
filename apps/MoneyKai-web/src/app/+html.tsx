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
        <meta name="theme-color" content="#0F766E" />
        <meta name="color-scheme" content="light dark" />
        {headNodes}
        <ScrollViewStyleReset />
        <style>{`
          :root {
            --mk-scrollbar-track: rgba(15, 118, 110, 0.08);
            --mk-scrollbar-track-hover: rgba(15, 118, 110, 0.12);
            --mk-scrollbar-thumb: rgba(15, 118, 110, 0.34);
            --mk-scrollbar-thumb-hover: rgba(15, 118, 110, 0.52);
            --mk-scrollbar-thumb-active: rgba(15, 78, 74, 0.68);
            --mk-focus-ring: #14B8A6;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --mk-scrollbar-track: rgba(221, 247, 241, 0.08);
              --mk-scrollbar-track-hover: rgba(221, 247, 241, 0.12);
              --mk-scrollbar-thumb: rgba(125, 211, 199, 0.38);
              --mk-scrollbar-thumb-hover: rgba(125, 211, 199, 0.56);
              --mk-scrollbar-thumb-active: rgba(191, 245, 234, 0.72);
              --mk-focus-ring: #7DD3C7;
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
