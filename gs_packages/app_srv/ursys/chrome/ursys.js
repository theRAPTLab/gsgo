/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ursys is the browser-side of the UR library.

  Hook()
  Define(), GetVal(), SetVal()
  Publish(), Subscribe()
  Call()

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import SESSION from 'ursys/common/lib-session';
import REFLECT from 'util/reflect';
import NetMessage from 'ursys/common/class-netmessage';
import URLink from 'ursys/chrome/ur-link';
import ReloadOnViewChange from 'util/reload';
import EXT from 'ursys/chrome/ur-extension';
import CENTRAL from './ur-central';
import EXEC from './ur-exec';

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false; // module-wide debug flag
const OPEN_ADMIN = false; // set to false to disable open admin
const PR = 'URSYS';
const ULINK = NewConnection(PR);

/// RUNTIME SETUP /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// ur_legacy_publish is used to make DATALINK.Publish() work like Broadcast, so
// messages will mirror back to itself
CENTRAL.Define('ur_legacy_publish', true);
// trigger bridge connection to meme extension (screenshot capture)
let MEMEXT_INSTALLED = false;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// do session overrides  React does first render in phase after CONFIGURE
EXEC.Hook(__dirname, 'CONFIGURE', () => {
  // attempt to connect to extension
  EXT.ConnectToExtension(SocketUADDR());
  // check for admin override thenreturn
  const qs = SESSION.AdminPlaintextPassphrase();
  if (document.location.hash.includes(qs)) {
    console.warn(`INFO: ADMIN ACTIVATED VIA '${qs.toUpperCase()}' OVERRIDE`);
    SESSION.SetAdminKey(qs);
    return;
  }
  // check for localhost admin powers
  if (IsLocalhost()) {
    console.warn(`INFO: LOCALHOST ADMIN MODE`);
    SESSION.SetAdminKey('localhost');
    return;
  }
  // code here runs only if non-localhost regular user
});

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Return a new instance of a URSYS connection, which handles all the important
 * id meta-data for communicating over the network
 * @param {string} name - An optional name
 */
function NewConnection(name) {
  let uname = name || 'ANON';
  return new URLink(uname);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Utility method to Hook using a passed module id without loading UREXEC
 * explicitly
 */
const { Hook } = EXEC;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 * Utility method to Hook using a passed module id without loading UREXEC
 * explicitly
 */
function ReactHook(scope, phase, func) {
  if (!EXEC.IsReactPhase(phase)) throw Error(`Phase ${phase} has already passed; can't hook it!`);
  Hook(scope, phase, f);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// provide convenience links to the URSYS main ULINK
const { Publish, Subscribe, Unsubscribe } = ULINK;
const { Call, Signal } = ULINK;

const { NetPublish, NetSubscribe, NetUnsubscribe } = ULINK;
const { NetCall, NetSignal } = ULINK;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBQuery(cmd, data) {
  if (!data.key) {
    const accessKey = SESSION.AccessKey() || SESSION.AdminKey();
    if (DBG) console.log(`DBQuery using access key '${accessKey}'`);
    data.key = accessKey;
  }
  // returns a promise that resolves to data
  return ULINK._DBQuery(cmd, data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBTryLock(dbkey, dbids) {
  const data = {
    key: SESSION.AccessKey() || SESSION.AdminKey(),
    dbkey,
    dbids,
    uaddr: SocketUADDR()
  };
  // returns a promise that resolves to data
  return ULINK._DBLock(data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DBTryRelease(dbkey, dbids) {
  const data = {
    key: SESSION.AccessKey() || SESSION.AdminKey(),
    dbkey,
    dbids,
    uaddr: SocketUADDR()
  };
  // returns a promise that resolves to data
  return ULINK._DBRelease(data);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const { Define, GetVal, SetVal } = CENTRAL;
const { ExtPublish, ExtSubscribe, ExtCallAsync } = EXT;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsLocalhost() {
  return NetMessage.IsLocalhost();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsAdminLoggedIn() {
  return SESSION.AdminKey() || IsLocalhost();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsTeacherLoggedIn() {
  return SESSION.IsTeacher();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function DisableAdminPowers() {
  const hbits = window.location.href.split('?');
  if (hbits.length > 1) {
    window.location.href = hbits[0];
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TEMP: return the number of peers on the network
function PeerCount() {
  return NetMessage.PEERS.count;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ReactPreflight(comp, mod) {
  ReloadOnViewChange();
  const err = EXEC.ModulePreflight(comp, mod);
  if (err) console.error(err);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoutePreflight(routes) {
  const err = EXEC.SetScopeFromRoutes(routes);
  if (err) console.error(err);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SocketUADDR() {
  return NetMessage.SocketUADDR();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function PromiseCaptureScreen(options) {
  if (!EXT.IsConnected()) return Promise.resolve({ error: 'Extension not connected' });
  let res = EXT.ExtCallAsync('CAPTURE_SCREEN', options)
    .then(async data => {
      let { dataURI } = data;
      return await EXT.DataURI2File(dataURI);
    })
    .then(async file => {
      return await EXT.PromiseUploadFile(file);
    });
  return res;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const UR = {
  Hook, // EXEC
  NewConnection, // ULINK
  Publish, // ULINK
  Subscribe, // ULINK
  Unsubscribe, // ULINK
  Call, // ULINK
  Signal, // ULINK
  NetPublish, // ULINK
  NetSubscribe, // ULINK
  NetUnsubscribe, // ULINK
  NetCall, // ULINK
  NetSignal, // ULINK
  DBQuery, // ULINK
  DBTryLock, // ULINK
  DBTryRelease, // ULINK
  Define, // CENTRAL
  GetVal, // CENTRAL
  SetVal, // CENTRAL
  ReloadOnViewChange, // UTIL
  IsLocalhost,
  IsAdminLoggedIn,
  SocketUADDR,
  DisableAdminPowers,
  PeerCount,
  ReactPreflight,
  RoutePreflight,
  ReactHook,
  PromiseCaptureScreen
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (!window.ur) window.ur = {};
window.ur.SESSION = SESSION;
window.ur.LINK = ULINK;
window.ur.DBQuery = DBQuery;
window.ur.DBLock = (dbkey, dbids) => {
  DBTryLock(dbkey, dbids).then(data => {
    console.log(data);
  });
  return 'testing DBLock...';
};
window.ur.DBRelease = (dbkey, dbids) => {
  DBTryRelease(dbkey, dbids).then(data => {
    console.log(data);
  });
  return 'testing DBRelease...';
};
window.ur.GetLockTable = () => {
  NetCall('NET:SRV_DBLOCKS').then(data => {
    Object.keys(data).forEach((key, index) => {
      const item = data[key];
      console.log(`${index})\t"${item.semaphore}" locked by ${item.uaddr}`);
    });
  });
  return 'retrieving lock table';
};
window.ur.tnc = (msg, data) => {
  NetCall(msg, data).then(rdata => {
    console.log(`netcall '${msg}' returned`, rdata);
  });
  return `testing netcall '${msg}'`;
};
window.ur.serverinfo = () => {
  return window.ur.tnc('NET:SRV_SERVICE_LIST');
};
window.ur.clientinfo = () => {
  console.log(window.URSESSION);
  return `testing clientinfo`;
};
window.ur.scap = (opt = { sx: 45, sy: 195, sw: 1950, sh: 1200 }) => {
  PromiseCaptureScreen(opt).then(data => {
    const { href, error } = data;
    if (error) {
      console.log('error', error);
      return;
    }
    console.log('got href', href);
    window.open(href);
  });
  return 'capturing screen...';
};
window.ur.extconn = () => {
  EXT.ConnectToExtension(SocketUADDR());
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default UR;
