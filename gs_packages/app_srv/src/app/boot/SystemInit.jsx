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
import SETTINGS from 'config/app.settings';
import UR from '@gemstep/ursys/client';
import SystemShell from './SystemShell';

/// HOOK MODULES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import RUNTIME from '../modules/sim/runtime';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { PROJECT_NAME } = SETTINGS;
const PR = UR.Prompt('SystemInit');

/// DEBUG CONTROL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

console.log(...PR('module parse'));

/// MODULE PHASE SYSTEM INITIALIZATION ////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render react once all modules have completed their initialization */
function UR_ModuleInit(UR_EXEC) {
  UR_EXEC.Hook('APP_READY', () => {
    if (DBG)
      console.log('%cINIT %cReactDOM.render() begin', 'color:blue', 'color:auto');
    return new Promise(resolve => {
      console.log(...PR('render() start'));
      ReactDOM.render(
        <HashRouter hashType="slash">
          <SystemShell />
        </HashRouter>,
        document.getElementById('app-container'),
        () => {
          console.log(...PR('render() end'));
          console.log('URSYS: START');
          resolve();
        }
      );
    }); // promise
  });
}

/// URSYS STARTUP /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init() {
  console.log('URSYS: INITIALIZE');

  // handle window resize events through URSYS
  window.addEventListener(
    'resize',
    debounce(() => {
      // console.clear();
    }, 500)
  );

  // initialize app when DOM is completely resolved
  document.addEventListener('DOMContentLoaded', () => {
    if (DBG) console.log('INIT DOMContentLoaded. Starting URSYS Lifecycle!');
    // initialize URSYS
    (async () => {
      const response = await fetch('/urnet/getinfo');
      const netProps = await response.json();
      await UR.SystemHookModules([RUNTIME, { UR_ModuleInit }]);
      await UR.SystemBoot({
        autoRun: true,
        netProps
      });
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
export default { Init, UR_ModuleInit };
