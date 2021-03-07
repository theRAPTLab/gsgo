/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR_EndPoint = require('./client-endpoint');
const NETWORK = require('./client-urnet');
const PROTOCOL = require('./client-netprotocols');
const DEVICES = require('./client-netdevices');
const EXEC = require('./client-exec');
const PROMPTS = require('./util/prompts');
const DBGTEST = require('./util/client-debug');

const PR = PROMPTS.makeStyleFormatter('UR');
const DBG = false;

/// CLASSES ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PhaseMachine = require('./class-phase-machine');

/// META DATA /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** these properties are exported from the library so you can tell if the
 *  ur instance you're using is serverside or clientside, if that needs
 *  to be checked
 */
const META = {
  _CLIENT: true,
  _SCRIPT: __filename,
  _VERSION: '0.0.1'
};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const LocalNode = new UR_EndPoint('ur-client'); // local mesaging
const NetNode = new UR_EndPoint('ur-sender'); // server messaging
let URSYS_RUNNING = false;
let URSYS_ROUTE = '';

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize modules that participate in UR EXEC PhaseMachine before running
 *  SystemNetBoot, which starts the URSYS lifecycle.
 */
async function SystemStart(route) {
  if (URSYS_RUNNING) {
    const out = 'SystemStart: URSYS already running!!!';
    console.log(...PR(out));
    return Promise.reject(out);
  }
  if (route === undefined) {
    const out = 'SystemStart: arg1 must be a route/path';
    console.log(...PR(out));
    return Promise.reject(out);
  }
  // autoconnect to URSYS network during NET_CONNECT
  PhaseMachine.Hook(
    'UR/NET_CONNECT',
    () =>
      new Promise((resolve, reject) =>
        NETWORK.URNET_Connect(NetNode, { success: resolve, failure: reject })
      )
  );
  // autoregister messages
  PhaseMachine.Hook('UR/APP_CONFIGURE', async () => {
    let result = await LocalNode.ursysRegisterMessages();
    if (DBG)
      console.log(...PR('message handlers registered with NETWORK:', result));
  });
  // complete startup
  URSYS_RUNNING = true;
  URSYS_ROUTE = route;

  return Promise.resolve();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize
 */
async function SystemStop() {
  if (!URSYS_RUNNING) {
    console.log(...PR('SystemModulesStop: URSYS is not running!!!'));
    return Promise.resolve();
  }
  // close the network
  await NETWORK.URNET_Close();
  URSYS_RUNNING = false;
  return Promise.resolve();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  ...META,
  // NETWORK MESSAGES
  DeclareMessage: LocalNode.declareMessage,
  HasMessage: LocalNode.hasMessage,
  HandleMessage: LocalNode.handleMessage,
  UnhandleMessage: LocalNode.unhandleMessage,
  SendMessage: LocalNode.sendMessage,
  RaiseMessage: LocalNode.raiseMessage,
  CallMessage: LocalNode.callMessage,
  // FORWARDED GENERIC PHASE MACHINE
  SystemHook: PhaseMachine.Hook,
  // SYSTEM STARTUP
  SystemStart,
  SystemStop,
  // ROUTE INFO
  IsRoute: route => URSYS_ROUTE === route,
  ServerIP: NETWORK.ServerIP,
  ServerPort: NETWORK.ServerPort,
  WebServerPort: NETWORK.WebServerPort,
  ConnectionString: NETWORK.ConnectionString,
  NetInfoRoute: NETWORK.NetInfoRoute,
  // FORWARDED SYSTEM CONTROL VIA EXEC
  SystemNetBoot: EXEC.SystemNetBoot,
  SystemAppConfig: EXEC.SystemAppConfig,
  SystemAppRun: EXEC.SystemAppRun,
  SystemAppRestage: EXEC.SystemAppRestage,
  SystemNetReboot: EXEC.SystemNetReboot,
  SystemAppUnload: EXEC.SystemAppUnload,
  // FORWARDED PROMPT UTILITY
  PrefixUtil: PROMPTS.makeStyleFormatter,
  ColorTagUtil: PROMPTS.colorTagString,
  SetPromptColor: PROMPTS.setPromptColor,
  HTMLConsoleUtil: PROMPTS.makeHTMLConsole,
  PrintTagColors: PROMPTS.printTagColors,
  // FORWARDED CLASSES
  class: { PhaseMachine },
  // FORWARDED DEBUG UTILITY
  addConsoleTools: (ur = UR) => {
    DBGTEST.addConsoleTools(ur);
  }
};
module.exports = UR;
