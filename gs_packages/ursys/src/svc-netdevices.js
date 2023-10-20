/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS Server Message Handler - URNET device services

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { UR_RaiseMessage, UR_HandleMessage } = require('./server-message-api');
const UDevice = require('./class-udevice');
const DBG = require('./common/debug-props');
const TERM = require('./util/prompts').makeTerminalOut('NETDVC');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEVICE_BY_UADDR = new Map(); // map uaddr to udevice map []
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a device directory in the form of a hash of udids
 */
function m_CreateDeviceDirectoryFromMap() {
  const devices = {};
  let out = '';
  [...DEVICE_BY_UADDR.keys()].forEach(uaddr => {
    const dMap = DEVICE_BY_UADDR.get(uaddr);
    [...dMap.values()].forEach(udev => {
      const udid = udev.udid;
      if (udid !== undefined) {
        out += `${udid} `;
        devices[udid] = udev.getDeviceDescriptor();
      } else {
        console.warn('*** bad udid in dmap', JSON.stringify(udev));
      }
    });
  });
  if (!out) out = '<empty>';
  TERM('devicedir is:', out);
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
  const dir = m_CreateDeviceDirectoryFromMap();
  return dir; // call will return
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Handle an Input Registration Packet
 *  The client provides a udevice definition as the datapacket, and receives
 *  back confirmation that registration succeeded
 */
function PKT_RegisterDevice(pkt) {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const udev = new UDevice(pkt.getData());
  const udid = udev.udid;
  const ins = udev.getInputControlNames().reduce((acc, i) => `[${i}]`, '');
  const outs = udev.getOutputControlNames().reduce((acc, o) => `[${o}]`, '');
  const deviceClass = udev.getMetaProp('uclass');
  const status = `${udid} dclass:'${deviceClass}' inputs:${ins} outputs:${outs}`;
  // save the device to the list
  const uaddr = pkt.getSourceAddress();
  if (!DEVICE_BY_UADDR.has(uaddr)) {
    DEVICE_BY_UADDR.set(uaddr, new Map());
    if (DBG.devices) TERM('registering', status);
  } else if (DBG.devices) TERM('re-registering', status);

  const dMap = DEVICE_BY_UADDR.get(uaddr);
  dMap.set(udev.udid, udev);

  // broadcast the changed device list
  const dir = m_CreateDeviceDirectoryFromMap();
  UR_RaiseMessage('NET:UR_DEVICES', dir);
  // return data object to return a remote call
  // return error string if there was an error
  return { status };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Receive a control frame from a remote, and forward it to everyone
 *  Note: this is a placeholder for eventually doing smarter forwarding
 *  on a dedicated socket server
 */
function PKT_ControlFrameIn(pkt) {
  const cFrame = pkt.getData();
  // TODO: inspect cFrame and send only to subscribers
  // debug output
  const { udid, ...controls } = cFrame;
  // controls contains controlName:[ cobj, cobj ]
  let out = `${udid}: `;
  Object.entries(controls).forEach(entry => {
    const [key, arr] = entry;
    out += `${arr.length} cobj(s) in control '${key}' `;
  });
  TERM(out);
  return {};
}

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** The SRV_SOCKET_DELETED signal is fired by server-urnet when a socket is
 *  dropped (browser closes, or is refreshed
 */
UR_HandleMessage('SRV_SOCKET_DELETED', cmd => {
  const { uaddr } = cmd;
  const dMap = DEVICE_BY_UADDR.get(uaddr);
  if (dMap === undefined) {
    if (DBG.devices) TERM(`... ${uaddr} has no registered device(s) to drop`);
  } else {
    TERM(`... ${uaddr} dropping ${dMap.size} registered device(s)`);
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
  PKT_RegisterDevice,
  PKT_ControlFrameIn
};
