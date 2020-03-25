/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  handles communication with extension

  working notes:
  1. a packet format that has an action and a unique id
  2. a packet sender/callback that asyncronously sends and recognizes returning
     packets, calling the original caller
  3. a transport mechanism (socket, event, whatever)

  CallAsync('CAPTURE_SCREEN',{sx,sy,sw,sh}) create new packet 'CAPTURE_SCREEN',
    {sx,sy,sw,sh} w/ uniqueid return promise that: ... creates a 'resolver'
    function that is mapped byuniqueid. (1) the resolver is called with the
    returning matching packet and (2) calls resolve(data) to complete the
    promise with returned data (3) sends packet

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import ExtPacket from './ur-class-extpacket';
import request from 'superagent';
import SESSION from './common-session';

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SSHOT_URL = SESSION.ScreenshotURL();
const UPLOAD_URL = SESSION.ScreenshotPostURL();
const CSU = 'color:pink;background-color:#909;padding:0 4px';
const CSR = 'color:auto;background-color:auto';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false; // module-wide debug flag
let MEMEXT_CONNECTED = false;
let CONNECT_TIMEOUT;
let CONNECT_RETRY;
let CONNECT_UADDR;
const m_subscribers = new Map();
let m_subscriber_count = 0;

/// EXTENSION EVENT HANDLER / DISPATCHER //////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Fired when the content script has completely finished initializing
 */
document.addEventListener('MEME_EXT_ALIVE', (event) => {
  console.log(`%cMEME_EXT`, CSU, `content script 'polo'`);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Main extension-to-URSYS dispatcher. Receives incoming messages from the
 *  event listener for 'MEME_EXT' defined below, and
 */
document.addEventListener('MEME_EXT', (event) => {
  if (event.source === 'URSYS') return;
  const message = event.detail;
  if (typeof message.action !== 'string') return;
  m_HandleExtMessage(message);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HandleExtMessage(message) {
  const epkt = new ExtPacket(message);
  const action = epkt.Action();
  if (action === 'HELLO') {
    MEMEXT_CONNECTED = true;
    const { uaddr } = epkt.Data();
    console.log(`%cMEME_EXT`, CSU, `'${uaddr}' bridge connected`);
  }
  epkt.DeliverReturn();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Trigger e MEMEXT action directly. URSYS-to-extension dispatcher
 */
function ExtPublish(action, data) {
  if (!MEMEXT_CONNECTED) return Promise.reject({ error: 'MEMEXT_NO_CONNECT' });
  const epkt = new ExtPacket(action, data);
  epkt.Dispatch();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call the extension, return a promise with the desired data
 */
async function ExtCallAsync(action, data) {
  if (!MEMEXT_CONNECTED) return Promise.reject({ error: 'MEMEXT_NO_CONNECT' });
  const epkt = new ExtPacket(action, data);
  return epkt.PromiseDispatch();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** interface for UR modules to subscribe to MEME_EXT events
 */
function ExtSubscribe(action, func) {
  let subbers = m_subscribers.get(action);
  if (!subbers) {
    subbers = new Set();
    m_subscribers.set(mesgName, subbers);
  }
  subbers.add(func);
}

/// FUNCTION HELPERS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return promise to upload file
 */
function PromiseUploadFile(fileOrBlob) {
  const req = request.post(UPLOAD_URL);
  const nameOverride = fileOrBlob instanceof Blob ? 'screenshot.jpg' : undefined;
  let href;
  return req.attach('screenshot', fileOrBlob, nameOverride).then((res) => {
    const data = JSON.parse(res.text);
    if (!data) return { error: 'no data' };
    href = `${SSHOT_URL}/${data.filename}`;
    if (DBG) {
      console.log('file saved at...opening window', href);
      // window.open(href);
    }
    return { href };
  }); // req.attach().then()
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** 'syncronous' version of uploader
 */
async function UploadFile(file) {
  const { href, error } = await PromiseUploadFile(file);
  return { href, error };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convert base64-encoded file
 */
function DataURI2File(b64, filename = 'decoded_file') {
  const mime = b64.substring(b64.indexOf('data:').length, b64.indexOf(';base64'));
  let file, ext;
  if (mime === 'image/jpeg') ext = '.jpg';
  if (mime === 'image/png') ext = '.png';
  return fetch(b64)
    .then((res) => res.blob())
    .then((blob) => {
      blob.name = filename + ext;
      blob.lastModifiedDate = new Date();
      return blob;
    });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call to initialize the bridge to extension
 *  retries until successful
 *  Also see m_HandleExtMessage() use of MEMEXT_CONNECTED
 */
function ConnectToExtension(uaddr) {
  console.log(`%cMEME_EXT`, CSU, `HANDSHAKE INITIATED`);
  CONNECT_UADDR = uaddr;
  CONNECT_RETRY = 0;
  CONNECT_TIMEOUT = setInterval(() => {
    if (CONNECT_RETRY > 10) {
      console.log(`%cMEME_EXT`, CSU, `Can't connect. Is extension installed?`);
      clearTimeout(CONNECT_TIMEOUT);
      return;
    }
    if (!MEMEXT_CONNECTED) {
      const detail = { uaddr };
      const event = new CustomEvent('MEME_EXT_CONNECT', { detail });
      event.source = 'URSYS';
      document.dispatchEvent(event);
      if (CONNECT_RETRY > 0) console.log(`%cMEME_EXT`, CSU, `connect retry ${CONNECT_RETRY}`);
      CONNECT_RETRY++;
    } else {
      console.log(`%cMEME_EXT`, CSU, `HANDSHAKE COMPLETE!`);
      clearTimeout(CONNECT_TIMEOUT);
      CONNECT_TIMEOUT = 0;
    }
  }, 1500);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return status of connection
 */
function IsConnected() {
  return MEMEXT_CONNECTED;
}

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ExtPublish,
  ExtSubscribe,
  ExtCallAsync,
  UploadFile,
  PromiseUploadFile,
  DataURI2File,
  ConnectToExtension,
  IsConnected
};
