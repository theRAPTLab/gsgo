/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemInit - Start Lifecycle of Application

  SystemInit is executed from web-index.js, which itself is loaded by
  web-index.html

  It starts the URSYS lifecycle system, then spawns React SystemShell
  with a ReactRouter <HashRouter> that loades <SystemShell>

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
/// URSYS LIBRARIES ///////////////////////////////////////////////////////////
import UR from '@gemstep/ursys/client';
/// MATERIAL UI LIBRARIES /////////////////////////////////////////////////////
import CssBaseline from '@material-ui/core/CssBaseline';
import { create } from 'jss';
import extend from 'jss-plugin-extend';
import {
  StylesProvider,
  jssPreset,
  ThemeProvider
} from '@material-ui/core/styles';
/// MAIN APP SHELL ////////////////////////////////////////////////////////////
import SETTINGS from 'config/app.settings';
import theme from 'modules/style/theme';
import SystemShell from './SystemShell';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { PROJECT_NAME } = SETTINGS;
const PR = UR.PrefixUtil('SYSTEM', 'TagSystem');
const NPR = UR.PrefixUtil('URSYS ', 'TagUR');
const AR = UR.PrefixUtil('URSYS ', 'TagRainbow');

/// EXTRA: ADD EXTRA JSS PLUGINS //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// from https://material-ui.com/styles/advanced/#jss-plugins
const jss = create({
  plugins: [...jssPreset().plugins, extend()]
});

/// URSYS STARTUP /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Init is called from the startup js file, usually in index.html.
 *  This starts the multi-step URSYS lifecycle startup.
 */
function Init() {
  console.log(...PR('URSYS INITIALIZING...'));
  // initialize app when DOM is completely resolved
  document.addEventListener('DOMContentLoaded', () => {
    // reset body margins to 0
    document.body.style.margin = '0px';
    console.log(...PR('FYI: setting document.body.style.margin to 0'));
    // initialize URSYS synchronously
    (async () => {
      await UR.SystemStart(document.location.pathname);
      await UR.SystemNetBoot();
      // start React
      ReactDOM.render(
        <StylesProvider jss={jss}>
          <BrowserRouter forceRefresh>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <SystemShell />
            </ThemeProvider>
          </BrowserRouter>
        </StylesProvider>,
        document.getElementById('app-container'),
        () => {
          // at this time, the shell should be completely renderered
          // but componentDidMount() happens AFTER the first render
          // to guarantees that the DOM is stable
          UR.addConsoleTools();
          console.log(...AR('APP: <SystemShell> React+UR lifecycles starting'));
        }
      );
    })();
  });

  // handle disconnect event
  document.addEventListener('URSYSDisconnect', () => {
    console.log(...PR(`${PROJECT_NAME.toUpperCase} SYSTEM DISCONNECTED`));
    document.location.reload();
  });
}
/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// console debugger message listeners
UR.addConsoleToolHandlers();

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Init };
