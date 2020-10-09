/* tslint:disable */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS CLIENT MAIN ENTRY

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const URChannel = require('./client-channel');
const URNet = require('./client-network');
const URExec = require('./client-exec');
const PROMPTS = require('./util/prompts');
const DBGTEST = require('./util/client-debug');

const PR = PROMPTS.makeStyleFormatter('UR');

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

/// CLIENT-SIDE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// to be implemented
const Events = {};
const Extensions = {};
const PubSub = {};

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CHAN_LOCAL = new URChannel('ur-client');
const CHAN_NET = new URChannel('ur-sender');
let URSYS_RUNNING = false;

/// MAIN API //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** initialize modules that participate in UR EXEC PhaseMachine before running
 *  SystemBoot, which starts the URSYS lifecycle.
 */
async function SystemStart() {
  if (URSYS_RUNNING) {
    console.log(...PR('SystemStart: URSYS already running!!!'));
    return Promise.reject();
  }
  // autoconnect to URSYS network during NET_CONNECT
  PhaseMachine.QueueHookFor(
    'UR',
    'NET_CONNECT',
    () =>
      new Promise((resolve, reject) =>
        URNet.Connect(CHAN_NET, { success: resolve, failure: reject })
      )
  );
  // autoregister messages
  PhaseMachine.QueueHookFor('UR', 'APP_CONFIGURE', async () => {
    let result = await CHAN_LOCAL.ursysRegisterMessages();
    console.log(...PR('message handlers registered with URNET:', result));
  });
  URSYS_RUNNING = true;
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
  await URNet.Close();
  URSYS_RUNNING = false;
  return Promise.resolve();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  ...META,
  // FORWARDED PUB/SUB
  registerMessage: CHAN_LOCAL.registerMessage,
  unregisterMessage: CHAN_LOCAL.unregisterMessage,
  sendMessage: CHAN_LOCAL.sendMessage,
  raiseMessage: CHAN_LOCAL.raiseMessage,
  callMessage: CHAN_LOCAL.callMessage,
  // FORWARDED GENERIC PHASE MACHINE
  SystemHook: PhaseMachine.QueueHookFor,
  // SYSTEM STARTUP
  SystemStart,
  SystemStop,
  // FORWARDED SYSTEM CONTROL VIA UREXEC
  SystemBoot: URExec.SystemBoot,
  SystemConfig: URExec.SystemConfig,
  SystemRun: URExec.SystemRun,
  SystemRestage: URExec.SystemRestage,
  SystemReboot: URExec.SystemReboot,
  SystemUnload: URExec.SystemUnload,
  // FORWARDED PROMPT UTILITY
  PrefixUtil: PROMPTS.makeStyleFormatter,
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
