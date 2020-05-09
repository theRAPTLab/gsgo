/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NextJS Material UI Custom Document Template
  based on:
  https://github.com/mui-org/material-ui/blob/master/examples/nextjs

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheets } from '@material-ui/core/styles';
import theme from '../modules/style/theme';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

/// RETRIEVE PROPS FROM SERVER ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This code adds MUI StyleSheets to SSR
/// github.com/mui-org/material-ui/tree/master/examples/nextjs
/// NOTE: for _document, getInitialProps is only called on the server
/// ALSO: nextjs.org/docs/advanced-features/custom-document
/// ALSO: material-ui.com/guides/server-rendering/#material-ui-on-the-server
/// RELATED: medium.com/manato/b1e88ac11dfa (alt styling convention)
MyDocument.getInitialProps = async ctx => {
  // 1. prep CSS-IN-JS libraries with custom render page
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;
  // 2. inject new props (this doesn't work with ursys)
  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props => sheets.collect(<App {...props} />)
    });
  // 3. call original getInitialProps with updated context
  const initialProps = await Document.getInitialProps(ctx);
  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement()
    ]
  };
};
