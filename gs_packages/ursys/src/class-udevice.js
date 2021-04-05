/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    device definition class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = PROMPTS.makeStyleFormatter('UDEVICE');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are for control definitions, and for querying
const controlTypes = [
  // basic types
  'int', // an integer
  'float', // a floating-point value
  'string', // an arbitrary string
  'uint', // positive integers only
  'ufloat', // positive floats only
  // special types
  'axis', // a floating-point value between -1 and 1
  'vec2', // a 2D vector [x y]
  'vec3', // a 3D vector [x y z]
  'matrix3', // a 3D matrix (9 floats)
  'matrix4', // a 4D matrix (16 floats)
  'bistate', // a 0/1 continuous boolean signal
  'trigger', // a momentary transition from 0 to 1
  'release', // a momentary transition from 1 to 0
  'enum', // one of a particular set of symbols
  'bits', // an array of values either 0 or 1
  'bits2', // a two dimension array of values either 0 or 1
  {} // an object describing its shape using the above types
];
/// a control definition is a name of a control and a specified type
///
const exampleControlDefinition = [
  // simple declaration
  { control: 'x', type: 'axis' },
  // compound declaration
  { control: 'markers', type: { x: 'axis', y: 'axis', jump: 'trigger' } }
];
/// when a device is actually sending data in an InputObject
/// format, the udid is the only required property, and the
/// controlNames from the device definition merely store their
/// values
const exampleControlObject = {
  udid: 1234,
  x: 0,
  y: 0,
  jump: true
};
const exampleDeviceDefinition = {
  device: {
    uclass: 'CharController',
    udid: 'uniquedeviceid',
    groups: ['groupA'],
    roles: ['roleA']
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** create a blank device record
 */
function m_NewData() {
  const data = {
    device: {}, // device identifier, groups, and roles
    user: {}, // user authentication and identitifying data
    inputControls: [], // what inputs are provided as array of controlDefinition
    outputControls: [] // what outputs are supported as array of controlDefinition
  };
  data.device = {
    uapp: '', // device appserver route
    // device class
    uclass: '', // the name of this type of of device
    // udevice meta information
    udid: '', // unique device id
    uaddr: '', // URNET address
    uname: '', // device label (non-unique)s
    utags: [], // device 'tags' for identifying uapp subtypes
    // udevice app-specific memberships
    groups: [], // what logical groups this device belongs to
    roles: [] // what logical roles this device has
  };
  data.user = {
    uauth: '', // authentication token (JWT) to use
    student: {} // student-specific data
  };
  data.user.student = {
    sid: '', // student id
    sname: '' // student name (non-unique)
  };
  return data;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** create a descriptor object of { [controlName]:type }
 */
function m_MakeControlDescriptor(controlArray) {
  const descriptor = {};
  controlArray.forEach(obj => {
    const { control, type } = obj;
    descriptor[control] = type;
  });
  return descriptor;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** clone a clean device record from a source object
 */
function m_CloneData(obj, uaddr) {
  const data = {};
  const { device, user, inputControls, outputControls } = obj;
  if (device) {
    const { uclass, udid, uname, uapp, utags, groups, roles } = device;
    data.device = {};
    if (uclass) data.device.uclass = uclass;
    if (udid) data.device.udid = udid;
    if (uaddr) data.device.uaddr = uaddr;
    if (uname) data.device.uname = uname;
    if (uapp) data.device.uapp = uapp;
    if (Array.isArray(utags)) data.device.utags = utags;
    if (Array.isArray(groups)) data.device.groups = groups;
    if (Array.isArray(roles)) data.device.roles = roles;
  }
  if (user) {
    const { uauth, student } = user;
    data.user = {};
    if (uauth) data.user.uauth = uauth;
    if (student) {
      const { sid, sname } = student;
      if (sid) data.user.sid = sid;
      if (sname) data.user.sname = sname;
    }
  }
  if (Array.isArray(inputControls)) data.inputControls = inputControls;
  if (Array.isArray(outputControls)) data.outputControls = outputControls;
  return data;
}

/// URSYS UDEVICE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class UDevice formalizes the notion of a "Device" on the network
 */
class UDevice {
  constructor(obj) {
    this.data = typeof obj === 'object' ? m_CloneData(obj) : m_NewData();
  }

  _pushControl(arr, cn, t) {
    const control = {
      control: cn, // the name of the control (e.g. 'x')
      type: t, // the type of values produced by the control
      typeCaps: {} // type-specific meta information (e.g. range)
    };
    arr.push(control);
  }
  // accessors
  getDeviceProp(prop) {
    if (prop) return this.data.device[prop];
    return this.data.device || {};
  }
  getUserProp(prop) {
    if (prop) return this.data.user[prop];
    return this.data.user || {};
  }
  getStudentProp() {
    return this.getUser('student');
  }
  getInputControlList() {
    return this.data.inputControls;
  }
  getOutputControlList() {
    return this.data.outputControls;
  }
  // control methods
  addInputControl(controlName, type) {
    this._pushControl(this.data.inputControls, controlName, type);
  }
  addOutputControl(controlName, type) {
    this._pushControl(this.data.outputControls, controlName, type);
  }
  makeDeviceDirectoryEntry(uaddr) {
    const { uclass, udid, uapp, uname, utags, groups, roles } = this.data.device;
    const { inputControls, outputControls } = this.data;
    const inputs = m_MakeControlDescriptor(inputControls);
    const outputs = m_MakeControlDescriptor(outputControls);
    return {
      uclass,
      uaddr,
      udid,
      uapp,
      uname,
      utags,
      groups,
      roles,
      inputs,
      outputs
    };
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for node compatibility
module.exports = UDevice;
