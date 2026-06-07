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
        <meta name="theme-color" content="#111111" />
        {headNodes}
        <style>{`
          html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
          }

          body {
            overflow-y: auto;
            overflow-x: hidden;
            background: #fafafa;
          }
        `}</style>
        <ScrollViewStyleReset />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
