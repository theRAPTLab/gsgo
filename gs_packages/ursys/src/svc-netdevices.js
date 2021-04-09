/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET device services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { UR_RaiseMessage, UR_HandleMessage } = require('./server-message-api');
const UDevice = require('./class-udevice');
const DBG = require('./ur-dbg-settings');
const TERM = require('./util/prompts').makeTerminalOut('NETDVC');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_BY_UADDR = new Map(); // map uaddr to udevice map []
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a device directory in the form of a hash of udids
 */
function m_CreateDeviceDirectoryFromMap() {
  const devices = {};
  [...DEVICE_BY_UADDR.keys()].forEach(uaddr => {
    const dMap = DEVICE_BY_UADDR.get(uaddr);
    [...dMap.values()].forEach(udev => {
      const udid = udev.meta.udid;
      if (udid !== undefined) {
        devices[udid] = udev.getDeviceDirectoryEntry();
      } else {
        console.warn('*** bad udid in dmap', JSON.stringify(udev));
      }
    });
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
  const udev = new UDevice(pkt.getData());
  const udid = udev.getMetaProp('udid');
  const ins = udev
    .getInputControlList()
    .reduce((acc, i) => `[${i.controlName}]`, '');
  const outs = udev
    .getOutputControlList()
    .reduce((acc, i) => `[${i.controlName}]`, '');
  const deviceClass = udev.getMetaProp('uclass');
  const status = `register ${udid} as '${deviceClass}' device w/ inputs:${ins}, outputs:${outs}`;
  if (DBG.devices) TERM(status);
  // save the device to the list
  const uaddr = pkt.getSourceAddress();
  if (!DEVICE_BY_UADDR.has(uaddr)) DEVICE_BY_UADDR.set(uaddr, new Map());
  const dMap = DEVICE_BY_UADDR.get(uaddr);
  dMap.set(udev.udid, udev);

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
  const dMap = DEVICE_BY_UADDR.get(uaddr);
  if (DBG.devices) {
    if (dMap === undefined) TERM(`${uaddr} has no registered device(s) to drop`);
    else TERM(`${uaddr} dropping ${dMap.size} registered device(s)`);
  }
  if (uaddr !== undefined) {
    DEVICE_BY_UADDR.delete(uaddr);
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
