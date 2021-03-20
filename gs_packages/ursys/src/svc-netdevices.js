/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET device services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERM = require('./util/prompts').makeTerminalOut('NETDEV');
const { UR_RaiseMessage, UR_HandleMessage } = require('./server-message-api');
const UDevice = require('./class-udevice');
const DBG = require('./ur-dbg-settings');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_MAP = new Map(); // map uaddr to udevice entry
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function CreateDeviceDirectoryFromMap() {
  const devices = {};
  [...DEVICE_MAP.keys()].forEach(uaddr => {
    const udev = DEVICE_MAP.get(uaddr);
    devices[uaddr] = udev.getDeviceDirectoryEntry();
  });
  return devices;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns a map of all client devices which are reachable within the current
 *  URNET segment.
 *  The pkt must include the uident, which will be used
 *  to filter the returned map by access privilege
 */
function PKT_DeviceDirectory(pkt) {
  console.log('returning dummy uaddr directory', pkt.getInfo());
  const directory = CreateDeviceDirectoryFromMap();
  return directory;
}

/** Handle an Input Registration Packet
 *  The client provides a udevice definition as the datapacket, and receives
 *  back confirmation that registration succeeded
 */
function PKT_RegisterInputs(pkt) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const udev = new UDevice(pkt.getData());
  const uaddr = pkt.getSourceAddress();
  const { groups } = udev.getDeviceProp();
  const inputs = udev.getInputControlList();
  const status = `${uaddr} registering input: '${Object.keys(groups).join(
    ','
  )}' with ${inputs.length} inputs`;
  if (DBG.device) TERM(status);
  // save the device to the list
  DEVICE_MAP.set(uaddr, udev);

  // broadcast the changed device list
  const dir = CreateDeviceDirectoryFromMap();
  UR_RaiseMessage('NET:UR_DEVICES', dir);
  // return data object to return a remote call
  // return error string if there was an error
  return { status };
}

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The SRV_SOCKET_DELETED signal is fired by server-urnet when a socket is
 *  dropped (browser closes, or is refreshed
 */
UR_HandleMessage('SRV_SOCKET_DELETED', cmd => {
  const { uaddr } = cmd;
  const entry = DEVICE_MAP.get(uaddr);
  if (entry === undefined) TERM('*** WARNING *** netdevice deletion fail ***');
  else {
    if (DBG.device) TERM(`${uaddr} drop device '${entry.getDeviceProp('udid')}'`);
    DEVICE_MAP.delete(uaddr);
    const dir = CreateDeviceDirectoryFromMap();
    UR_RaiseMessage('NET:UR_DEVICES', dir);
  }
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR_HandleMessage('SRV_SOCKET_ADDED', cmd => {});

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_DeviceDirectory,
  PKT_RegisterInputs
};
