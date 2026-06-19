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
        <style>{`
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
            background: #07110F;
            color: #F5FBF8;
            color-scheme: light dark;
          }

          * {
            scrollbar-color: rgba(125, 211, 199, 0.72) rgba(7, 17, 15, 0.42);
            scrollbar-width: thin;
          }

          *::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          *::-webkit-scrollbar-track {
            background: rgba(7, 17, 15, 0.42);
          }

          *::-webkit-scrollbar-thumb {
            background: rgba(125, 211, 199, 0.72);
            border: 3px solid rgba(7, 17, 15, 0.42);
            border-radius: 999px;
          }

          *::-webkit-scrollbar-thumb:hover {
            background: rgba(125, 211, 199, 0.92);
          }

          *:focus-visible {
            outline: 3px solid #14B8A6;
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
        <ScrollViewStyleReset />
      </head>
      <body {...bodyAttributes}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
