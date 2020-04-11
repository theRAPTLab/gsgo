/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NextJS Material UI Custom Application Template
  based on:
  https://github.com/mui-org/material-ui/blob/master/examples/nextjs

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
///
import { create } from 'jss';
import extend from 'jss-extend';
import { StylesProvider, jssPreset } from '@material-ui/styles';
///
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
///
import theme from '../modules/style/theme';
import APPSTATE from '../modules/appstate';

/// EXTRA: ADD EXTRA JSS PLUGINS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// from https://material-ui.com/styles/advanced/#jss-plugins
const jss = create({
  plugins: [...jssPreset().plugins, extend()]
});

/// COMPONENT EXPORT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default function MyApp(props) {
  const { Component, pageProps } = props;

  return (
    <StylesProvider jss={jss}>
      <Head>
        <title>GEMSTEP</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Component {...pageProps} store={APPSTATE} />
      </ThemeProvider>
    </StylesProvider>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired
};
