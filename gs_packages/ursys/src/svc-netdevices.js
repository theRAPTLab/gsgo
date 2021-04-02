/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET device services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { UR_RaiseMessage, UR_HandleMessage } = require('./server-message-api');
const UDevice = require('./class-udevice');
const { DBG } = require('./ur-dbg-settings');
const TERM = require('./util/prompts').makeTerminalOut('NETDEV');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_MAP = new Map(); // map uaddr to udevice entry
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a device directory in the form of a Map<uaddr,direntry>
 */
function m_CreateDeviceDirectoryFromMap() {
  const devices = {};
  [...DEVICE_MAP.keys()].forEach(uaddr => {
    const udev = DEVICE_MAP.get(uaddr);
    devices[uaddr] = udev.makeDeviceDirectoryEntry(uaddr);
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
  const directory = m_CreateDeviceDirectoryFromMap();
  return directory;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle an Input Registration Packet
 *  The client provides a udevice definition as the datapacket, and receives
 *  back confirmation that registration succeeded
 */
function PKT_RegisterDevice(pkt) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const uaddr = pkt.getSourceAddress();
  const udev = new UDevice(pkt.getData(), uaddr);
  const inputs = udev.getInputControlList();
  const deviceClass = udev.getDeviceProp('uclass');
  const status = `${uaddr} register '${deviceClass}' input with ${inputs.length} control(s)`;
  if (DBG.devices) TERM(status);
  // save the device to the list
  DEVICE_MAP.set(uaddr, udev);

  // broadcast the changed device list
  const dir = m_CreateDeviceDirectoryFromMap();
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
  if (DBG.devices) {
    if (entry === undefined) TERM(`${uaddr} no registered devices to drop`);
    else TERM(`${uaddr} dropping '${entry.getDeviceProp('uclass')}' input`);
  }
  if (uaddr !== undefined) {
    DEVICE_MAP.delete(uaddr);
    const dir = m_CreateDeviceDirectoryFromMap();
    UR_RaiseMessage('NET:UR_DEVICES', dir);
  }
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR_HandleMessage('SRV_SOCKET_ADDED', cmd => {});

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  PKT_DeviceDirectory,
  PKT_RegisterDevice
};
