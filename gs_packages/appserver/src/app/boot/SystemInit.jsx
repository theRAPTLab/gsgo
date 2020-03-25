/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemInit - Start Lifecycle of Application

  SystemInit is executed from web-index.js, which itself is loaded by
  web-index.html

  It starts the URSYS lifecycle system, then spawns React SystemShell
  with a ReactRouter <HashRouter> that loades <SystemShell>

  TYPESCRIPT NOTE
  import Foo from 'App/modules/add'; // typescript test
  console.log(Foo(1, 'a'));

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import debounce from 'debounce';

/// URSYS MODULES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import SystemShell from './SystemShell';
import CCSS from 'app/modules/console-styles';
const { cssur, cssreset } = CCSS;
import EXEC from 'ursys/chrome/ur-exec';
import SETTINGS from 'config/app.settings';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { PROJECT_NAME } = SETTINGS;

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// SYSTEM-WIDE LANGUAGE EXTENSIONS ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are loaded in init to make sure they are available globally!
/// You do not need to copy these extensions to your own module files

/// URSYS STARTUP /////////////////////////////////////////////////////////////
/// STARTUP HELPER FUNCTIONS
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PromiseRenderApp() {
  if (DBG) console.log('%cINIT %cReactDOM.render() begin', 'color:blue', 'color:auto');
  return new Promise((resolve) => {
    ReactDOM.render(
      <HashRouter hashType="slash">
        <SystemShell />
      </HashRouter>,
      document.getElementById('app-container'),
      () => {
        console.log('%cURSYS: START', cssur);
        resolve();
      }
    );
  }); // promise
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init() {
  console.log('%cURSYS: INITIALIZE', cssur);
  // handle window resize events through URSYS
  window.addEventListener('resize', debounce(() => {
    // console.clear();
  }, 500));
  // initialize app when DOM is completely resolved
  document.addEventListener('DOMContentLoaded', () => {
    if (DBG) console.log('%cINIT %cDOMContentLoaded. Starting URSYS Lifecycle!', cssur, cssreset);
    // 1. preflight system routes
    // 2. lifecycle startup
    (async () => {
      await EXEC.JoinNet();
      await EXEC.EnterApp();
      await m_PromiseRenderApp(); // compose React view
      await EXEC.SetupDOM();
      await EXEC.SetupRun();
      /* everything is done, system is running */
      if (DBG) console.log('%cINIT %cURSYS Lifecycle Init Complete', 'color:blue', 'color:auto');
    })();
  });
  // handle disconnect event
  document.addEventListener('URSYSDisconnect', () => {
    console.log(`${PROJECT_NAME} SERVER HAS DISCONNECTED`);
    document.location.reload();
  });
}


/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Init };
