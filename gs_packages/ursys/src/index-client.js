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
const DTECT = require('./common/ur-detect');
const CONST = require('./common/ur-constants');
const LOG = require('./client-logger');
const MSGR = require('./client-messager');

// classes
const PhaseMachine = require('./class-phase-machine');
const StateGroupMgr = require('./class-state-group-mgr');
const StateMgr = require('./class-state-mgr');
//
const { IsBrowser, IsNode, IsElectron, IsElectronMain, IsElectronRenderer } =
  DTECT;

/// CONST /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('URSYS ', 'TagUR');
const DBG = false;

/// MAIN LIFECYCLE API ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize modules that participate in UR EXEC PhaseMachine before running
 *  SystemNetBoot, which starts the URSYS lifecycle.
 */
async function SystemStart(route) {
  if (DATACORE.URSYS_RUNNING) {
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
    new Promise((resolve, reject) => {
      void NETWORK.URNET_Connect({ success: resolve, failure: reject });
    }).then(data => {
      console.log(...PR('URNET established. UADDR is stable.'));
      const eps = DATACORE.GetSharedEndPoints();
      MSGR.SaveEndpoints({
        LocalNode: eps.LocalNode,
        NetNode: eps.NetNode
      });
      return data;
    })
  );
  // autoregister messages
  PhaseMachine.Hook('UR/APP_CONFIGURE', async () => {
    let result = await MSGR.RegisterMessages();
    if (DBG)
      console.log(...PR('message handlers registered with NETWORK:', result));
  });
  // complete startup
  DATACORE.URSYS_RUNNING = true;
  DATACORE.URSYS_ROUTE = route;
  DATACORE.SaveClientInfo({ uapp: route });

  return Promise.resolve();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** deallocate any system resources assigned during Initialize */
async function SystemStop() {
  if (!DATACORE.URSYS_RUNNING) {
    console.log(...PR('SystemModulesStop: URSYS is not running!!!'));
    return Promise.resolve();
  }
  // close the network
  NETWORK.URNET_Close();
  DATACORE.URSYS_RUNNING = false;
  return Promise.resolve();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  ...DATACORE.META,
  ...CONST,
  // NETWORK MESSAGES (forwarded from MSGR)
  RegisterMessages: MSGR.RegisterMessages,
  DeclareMessage: MSGR.DeclareMessage,
  HasMessage: MSGR.HasMessage,
  HandleMessage: MSGR.HandleMessage,
  UnhandleMessage: MSGR.UnhandleMessage,
  SendMessage: MSGR.SendMessage,
  RaiseMessage: MSGR.RaiseMessage,
  CallMessage: MSGR.CallMessage,
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
  Mutate: DB.Mutate,
  // SYSTEM STARTUP
  SystemStart,
  SystemStop,
  // LOGGING MODULE
  LOG,
  LogEvent: LOG.LogEvent,
  LogJSON: LOG.LogJSON,
  LogEnabled: LOG.LogEnabled,
  // ROUTE INFO
  IsAppRoute: route => DATACORE.URSYS_ROUTE === route,
  AppRoute: () => DATACORE.URSYS_ROUTE,
  BrokerIP: NETWORK.ServerIP,
  ServerPort: NETWORK.ServerPort,
  WebServerPort: NETWORK.WebServerPort,
  ConnectionString: DATACORE.ConnectionString,
  HostString: DATACORE.HostString,
  BranchString: DATACORE.BranchString,
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
  PrefixUtil: PROMPTS.makeStyleFormatter, // deprecate
  ErrorUtil: PROMPTS.makeErrorFormatter,
  WarnUtil: PROMPTS.makeWarningFormatter,
  DPR: PROMPTS.dbgPrint,
  ColorTagUtil: PROMPTS.colorTagString,
  SetPromptColor: PROMPTS.setPromptColor,
  HTMLConsoleUtil: PROMPTS.makeHTMLConsole,
  PrintTagColors: PROMPTS.printTagColors,
  // FORWARDED APPSTATE (TEMP)
  // ...APPSTATE,
  ReadStateGroups: StateGroupMgr.ReadStateGroups,
  ReadFlatStateGroups: StateGroupMgr.ReadFlatStateGroups,
  WriteState: StateGroupMgr.WriteState,
  SubscribeState: StateGroupMgr.SubscribeState,
  UnsubscribeState: StateGroupMgr.UnsubscribeState,
  // FORWARDED CONSOLE DEBUG UTILITIES
  AddConsoleTool: DBGTEST.addConsoleTool, // arg: { [URkey]:f }
  ConsoleCompareTexts: DBGTEST.consoleCompareTexts, // args: text, ref
  // FORWARDED CLASSES
  class: { PhaseMachine, StateGroupMgr, StateMgr }
};
if (typeof window === 'undefined')
  throw Error(`
    @gemstep/client: Unexpected UR-client access from non-browser environment.
    Are you using NextJS SSR? URSYS is currently incompatible with SSR.
  `);
else module.exports = UR;
