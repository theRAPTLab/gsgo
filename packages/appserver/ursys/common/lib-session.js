/* eslint-disable no-param-reassign */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Session Utilities
  collection of session-related data structures

  For student logins, we just need to encode the groupId, which will give
  us the classroomId. We also need the name, which is not encoded, but
  can be checked against the groups database.

  <NAME>-HASHED_DATA
  where HASHED_DATA encodes groupId, classroomId

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// SYSTEM LIBRARIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const HashIds = require('hashids').default;
const UUIDv5 = require('uuid/v5');
const PROMPTS = require('../../config/prompts');

/// DEBUGGING /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = PROMPTS.Pad('SESSUTIL');

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// HASH_* are used as parameters for hashids (login tokens)
const HASH_ABET = 'ABCDEFGHIJKLMNPQRSTVWXYZ23456789';
const HASH_MINLEN = 3;
const HASH_SALT = 'MEMESALT/2019';
/// UUID_NAMESPACE was arbitrarily generated with 'npx uuid v4' (access keys)
const UUID_NAMESPACE = '1abc839d-b04f-481e-87fe-5d69bd1907b2';
let ADMIN_KEY = ''; // set to non-falsy to disable admin checks
const ADMIN_QSTRING = 'danishpowers'; // used to bypass admin localhost test
const SSHOT_URL = '/screenshots';
const UPLOAD_URL = `${SSHOT_URL}/upload`;

/// MODULE DECLARATIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let m_current_name = undefined; // global decoded name (only for browsers)
let m_current_idsobj = {}; // global decoded props (only for browsers)
let m_access_key = ''; // global access key (saved only for browsers)

/// SESSION ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SESSION = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Given a token of form NAME-HASHED_DATA, return an object
    containing as many decoded values as possible. Check isValid for
    complete decode succes. groupId is also set if successful
/*/
SESSION.DecodeToken = hashedToken => {
  let studentName, hashedData; // token
  let groupId, classroomId; // decoded data
  let isValid = false;
  // is a valid token?
  if (typeof hashedToken !== 'string') return { isValid, error: 'token must be a string' };
  // token is of form NAME-HASHEDID
  // (1) check student name
  const token = hashedToken.toUpperCase();
  const tokenBits = token.toUpperCase().split('-');
  if (tokenBits.length === 1) return { isValid, token, error: 'missing - in token' };
  if (tokenBits.length > 2) return { isValid, token, error: 'too many - in token' };
  if (tokenBits[0]) studentName = tokenBits[0].toUpperCase();
  if (studentName.length < 3)
    return { isValid, token, error: 'student name must have 3 or more letters' };

  // (2) check hashed data
  if (tokenBits[1]) hashedData = tokenBits[1].toUpperCase();
  // initialize hashid structure
  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET);
  // try to decode the groupId
  const dataIds = hashids.decode(hashedData);
  // invalidate if couldn't decode
  if (dataIds.length === 0) return { isValid, token, error: 'invalid token' };

  // at this point groupId is valid (begins with ID, all numeric)
  // check for valid subgroupId
  [groupId, classroomId] = dataIds;
  isValid = true;
  return { isValid, studentName, token, groupId, classroomId };
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return TRUE if the token decodes into an expected range of values
/*/
SESSION.IsValidToken = token => {
  let decoded = SESSION.DecodeToken(token);
  return decoded && Number.isInteger(decoded.groupId) && typeof decoded.studentName === 'string';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a token string of form NAME-HASHED_DATA
 * @param {String} studentName
 * @param {Object} dataIds
 * @param {Number} dataIds.groupId
 * @param {Number} dataIds.classroomId
 */
SESSION.MakeToken = (studentName, dataIds = {}) => {
  // type checking
  if (typeof studentName !== 'string') throw Error(`classId arg1 '${studentName}' must be string`);
  let err;
  if ((err = f_checkIdValue(dataIds))) {
    console.warn(`Could not make token. ${err}`);
    return undefined;
  }

  // initialize hashid structure
  studentName = studentName.toUpperCase();
  const { groupId, classroomId } = dataIds;
  let hashids = new HashIds(HASH_SALT + studentName, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId, classroomId);
  return `${studentName}-${hashedId}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Returns a token string of form NAME-HASHED_DATA
 * @param {String} teacherName
 * @param {Object} dataIds
 * @param {Number} dataIds.groupId
 * @param {Number} dataIds.teacherId
 */
SESSION.MakeTeacherToken = (teacherName, dataIds = {}) => {
  // type checking
  if (typeof teacherName !== 'string') throw Error(`classId arg1 '${teacherName}' must be string`);
  let err;
  if ((err = f_checkIdValue(dataIds))) {
    console.warn(`Could not make token. ${err}`);
    return undefined;
  }
  // convert to alphanumeric no spaces
  const tokName = teacherName.replace(/\W/g, '');
  // initialize hashid structure
  teacherName = tokName.toUpperCase();
  const { groupId, teacherId } = dataIds;
  let hashids = new HashIds(HASH_SALT + teacherName, HASH_MINLEN, HASH_ABET);
  let hashedId = hashids.encode(groupId, teacherId);
  return `${teacherName}-${hashedId}`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// support function
function f_checkIdValue(idsObj) {
  const ids = Object.keys(idsObj);
  let error = '';
  ids.forEach(key => {
    const val = idsObj[key];
    if (!Number.isInteger(val)) {
      error += `'${key}' is not an integer. `;
      return;
    }
    if (val < 0) {
      error += `'${key}' must be non-negative integer. `;
      return;
    }
    if (val > Number.MAX_SAFE_INTEGER) {
      error += `'${key}' exceeds MAX_SAFE_INTEGER. `;
      return;
    }
  });
  return error;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Makes a 'access key' that is not very secure, but unique enough to serve
 * as an authentication key based on a login token
 * @param {...*} var_args - string arguments
 */
SESSION.MakeAccessKey = (/* args */) => {
  const name = [...arguments].join(':');
  const key = UUIDv5(name, UUID_NAMESPACE);
  return key;
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set the global GROUPID, which is included in all NetMessage packets that are
 * sent to server. Do not use from server-based code.
 */
SESSION.DecodeAndSet = token => {
  const decoded = SESSION.DecodeToken(token);
  const { isValid, studentName, groupId, classroomId } = decoded;
  if (isValid) {
    m_current_name = studentName;
    m_current_idsobj = {
      studentName,
      groupId,
      classroomId
    };
    // handle teacher login
    // in this case, the groupId is 0 and classroomId is actually
    // teacherId, so update the object
    if (groupId === 0) {
      console.warn(`INFO: TEACHER LOGIN '${studentName}'`);
      m_current_idsobj.teacherId = classroomId;
      m_current_idsobj.teacherName = studentName;
      m_current_idsobj.classroomId = undefined;
    }
    if (DBG) console.log('DecodeAndSet() success', studentName, groupId, classroomId);
  } else {
    if (DBG) console.log('DecodeAndSet() failed', token);
  }
  return isValid;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Clear all global session parameters. Do not use from server-based code.
 */
SESSION.Clear = () => {
  if (DBG) console.log('Clearing session');
  m_current_name = undefined;
  m_current_idsob = undefined;
  m_access_key = undefined;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Set the global SESSION ACCESS KEY, which is necessary as a parameter for
 * some operations (e.g. database writes). Do not use from server-based code.
 */
SESSION.SetAccessKey = key => {
  if (typeof key === 'string') {
    m_access_key = key;
    if (DBG) console.log('setting access key', key);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the global SESSION ACCESS KEY that was set using SetAccessKey(). Don't
 * use this from server-based code.
 */
SESSION.AccessKey = () => {
  if (DBG) console.log('AccessKey() returning', m_access_key);
  return m_access_key;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SESSION.SetAdminKey = key => {
  ADMIN_KEY = key || ADMIN_KEY;
  return ADMIN_KEY;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * This is TOTALLY INSECURE and not even trying for the prototype
 */
SESSION.AdminKey = () => {
  const is = ADMIN_KEY || false;
  if (DBG) console.warn('INFO: requested AdminKey()');
  return is;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return teacherId if this is a logged-in teacher
 */
SESSION.LoggedInProps = () => {
  const { groupId, classroomId, teacherId } = m_current_idsobj;
  if (groupId === 0) {
    return { teacherName: m_current_name, teacherId: teacherId };
  }
  return { studentName: m_current_name, groupId, classroomId };
};
SESSION.IsStudent = () => {
  return SESSION.LoggedInProps().studentName !== undefined;
};
SESSION.IsTeacher = () => {
  return SESSION.LoggedInProps().teacherName !== undefined;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the global LoggedInName that was set using DecodeAndSet(). Don't use
 * this from server-based code.
 */
SESSION.LoggedInName = () => {
  return m_current_name;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 * Return the global idsObject containing groupId, classroomId that was set
 * using DecodeAndSet(). Don't use this from server-based code.
 */
SESSION.Ids = () => {
  return m_current_idsobj;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SESSION.AdminPlaintextPassphrase = () => ADMIN_QSTRING;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SESSION.ScreenshotURL = () => SSHOT_URL;
SESSION.ScreenshotPostURL = () => UPLOAD_URL;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = SESSION;
