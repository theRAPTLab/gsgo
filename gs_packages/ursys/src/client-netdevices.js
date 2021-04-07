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
const { GetSharedEndPoints, SaveDeviceSub } = require('./client-datacore');
const DifferenceCache = require('./class-diff-cache');
const UDevice = require('./class-udevice');
const DBG = require('./ur-dbg-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagDkRed');
const DEVICE_CACHE = new DifferenceCache('id');
const log = console.log;
let LocalNode;
let NetNode;

/// FAKEY TYPE DEFINITIONS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// These are Typescript-like declarations but we're not using typescript for
/// URSYS modules
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** device selectors hold function that are used to select matching
 *  input types, return a quantity of the matches, and be notified of
 *  changes. Used by DeviceSubscribe
 */
const TDeviceSelector = {
  selectify: device => {
    return true;
  },
  quantify: deviceList => {
    return deviceList;
  },
  notify: (added, updated, removed) => {}
};

/// DEVICE SUBSCRIPTION ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: hook into DeviceBridger. Provide three optional functions that will be
 *  used to select, quantify the devices you want, and your notify function
 *  will be called with added,updated,removed list of devices. Returns
 *  the "DeviceBridgeNumber" which can be used to delete a device subscription
 */
export function DeviceSubscribe(config) {
  const dbr = {}; // renamed to deviceBridge
  if (Array.isArray(config)) {
    dbr.selectify = config[0];
    dbr.quantify = config[1];
    dbr.notify = config[2];
  } else if (typeof config === 'object') {
    dbr.selectify = config.selectify;
    dbr.quantify = config.quantify;
    dbr.notify = config.notify;
  } else throw Error('invalid device bridge config');
  return SaveDeviceSub(dbr);
}

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function log_arr(arr, prompt = 'array') {
  if (arr.length > 0) console.log(`${prompt}: ${arr.length} elements`, arr);
  else console.log(`${prompt}: 0 elements []`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder - save device map received from URNET server
 *  does not do careful update or removes old entries
 */
function m_SaveDeviceMap(devmap) {
  const { added, updated, removed } = DEVICE_CACHE.ingest(devmap);
  if (DBG.devices) {
    log_arr(added, 'added  ');
    log_arr(updated, 'updated');
    log_arr(removed, 'removed');
  } //
  LocalNode.raiseMessage('UR_DEVICES_CHANGED');
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API placeholder - an app can use this to register with the server
 */
export function DeviceRegister(name, controlDef) {
  console.log(...PR('DeviceRegister() -', name, controlDef));
  const promise = NetNode.callMessage('NET:SRV_DEVICE_REG', controlDef);
  return promise;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API placeholder - given search criteria, return an array of maching udevices
 *  only handle 'uclass' for now inefficiently.
 */
export function DeviceGetMatching(pattern = {}) {
  const uclass = pattern.uclass || '*';
  const devices = [];
  DEVICE_CACHE.forEach(device => {
    if (uclass === '*' || device.uclass === uclass) devices.push(device);
  });
  return devices;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This hook will grab the current device directory during startup, before
 *  React has a chance to render. See client-exec for the phase order
 */
PhaseMachine.Hook(
  'UR/NET_DEVICES',
  () =>
    new Promise((resolve, reject) => {
      // LocalNode, NetNode should be stable after NET_CONNECT, which
      // occurs before NET_DEVICES
      const EPS = GetSharedEndPoints();
      LocalNode = EPS.LocalNode;
      NetNode = EPS.NetNode;
      NetNode.callMessage('NET:SRV_DEVICE_DIR').then(devmap => {
        resolve();
        m_SaveDeviceMap(devmap);
      });
      /// MESSAGE HANDLERS ///////////////////////////////////////////////////
      /** process incoming netdevice directory, which is defined as an object
       *  with the uaddr as keys and this data structure from
       *  UDevice.GetDeviceDirectoryEntry: [uaddr] : { udid, uapp, uname,
       *  ugroup[], utags[], inputs[], outputs[] }
       */
      NetNode.handleMessage('NET:UR_DEVICES', devmap => {
        m_SaveDeviceMap(devmap);
      });
    })
);

/// HANDLE DEVICE DIRECTORY MESSAGES //////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** process incoming netdevice directory, which is defined as an object with
 *  the uaddr as keys and this data structure from
 *  UDevice.GetDeviceDirectoryEntry:
 *  [uaddr] : { udid, uapp, uname, ugroup[], utags[], inputs[], outputs[] }
 */
