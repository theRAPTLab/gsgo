/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DEVICE MANAGER
  works with network protocols

  * calls 'NET:SRV_DEVICE_DIR' to return device map of UDevice
  * calls 'NET:SRV_DEVICE_REG' to register as a device
  * handl 'NET:UR_DEVICES' received from server with new device list
  * raise 'UR_DEVICES_CHANGED' locally when device changes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PhaseMachine = require('./class-phase-machine');
const PROMPTS = require('./util/prompts');
const DATACORE = require('./client-datacore');
const UDevice = require('./class-udevice');
const DBG = require('./ur-dbg-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagDkRed');
let LocalNode;
let NetNode;

/// FAKEY TYPE DEFINITIONS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are Typescript-like declarations but we're not using typescript for
/// URSYS modules. These are just for reference.
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** device selectors hold function that are used to select matching
 *  input types, return a quantity of the matches, and be notified of
 *  changes. Used by SubscribeDevice
 */
const TDeviceSelector = {
  selectify: device => {
    return true;
  },
  quantify: deviceList => {
    return deviceList;
  },
  notify: (valid, added, updated, removed) => {}
};

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Save device map received from URNET server
 *  TODO: careful update or removes old entries
 */
function m_UpdateDeviceMap(devmap) {
  // (1) figure out what changed in the device map
  const changeList = DATACORE.IngestDevices(devmap);
  LocalNode.raiseMessage('UR_DEVICES_CHANGED', changeList);
  // subscribers get a chance to handle the change
  // returning references because DEVICE_DIR.getChanges() will reset the
  // changeList, so multiple subscribers would miss the changes
}

/// DEVICE CREATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: create a new blank UDevice */
export function NewDevice(className) {
  if (typeof className !== 'string')
    throw Error(`NewDevice() accepts class name as string, not ${className}`);
  return new UDevice(className);
}

/// DEVICE REGISTRATION API ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: egister with the server.
 */
export function RegisterDevice(udevice) {
  const udid = udevice.udid;
  const { uclass, uname } = udevice.meta;
  console.log(
    ...PR(`RegisterDevice class:${uclass} uname:${uname} udid:${udid}`)
  );
  DATACORE.SaveDevice(udevice);
  const promise = NetNode.callMessage('NET:SRV_DEVICE_REG', udevice);
  return promise; // returns reginfo
}

/// DEVICE SUBSCRIPTION API ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: hook into DeviceBridger. Provide three optional functions that will be
 *  used to select, quantify the devices you want, and your notify function
 *  will be called with added,updated,removed list of devices. Returns
 *  the "DeviceBridgeNumber" which can be used to delete a device subscription
 */
export function SubscribeDevice(deviceSpec) {
  // device bridge holds al the functions as follows:
  // selectify is filter function: device => boolean
  // quantify is quantity gate function: device[] => { valid, devices }
  // notify is device[] change handler: (valid, added[], updated[], removed[]
  // note: 'valid' returned by quantify() as { valid, inputs }
  const sub = {};
  if (typeof deviceSpec === 'object') {
    sub.selectify = deviceSpec.selectify; // device => boolean
    sub.quantify = deviceSpec.quantify; // devices => { valid, devices }
    sub.notify = deviceSpec.notify; // { valid, added[], updated[], removed[] } => void
  } else throw Error('invalid deviceSpec object');
  // return device bridge number
  const deviceAPI = DATACORE.SaveDeviceSub(sub);
  // deviceAPI has { unsub, getInputs, getChanges, putOutput } functions
  return deviceAPI;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This hook will grab the current device directory during startup, before
 *  React has a chance to render. See client-exec for the phase order
 */
PhaseMachine.Hook('UR/NET_DEVICES', () => {
  // LocalNode, NetNode should be stable after NET_CONNECT, which
  // occurs before NET_DEVICES
  const EPS = DATACORE.GetSharedEndPoints();
  LocalNode = EPS.LocalNode;
  NetNode = EPS.NetNode;
  /// MESSAGE HANDLERS ///////////////////////////////////////////////////
  NetNode.handleMessage('NET:UR_DEVICES', devmap => {
    m_UpdateDeviceMap(devmap);
  });
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When app is ready to run, request the device map immediately */
PhaseMachine.Hook(
  'UR/APP_READY',
  () =>
    new Promise((resolve, reject) => {
      NetNode.callMessage('NET:SRV_DEVICE_DIR').then(devmap => {
        m_UpdateDeviceMap(devmap);
        resolve();
      });
    })
);
