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
const StickyCache = require('./class-sticky-cache');
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
        const control = sub.cobjs.get(cName); // e.g. "markers" => cData StickyCache
        if (control) return control.getBufferValues();
        // no control, emit error
        if (DBG.controller) console.warn(`control '${cName}' doesn't exists`);
        return [];
      },
      getChanges: () => {
        const control = sub.cobjs.get(cName); // e.g. "markers" => cData StickyCache
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
export function LinkSubsToDevices(devices = DATACORE.GetDeviceDirectory()) {
  const subs = DATACORE.GetAllSubs();
  subs.forEach(sub => {
    sub.dcache.clear(); // nuke the device cache for this sub
    const { selectify, quantify, notify } = sub;
    // (1) filter devices desired by this sub, if selectify was provided
    const selected = selectify ? devices.filter(selectify) : devices;
    // HACK REVIEW: Always allow notify to fire.
    //              BL workaround for notify not returning 'removed'
    //              Need notification to detect the need to remove a device
    // if (selected.length === 0) return;

    // (2) limit devices returned by the selection criteria
    // return [] if quantity criteria is not met
    // IF the quantify function was provided for this sub
    const quantified = quantify ? quantify(selected) : selected;
    // HACK REVIEW: Always allow notify to fire.
    //              BL workaround for notify not returning 'removed'
    //              Need notification to detect the need to remove a device
    // if (quantified.length === 0) return;

    // console.log('quantified', quantified.length);
    quantified.forEach(udev => {
      const { udid } = udev;
      sub.dcache.set(udid, udev);
    });
    // (3) inform subscribers that the device conditions have changed
    const valid = quantified.length > 0;
    if (notify) notify({ valid, selected, quantified });
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
  const all = DATACORE.GetDeviceDirectory();
  LocalNode.raiseMessage('UR_DEVICES_CHANGED', all);
  // go over the entire hash of devices when a new device arrive
  LinkSubsToDevices(all);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Process controlFrame received from NET:UR_CFRAME
 *
 *  Blind-copies the named control data arrays in the frame to a
 *  Map<controlName,DiffCache> stored in the Subscription Map as 'cobjs'.
 *  A SubscriptionMap maps a udid to the subscriptions it is part of.
 *
 *  The 'cobjs' map is used to retrieve a StickyCache so its
 *  buffer() method can be used to accumulate data from multiple devices.
 *  The diffBuffer() method compares this buffer to the last results of
 *  the previous diffBuffer() call
 */
function m_ProcessControlFrame(cFrame) {
  const { udid, ...controls } = cFrame;
  const controlNames = Object.keys(controls); // all named controls
  const numControls = controlNames.length;
  // find which subs have this udid
  const subs = DATACORE.GetSubsByUDID(udid); // all matching subs with this udid
  // process the cFrame into each subscription
  subs.forEach(sub => {
    // cobjs is a Map of controlName to StickyCache for each subscription
    // a subscription has multiple devices that are kept in dcache
    controlNames.forEach(name => {
      const objs = cFrame[name];
      if (!sub.cobjs.has(name)) {
        const controlBuffer = new StickyCache('id');
        controlBuffer.setAgeThreshold(15);
        sub.cobjs.set(name, controlBuffer);
      }
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

/// DEVICE DIRECTORY //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetDeviceDirectory() {
  return DATACORE.GetDeviceDirectory();
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
    // each subscription's controls are in cobjs.get(cName)=>StickyCache,
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
