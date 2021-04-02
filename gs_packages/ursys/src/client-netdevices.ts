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
const { LocalNode, NetNode } = require('./client-datacore');
const DifferenceCache = require('./class-diff-cache');
const UDevice = require('./class-udevice');
const DBG = require('./ur-dbg-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagDkRed');
const DEVICE_CACHE = new DifferenceCache('id');

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
  }
  LocalNode.raiseMessage('UR_DEVICES_CHANGED');
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API placeholder - an app can use this to register with the server
 */
export function RegisterAsDevice(name: string, controlDef) {
  console.log(...PR('RegisterAsDevice() -', name, controlDef));
  const promise = NetNode.callMessage('NET:SRV_DEVICE_REG', controlDef);
  return promise;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API placeholder - given search criteria, return an array of maching udevices
 *  only handle 'uclass' for now inefficiently. This will
 */
export function GetMatchingDevices(pattern: { uclass: string }) {
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
    new Promise<void>((resolve, reject) => {
      NetNode.callMessage('NET:SRV_DEVICE_DIR').then(devmap => {
        resolve();
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
NetNode.handleMessage('NET:UR_DEVICES', devmap => {
  m_SaveDeviceMap(devmap);
});
