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

/// URSYS MODULES /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import SETTINGS from 'config/app.settings';
import UR from '@gemstep/ursys/client';
import SystemShell from './SystemShell';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { PROJECT_NAME } = SETTINGS;
const PR = UR.PrefixUtil('SYSTEM', 'TagBlue');

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render react once all modules have completed their initialization */
UR.SystemHook('UR', 'APP_READY', () => {
  return new Promise(resolve => {
    ReactDOM.render(
      <HashRouter hashType="slash">
        <SystemShell />
      </HashRouter>,
      document.getElementById('app-container'),
      () => {
        resolve();
      }
    );
  }); // promise
});

/// URSYS STARTUP /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init() {
  console.log(...PR('URSYS INITIALIZING...'));

  // initialize app when DOM is completely resolved
  document.addEventListener('DOMContentLoaded', () => {
    // initialize URSYS
    (async () => {
      console.log(...PR('URSYS CONNECTING...'));
      const response = await fetch('/urnet/getinfo');
      const netProps = await response.json();
      await UR.SystemStart();
      console.log(...PR(`${PROJECT_NAME.toUpperCase()} SYSTEM BOOT`));
      await UR.SystemBoot({
        autoRun: true,
        netProps
      });
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
