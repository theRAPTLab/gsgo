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
const DifferenceCache = require('./class-diff-cache');
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
 *  changes. Used by SubscribeDeviceSpec
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

/// DEVICE CREATION ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: create a new blank UDevice */
export function NewDevice(className) {
  if (typeof className !== 'string')
    throw Error(`NewDevice() accepts class name as string, not ${className}`);
  const device = new UDevice(className);
  return device;
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
  const promise = new Promise((resolve, reject) => {
    NetNode.callMessage('NET:SRV_DEVICE_REG', udevice).then(data => {
      if (data && data.error) {
        resolve(data);
      } else {
        data.udid = udid;
        resolve(data); // pass data onward
      }
    });
  });
  return promise; // returns reginfo
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: retrieves device previously registered through RegisterDevice() on
 *  this app instance
 */
export function GetDeviceByUDID(udid) {
  return DATACORE.GetDeviceByUDID(udid);
}

/// DEVICE SUBSCRIPTION API ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: provide deviceAPI. Provide three optional functions that will be
 *  used to select, quantify the devices you want, and your notify function
 *  will be called with added,updated,removed list of devices. Returns
 *  a DeviceAPI with useful methods for obtaining controllers to named
 *  controls in a DeviceSpec group
 */
export function SubscribeDeviceSpec(deviceSpec) {
  // deviceSpec holds al the functions as follows:
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
  // return device API
  const deviceAPI = SaveDeviceSub(sub);
  LinkSubsToDevices();
  // deviceAPI has { unsub, getInputs, getChanges, putOutput } functions
  const props = Object.keys(sub).join(', ');
  const api = Object.keys(deviceAPI).join(', ');
  console.log(...PR(`SubscribeDeviceSpec\nsub:[${props}]\napi:[${api}]`));
  return deviceAPI;
}
/** a device subscription saves a "device controller" when it's received from the
 *  device connector. It's called by client-netdevices SubscribeDeviceSpec() which
 *  is exported from UR client.
 *  returns a deviceAPI object
 */
function SaveDeviceSub(deviceSpec) {
  const subId = DATACORE.SaveDeviceSub(deviceSpec);
  /// DEVICE API METHODS ///
  const subscriptionID = () => {
    return subId;
  };
  const getController = cName => {
    const sub = DATACORE.GetSubByID(subId);
    /// CONTROLLER METHODS ///
    return {
      getInputs: () => {
        const control = sub.cobjs.get(cName); // e.g. "markers" => cData DifferenceCache
        if (control) {
          control.diffBuffer();
          return control.getValues();
        }
        return [];
      },
      getChanges: () => {
        const control = sub.cobjs.get(cName); // e.g. "markers" => cData DifferenceCache

        if (control) return control.getChanges();
        return [];
      },
      putOutputs: cData => {
        if (!Array.isArray(cData)) cData = [cData];
        console.warn('UNIMPLEMENTED: this would send cData to all devices');
        // sub.dcache is the device cache of all matching devices
        // but we need to have direct-addressibility through a device websocket
        // to make this work, because we can only use NET:UR_CFRAME as a broadcast
        // in this urrent version
      }
    };
  };
  const unsubscribe = () => {
    console.log('deleting device sub', subId);
    DATACORE.DeleteSubByID(subId);
  };

  // make sure we process devices through this new subscription!

  return { unsubscribe, getController, subscriptionID };
}

/// DEVICE-TO-SUBSCRIPTION LINKING ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: when a subscription OR device is added, need to update the tables
 *  that connect device UDIDS to interested subscribers
 */
export function LinkSubsToDevices(devices = DATACORE.GetDevices()) {
  const subs = DATACORE.GetAllSubs();
  subs.forEach(sub => {
    sub.dcache.clear();
    const { selectify, quantify } = sub;
    const selected = devices.filter(selectify);
    if (selected.length === 0) return;
    // console.log('selectified', selected.length);
    const quantified = quantify(selected);
    if (quantified.length === 0) return;
    // console.log('quantified', quantified.length);
    quantified.forEach(udev => {
      const { udid } = udev;
      sub.dcache.set(udid, udev);
    });
  });
}

/// CONTROL FRAME PROTOCOLS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: send a control frame to the input broker. In the future this should
 *  use a dedicated socket server, but for now we're just using URSYS messaging
 *  as a prototype
 */
export function SendControlFrame(cFrame) {
  NetNode.sendMessage('NET:UR_CFRAME', cFrame);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Process device map received from URNET server
 */
function m_ProcessDeviceMap(devmap) {
  // figure out what changed in the device map
  DATACORE.IngestDevices(devmap, { all: true });
  const all = DATACORE.GetDevices();
  LocalNode.raiseMessage('UR_DEVICES_CHANGED', all);
  // go over the entire hash of devices when a new device arrive
  LinkSubsToDevices(all);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Process controlFrame received from NET:UR_CFRAME */
function m_ProcessControlFrame(cFrame) {
  const { udid, ...controls } = cFrame;
  const controlNames = Object.keys(controls); // all named controls
  const numControls = controlNames.length;
  // find which subs have this udid
  const subs = DATACORE.GetSubsByUDID(udid); // all matching subs with this udid
  // process the cFrame into each subscription
  subs.forEach(sub => {
    // cobjs is a Map of controlName to DifferenceCache for each subscription
    // a subscription has multiple devices that are kept in dcache
    controlNames.forEach(name => {
      const objs = cFrame[name];
      if (!sub.cobjs.has(name)) sub.cobjs.set(name, new DifferenceCache('id'));
      // note: since a cFrame can come from multiple devices that are part of the
      // subscription, we can't use the normal ingest because it will overwrite
      // the previous cFrame from another device.
      sub.cobjs.get(name).buffer(objs);
      if (DBG.cframe) {
        const ident = `${udid}`;
        // return all the current buffered values for this controlName
        // across multiple devices
        // const controls = [...sub.cobjs.get(name).getBufferValues()];
        // const allCData = controls.map(v => `${v.id}`);
        const allObjs = objs.map(v => `${v.id}`);
        console.log(...PR(`[${ident}] buffering '${name}' cData:`, allObjs));
      }
    }); // controlNames
  }); // subs
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

  /// MESSAGE HANDLERS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle device directory updates */
  NetNode.handleMessage('NET:UR_DEVICES', devmap => {
    m_ProcessDeviceMap(devmap);
  });
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** handle incoming control frames */
  NetNode.handleMessage('NET:UR_CFRAME', cFrame => {
    m_ProcessControlFrame(cFrame);
    // all subscriptions associated with this udid have been updated
    // each subscription's controls are in cobjs.get(cName)=>DifferenceCache,
    // so use .getValues() or .getChanges()
  });
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When app is ready to run, request the device map immediately */
PhaseMachine.Hook(
  'UR/APP_READY',
  () =>
    new Promise((resolve, reject) => {
      NetNode.callMessage('NET:SRV_DEVICE_DIR').then(devmap => {
        m_ProcessDeviceMap(devmap);
        resolve();
      });
    })
);
