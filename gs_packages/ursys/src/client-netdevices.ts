/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS NETWORK DEVICE MANAGER
  works with network protocols

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// note: these are CJS modules so use require syntax
const PhaseMachine = require('./class-phase-machine');
const Differ = require('./class-diff-cache');
const PROMPTS = require('./util/prompts');
const { LocalNode, NetNode } = require('./client-datacore');
const UDevice = require('./class-udevice');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = PROMPTS.makeStyleFormatter('DEVICE', 'TagDkRed');
const DEVICE_MAP = new Map();

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder - save device map received from URNET server
 *  does not do careful update or removes old entries
 */
function m_SaveDeviceMap(devmap) {
  const addrs = Object.keys(devmap);
  addrs.forEach(uaddr => {
    const entry = devmap[uaddr];
    const status = entry.uclass;
    if (DEVICE_MAP.has(uaddr)) {
      console.log(...PR(`.. updating ${uaddr} '${status}'`));
    } else {
      console.log(...PR(`.. adding   ${uaddr} '${status}'`));
    }
    DEVICE_MAP.set(uaddr, entry);
  });
  LocalNode.raiseMessage('UR_DEVICES_CHANGED');
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder - an app can use this to register with the server
 */
export function RegisterAsDevice(name: string, controlDef) {
  console.log(...PR('RegisterAsDevice() -', name, controlDef));
  const promise = NetNode.callMessage('NET:SRV_DEVICE_REG', controlDef);
  return promise;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** placeholder - given search criteria, return an array of maching udevices
 *  only handle 'uclass' for now inefficiently
 */
export function GetMatchingDevices(pattern: { uclass: string }) {
  const uclass = pattern.uclass || '*';
  const devices = [];
  DEVICE_MAP.forEach((device, uaddr) => {
    if (uclass === '*' || device.uclass === uclass) devices.push(device);
  });
  console.log(...PR(`GetMatchingDevices for uclass '${uclass}'`, devices));
  return devices;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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

/// HANDLE DEVICE DIRECTORY ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** process incoming netdevice directory, which is defined as an object with
 *  the uaddr as keys and this data structure from
 *  UDevice.GetDeviceDirectoryEntry:
 *  [uaddr] : { udid, uapp, uname, ugroup[], utags[], inputs[], outputs[] }
 */
NetNode.handleMessage('NET:UR_DEVICES', devmap => {
  console.log(...PR('NET:UR_DEVICES - got', devmap));
  m_SaveDeviceMap(devmap);
});
