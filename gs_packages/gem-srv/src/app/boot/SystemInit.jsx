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

/// URSYS MODULES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import UR from '@gemstep/ursys/client';
import SETTINGS from 'config/app.settings';
import SystemShell from './SystemShell';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { PROJECT_NAME } = SETTINGS;
const PR = UR.PrefixUtil('SYSTEM', 'TagBlue');

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
      const response = await fetch('/urnet/getinfo');
      const netProps = await response.json();
      await UR.SystemStart(document.location.pathname);
      // system boot runs BOOT,INIT,CONNECT phases
      await UR.SystemBoot({ netProps });
      // start React
      ReactDOM.render(
        <BrowserRouter forceRefresh>
          <SystemShell />
        </BrowserRouter>,
        document.getElementById('app-container'),
        () => {
          UR.addConsoleTools();
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

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Init };
