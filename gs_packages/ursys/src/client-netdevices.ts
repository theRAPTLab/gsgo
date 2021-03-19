/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DEVICE MANAGER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PhaseMachine = require('./class-phase-machine');
const PROMPTS = require('./util/prompts');
const { LocalNode, NetNode } = require('./client-datacore');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagUR2');
const PPR = PROMPTS.makeStyleFormatter('DEVICE', 'TagPhase');
const HPR = PROMPTS.makeStyleFormatter('DEVICE', 'TagMessage');

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RegisterInputs(inputDef) {
  const promise = NetNode.callMessage('NET:SRV_REG_INPUTS', inputDef);
  return promise;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

PhaseMachine.Hook(
  'UR/NET_PROTOCOLS',
  () =>
    new Promise<void>((resolve, reject) => {
      console.log(...PPR('testing hook for NET_PROTOCOLS when they are stable'));
      resolve();
    })
);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PhaseMachine.Hook(
  'UR/NET_DEVICES',
  () =>
    new Promise<void>((resolve, reject) => {
      console.log(...PPR('testing hook for NET_DEVICES when they are stable'));
      resolve();
    })
);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
PhaseMachine.Hook('UR/APP_READY', () => {
  // test manual protocol request
  // NetNode.callMessage('NET:SRV_PROTOCOLS').then(data => {
  //   console.log(...PPR('received PROTOCOL data from call', data));
  // });
  // test manual device list request
  // NetNode.callMessage('NET:SRV_DEVICES').then(data => {
  //   console.log(...PPR('received DEVICES data from call', data));
  // });
});

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetNode.handleMessage('NET:UR_PROTOCOLS', data => {
  console.log(...HPR('handling NET:UR_PROTOCOLS, got', data));
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
NetNode.handleMessage('NET:UR_DEVICES', data => {
  console.log(...HPR('handling NET:UR_DEVICES, got', data));
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: typescript requires ES6 module syntax to force module scoping
export = {
  RegisterInputs
};
