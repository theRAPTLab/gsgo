/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    device definition class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');
const { PRE_UADDR_ID, PRE_UDEVICE_ID } = require('./ur-common');
const { MyUADDR, MyAppPath } = require('./client-datacore');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = PROMPTS.makeStyleFormatter('UDEVICE');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are for control definitions, and for querying
const DEVICE_ENCODINGS = [
  // basic types
  'int', // an integer
  'float', // a floating-point value
  'string', // an arbitrary string
  'uint', // positive integers only
  'ufloat', // positive floats only
  'byte', // 8-bit byte (hex)
  'word', // 16-bit word (hex)
  'dword', // 32-bit word (hex)
  'qword', // 64-bit word (hex)
  'array', //
  // special types
  'axis', // a floating-point value between -1 and 1
  'vec2', // a 2D vector [x y]
  'vec3', // a 3D vector [x y z]
  'matrix3', // a 3D matrix (array of 9 floats)
  'matrix4', // a 4D matrix (array of 16 floats)
  'bistate', // a 0/1 continuous boolean signal
  'edge+', // a momentary transition from 0 to 1 (bool)
  'edge-', // a momentary transition from 1 to 0 (bool)
  'enum', // one of a particular set of symbols (string)
  'bits', // an array of bits (hex)
  'bits2', // a 2D array of bits [hex-row, ...]
  'fix2', // fixed-point 2 decimal places (string)
  'fix3', // fixed-point 3 decimal places (string)
  {} // an object describing its shape using the above types
];

/// Device class templates are pre-defined groups of inputs and outputs!
/// NOTE: there can be more than one controlName for inputs on a device,
/// so this is always an array
const DEVICE_CLASS_TEMPLATES = {
  // character controller
  'CharControl': {
    inputs: [{ controlName: 'markers', controlProps: { x: 'axis', y: 'axis' } }],
    outputs: [{ controlName: 'setGroup', controlProps: { groups: 'array' } }]
  },
  // ptrack simulator
  'FakeTrack': {
    inputs: [{ controlName: 'markers', controlProps: { x: 'axis', y: 'axis' } }]
  },
  // speculative display object
  'SimDisplay': {
    outputs: [
      {
        controlName: 'displaylist',
        controlProps: { x: 'axis', y: 'axis', sprite: 'uint', state: 'byte' }
      }
    ]
  },
  'PTrack': {}, // ptrack generator
  'Sim': {}, // simulation engine
  'VidServer': {}, // video server
  'URBroker': {} // URNET broker endpoint
};

/// a control definition is a name of a control and a specified type
/// NOTE: arrays of control defs are used when defining the device so
/// more than one kind ofnamed control is available
const exampleControlDefinition = {
  controlName: 'markers',
  controlProps: { x: 'axis', y: 'axis', jump: 'trigger' }
};
/// when a device is actually sending data in an ControlDataObject format, the
/// id is the only required property, and the ControlProps from the device
/// definition send values that will be interpreted as the encoding_type merely
/// store their values
const exampleControlDataObject = {
  id: 0, // this is not the same as udid, but it the instance control
  x: 0,
  y: 0,
  jump: true
};

/// URSYS UDEVICE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class UDevice formalizes the notion of a "Device" on the network
 */
class UDevice {
  /** if provided an object, we want to create a UDevice instance from
   *  a plain object that was received  over the network. Otherwise4,
   *  we are making a new device
   */
  constructor(objOrClass, uname) {
    /// this.descriptor = { device, user, student, inputs, outputs }

    if (typeof objOrClass === 'object') this.deserialize(objOrClass);
    else if (typeof objOrClass === 'string') this._initNew(objOrClass, uname);
    else throw Error('UDevice constructor got invalid parameter:', objOrClass);
  }

  /** set a device property */
  setMetaProp(mprop, val) {
    if (this.meta[mprop] !== undefined) this.meta[mprop] = val;
    else throw Error(`meta prop ${mprop} doesn't exist`);
  }
  /** get a device property */
  getMetaProp(mprop) {
    if (this.meta[mprop] !== undefined) return this.meta[mprop];
    throw Error(`meta prop ${mprop} doesn't exist`);
  }

  /** add a control definition to the device inputs array */
  addInputControl(controlName, controlProps) {
    this._pushControlDef(this.inputs, controlName, controlProps);
  }
  /** add a control definition to the device outputs array */
  addOutputControl(controlName, controlProps) {
    this._pushControlDef(this.outputs, controlName, controlProps);
  }
  /** create a subset of device data that will be used for the device
   *  directory. It doesn't have user or student data
   */
  getDeviceDirectoryEntry() {
    const { udid, meta, inputs, outputs } = this;
    return {
      udid,
      meta,
      inputs,
      outputs
    };
  }
  /** return a copy of this devices inputs array */
  getInputControlList() {
    if (Array.isArray(this.inputs)) return this.inputs.slice();
    console.log(
      ...PR(`warning: ${this.udid} inputs is not an array so returning []`)
    );
    return [];
  }
  /** return a copy of this devices outputs array */
  getOutputControlList() {
    if (Array.isArray(this.outputs)) return this.outputs.slice();
    console.log(
      ...PR(`warning: ${this.udid} outputs is not an array so returning []`)
    );
    return [];
  }
  /** convert a JSON string or object into a UDevice instance */
  deserialize(deviceObj) {
    if (typeof deviceObj === 'string') deviceObj = JSON.parse(deviceObj);
    if (typeof deviceObj !== 'object')
      throw Error(`can not deserialize device ${deviceObj}`);
    const { udid, meta, user, student, inputs, outputs } = deviceObj;
    if (udid === undefined)
      throw Error('cannot deserialize deviceObj with missing udid');
    this.udid = udid;
    if (meta) {
      const { uapp, uaddr, uname, uclass, uapp_label, uapp_tags } = meta;
      this.meta = {};
      if (uapp) this.meta.uapp = uapp;
      if (uaddr) this.meta.uaddr = uaddr;
      if (uname) this.meta.uname = uname;
      if (uclass) this.meta.uclass = uclass;
      if (uapp_label) this.meta.uapp_label = uapp_label;
      if (Array.isArray(uapp_tags)) this.meta.uapp_tags = uapp_tags;
    }
    if (user) {
      const { uident, uauth, ugroups, uroles } = user;
      this.user = {};
      if (uident) this.user.uident = uident;
      if (uauth) this.user.uauth = uauth;
      if (Array.isArray(ugroups)) this.user.ugroups = ugroups;
      if (Array.isArray(uroles)) this.user.uroles = uroles;
    }
    if (student) {
      const { sid, sname, sauth } = student;
      if (sid) this.user.sid = sid;
      if (sname) this.user.sname = sname;
      if (sauth) this.user.sauth = sauth;
    }
    if (Array.isArray(inputs)) this.inputs = inputs;
    if (Array.isArray(outputs)) this.outputs = outputs;
  }
  /** return JSON string version of the data payload */
  serialize() {
    return JSON.stringify(this);
  }
  /** internal method used to add a control definition which looks like
   *  {
   *    controlName: 'markers',
   *    controlProps: { x: 'axis', y: 'axis', jump: 'trigger' }
   *  }
   */
  _pushControlDef(arr, cn, cp) {
    if (!DEVICE_ENCODINGS.includes(cp))
      throw Error(`no such controlType '${cp}'`);
    const control = {
      controlName: cn, // the name of the control (e.g. 'x')
      controlProps: cp, // the type of values produced by the control
      meta: {} // optional type-specific meta information (e.g. range)
    };
    arr.push(control);
  }
  /** internal method to create a blank device with default properties from
   *  the instantiating client with empty inputs, outputs. Use the
   *  addInputControl() and addOutputControl () methods to populate before
   *  registering the device
   */
  _initNew(uclass) {
    const uaddr = MyUADDR();
    const uapp = MyAppPath();
    this.udid = ''; // unique device id will be set by DATACORE.DeclareNewDevice()
    this.meta = {
      uapp, // device appserver route
      uaddr, // URNET address
      uclass, // device template or custom device name
      uapp_label: '', // non-unique name label
      uapp_tags: [], // app tagged capabilities
      uname: 'a_device' // human-readable device label (non-unique)s
    };
    this.user = {
      uident: '', // user login for this device, if any
      uauth: '' // authentication token (JWT), if any
    };
    this.student = {
      sid: '', // student id (unique in system)
      sname: '', // human readable name of the student
      sauth: '' // student authentication token, if any
    };
    // if a uclass was specified, then copy the inputs/outputs from the template
    if (DEVICE_CLASS_TEMPLATES[uclass]) {
      this.meta.uclass = uclass;
      const template = DEVICE_CLASS_TEMPLATES[uclass];
      if (template.inputs) this.inputs = template.inputs.slice(); // make copy of controlDefs
      if (template.outputs) this.outputs = template.outputs.slice(); // make copy controlDefs
    } else {
      this.inputs = []; // array of controlDefs
      this.outputs = []; // array of controlDefs
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for nodeJS cross-compatibility
module.exports = UDevice;
