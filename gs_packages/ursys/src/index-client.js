/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NETWORK = require('./client-urnet');
const DEVICES = require('./client-netdevices');
const DB = require('./client-urdb');
const EXEC = require('./client-exec');
const PROMPTS = require('./util/prompts');
const DBGTEST = require('./util/client-debug');
const DATACORE = require('./client-datacore');
const COMMON = require('./ur-common');

// classes
const PhaseMachine = require('./class-phase-machine');
const StateGroupMgr = require('./class-state-group-mgr');
//
const {
  IsBrowser,
  IsNode,
  IsElectron,
  IsElectronMain,
  IsElectronRenderer
} = COMMON;

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('URSYS ', 'TagUR');
const DBG = false;

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
let URSYS_RUNNING = false;
let URSYS_ROUTE = '';
let LocalNode;
let NetNode;

/// SUPPORT API PART 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** register messages */
async function RegisterMessages() {
  if (DBG) console.log(...PR('registering messages'));
  return LocalNode.ursysRegisterMessages();
}

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
  PhaseMachine.Hook('UR/NET_CONNECT', () =>
    new Promise((resolve, reject) =>
      NETWORK.URNET_Connect({ success: resolve, failure: reject })
    ).then(data => {
      console.log(...PR('URNET established. UADDR is stable.'));
      const eps = DATACORE.GetSharedEndPoints();
      LocalNode = eps.LocalNode; // used only for local handle, send, call
      NetNode = eps.NetNode; // used only for forwarding remote messages
      return data;
    })
  );
  // autoregister messages
  PhaseMachine.Hook('UR/APP_CONFIGURE', async () => {
    let result = await RegisterMessages();
    if (DBG)
      console.log(...PR('message handlers registered with NETWORK:', result));
  });
  // complete startup
  URSYS_RUNNING = true;
  URSYS_ROUTE = route;
  DATACORE.SaveClientInfo({ uapp: URSYS_ROUTE });

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

/** wrap LocalNode functions so we can export them before LocalNode is valid */
function DeclareMessage(mesgName, dataProps) {
  return LocalNode.declareMessage(mesgName, dataProps);
}
function HasMessage(mesgName) {
  return LocalNode.hasMessage(mesgName);
}
function HandleMessage(mesgName, listener) {
  LocalNode.handleMessage(mesgName, listener);
}
function UnhandleMessage(mesgName, listener) {
  LocalNode.unhandleMessage(mesgName, listener);
}
function CallMessage(mesgName, inData, options) {
  return LocalNode.callMessage(mesgName, inData, options);
}
function RaiseMessage(mesgName, inData, options) {
  LocalNode.raiseMessage(mesgName, inData, options);
}
function SendMessage(mesgName, inData, options) {
  LocalNode.sendMessage(mesgName, inData, options);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  ...META,
  // NETWORK MESSAGES
  DeclareMessage,
  HasMessage,
  HandleMessage,
  UnhandleMessage,
  SendMessage,
  RaiseMessage,
  CallMessage,
  // FORWARDED GENERIC PHASE MACHINEc
  HookPhase: PhaseMachine.Hook,
  // SYSTEM ENVIRONMENT
  IsNode,
  IsBrowser,
  IsElectron,
  IsElectronRenderer,
  IsElectronMain,
  // DATABASE
  Query: DB.Query,
  // SYSTEM STARTUP
  SystemStart,
  SystemStop,
  // ROUTE INFO
  IsAppRoute: route => URSYS_ROUTE === route,
  AppRoute: () => URSYS_ROUTE,
  BrokerIP: NETWORK.ServerIP,
  ServerPort: NETWORK.ServerPort,
  WebServerPort: NETWORK.WebServerPort,
  ConnectionString: DATACORE.ConnectionString,
  NetInfoRoute: NETWORK.NetInfoRoute,
  GetUAddressNumber: DATACORE.GetUAddressNumber,
  GetDatabaseEndpoint: DATACORE.URDB_GraphQL,
  // FORWARDED SYSTEM CONTROL API
  SystemNetBoot: EXEC.SystemNetBoot,
  SystemAppConfig: EXEC.SystemAppConfig,
  SystemAppRun: EXEC.SystemAppRun,
  SystemAppRestage: EXEC.SystemAppRestage,
  SystemNetReboot: EXEC.SystemNetReboot,
  SystemAppUnload: EXEC.SystemAppUnload,
  ConsolePhaseInfo: EXEC.ConsolePhaseInfo,
  // FORWARDED DEVICE API
  GetDeviceDirectory: DEVICES.GetDeviceDirectory,
  NewDevice: DEVICES.NewDevice,
  RegisterDevice: DEVICES.RegisterDevice,
  SubscribeDeviceSpec: DEVICES.SubscribeDeviceSpec,
  SendControlFrame: DEVICES.SendControlFrame,
  LinkSubsToDevices: DEVICES.LinkSubsToDevices,
  // FORWARDED CONSOLE UTILITY
  PrefixUtil: PROMPTS.makeStyleFormatter,
  DPR: PROMPTS.dbgPrint,
  ColorTagUtil: PROMPTS.colorTagString,
  SetPromptColor: PROMPTS.setPromptColor,
  HTMLConsoleUtil: PROMPTS.makeHTMLConsole,
  PrintTagColors: PROMPTS.printTagColors,
  // FORWARDED APPSTATE (TEMP)
  // ...APPSTATE,
  ReadState: StateGroupMgr.ReadState,
  WriteState: StateGroupMgr.WriteState,
  SubscribeState: StateGroupMgr.SubscribeState,
  AddStateChangeHook: StateGroupMgr.AddStateChangeHook,
  DeleteStateChangeHook: StateGroupMgr.DeleteStateChangeHook,
  // FORWARDED CLASSES
  class: { PhaseMachine, StateGroupMgr },
  // FORWARDED CONSOLE DEBUG UTILITIES
  addConsoleTools: (ur = UR) => {
    DBGTEST.addConsoleTools(ur);
  },
  addConsoleToolHandlers: (ur = UR) => {
    DBGTEST.addConsoleToolHandlers(ur);
  }
};
if (typeof window === 'undefined')
  throw Error(`
    @gemstep/client: Unexpected UR-client access from non-browser environment.
    Are you using NextJS SSR? URSYS is currently incompatible with SSR.
  `);
else module.exports = UR;
