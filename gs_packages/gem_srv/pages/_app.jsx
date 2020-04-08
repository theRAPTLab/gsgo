/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  NextJS Material UI Custom Application Template

  This is how we add global stuff to the app, like managing state while
  navigating pages. I think this works because this is loaded just once, and the
  actual contents of the app are loaded dynamically when <Component> changes.

  ---
  NOTE: Custom Application Templates is an advanced NextJS feature:
  https://nextjs.org/docs/advanced-features/custom-app

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import App from 'next/app';
import Head from 'next/head';
///
import { create } from 'jss';
import { StylesProvider, jssPreset } from '@material-ui/styles';
import extend from 'jss-extend';
///
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
///
import { Provider } from 'react-redux';
import store from '../redux/store';
///
import theme from '../src/theme';
///
import GSLoginBar from '../src/components/ExLoginBar';
import GSTabbedNav from '../src/components/ExTabbedNav';

/// ADD EXTRA JSS PLUGINS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const jss = create({
  plugins: [...jssPreset().plugins, extend()]
});

/// CREATE CHEESEBALL STORE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STORE = {
  currentTab: 0
};

/// COMPONENT EXPORT //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MyApp extends App {
  //
  static async getInitialProps({ Component, ctx }) {
    const pageProps = Component.getInitialProps
      ? await Component.getInitialProps(ctx)
      : {};

    //Anything returned here can be accessed by the client
    return { pageProps };
  }

  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }

  render() {
    const { Component, pageProps } = this.props;

    return (
      <Provider store={store}>
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
            <GSLoginBar />
            <GSTabbedNav />
            <Component {...pageProps} store={STORE} />
          </ThemeProvider>
        </StylesProvider>
      </Provider>
    );
  }
}

export default MyApp;
