/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DEVICE MANAGER
  works with network protocols

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PhaseMachine = require('./class-phase-machine');
const PROMPTS = require('./util/prompts');
const { LocalNode, NetNode } = require('./client-datacore');
const UDevice = require('./class-udevice');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagUR2');
const PPR = PROMPTS.makeStyleFormatter('DEVICE', 'TagPhase');
const HPR = PROMPTS.makeStyleFormatter('DEVICE', 'TagMessage');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** an app can use this to register with the server
 */
export function RegisterAsDevice(name: string, controlDef) {
  console.log('registering', name, controlDef);
  const promise = NetNode.callMessage('NET:SRV_REG_INPUTS', controlDef);
  return promise;
} // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given search criteria, return an array of maching udevices
 */
export function GetMatchingDevices(pattern) {
  const devices = [];
  return devices;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PhaseMachine.Hook(
  'UR/NET_DEVICES',
  () =>
    new Promise<void>((resolve, reject) => {
      console.log(...PPR('testing hook for NET_DEVICES when they are stable'));
      resolve();
    })
);

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetNode.handleMessage('NET:UR_DEVICES', data => {
  console.log(...HPR('handling NET:UR_DEVICES, got', data));
});
