/* eslint-disable @typescript-eslint/no-unused-vars */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  UR-CENTRAL manages common settings across all modules, their derived data,
  changes to network data, in one place.

  the key can be namespaced by using a period

  design document here:
  https://gitlab.com/inq-seeds/boilerplate/wikis/design-settings-manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/**
 * Central is a common settings manager.
 * @module URCentral
 */
import ValueBinding from '../common/class-valuebinding';

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const m_keymap = new Map(); // stores BoundValue objects

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// return detected errors in key format
function u_CheckKey(key) {
  // check for bad input
  if (!key) return 'key must be defined';
  if (typeof key !== 'string') return `key must be a string, not ${typeof key}`;
  // check for non-conforming key names
  const stripped = key.replace(/[^a-zA-Z0-9._]/g, '');
  if (stripped !== key)
    return `only use characters, '_' and '.' in key, (got '${key}')`;
  if (stripped !== stripped.toLowerCase())
    return `key '${key}' must be all lowercase`;
  // now try to store it
  return ''; // emptystring no error detected
} // u_CheckKey()

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Define a value in the settings map. Keys may only have periods in them.
 * @memberof URCentral
 * @param {string} key - key string (lower_case.dotted)
 * @param {*} initialValue - value to intialie
 */
const Define = (key, initialValue) => {
  let err = u_CheckKey(key);
  if (err) throw Error(err);
  if (m_keymap.has(key)) throw Error(`key '${key}' already exists`);
  const binding = new ValueBinding(key, initialValue);
  m_keymap.set(key, binding);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * PRIVATE: Return ValueBinding of key. This will eventually be hooked into
 * the state system, but it currently is just used for local data handling.
 * @memberof URCentral
 * @returns {ValueBinding}
 * @param {string} key - key string (lower_case.dotted)
 */
const GetBinding = key => {
  let err = u_CheckKey(key);
  if (err) throw Error(err);
  const binding = m_keymap.get(key);
  if (!binding) throw Error(`key '${key}' not defined before using GetBinding()`);
  return binding;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the value associated with a key.
 * @memberof URCentral
 * @param {string} key - key string (lower_case.dotted)
 */
const GetVal = key => {
  let err = u_CheckKey(key);
  if (err) throw Error(err);
  const binding = m_keymap.get(key);
  if (!binding) throw Error(`key '${key}' not defined before using GetVal()`);
  return binding.getValue();
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set the value associated with a key.
 * @memberof URCentral
 * @param {string} key - key string (lower_case.dotted)
 * @param {*} value - the value to store
 */
const SetVal = (key, value) => {
  let err = u_CheckKey(key);
  if (err) throw Error(err);
  const binding = m_keymap.get(key);
  if (!binding) throw Error(`key ${key} must be Defined before using SetVal()`);
  binding.setValue(value);
};

/// UR PARAMS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
    URSESSION is a global that stores connection data, injected by
    web-index.html.ejs/server-express.js

    CLIENT_IP, USRV_Host, USRV_IP, USRV_MsgPort,
    USRV_Start, CLIENT_UADDR, USRV_UADDR,
    SESSION_Key, SESSION_Token

/*/
if (!window.URSESSION) window.URSESSION = {};
Define('ur_session', window.URSESSION);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
    window.ur is used for console debugging
/*/
if (!window.ur) window.ur = {};
Define('ur', window.ur);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBGUR = param => {
  const obj = GetVal('ur');
  if (param === undefined) return obj;
  return obj[param];
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Define, GetVal, SetVal, DBGUR };
