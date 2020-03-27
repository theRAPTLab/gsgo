/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NextJS Material UI Custom Document Template

  (1) This is how we add things to the <head>. For Material UI, this is
  specifically setting the <meta name="viewport" ...> and loading the Roboto
  font via <link>

  (2) Also you can hook into pre-populating the page rather than pulling the
  content from the client for SEO purposes through getStaticProps and
  getServerSideProps.
  https://nextjs.org/docs/basic-features/data-fetching

  ---
  NOTE: Custom document templates are an advanced NextJS feature:
  https://nextjs.org/docs/advanced-features/custom-document

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Document, { Head, Main, NextScript } from 'next/document';
import theme from '../src/theme';

export default class MyDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
