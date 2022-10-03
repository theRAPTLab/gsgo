/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    device definition class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// DEPENDENCIES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPTS = require('./util/prompts');
const DATACORE = require('./client-datacore');
const DBG = require('./common/debug-props');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
    inputs: { 'markers': { x: 'axis', y: 'axis' } },
    outputs: { 'setGroup': { groups: 'array' } }
  },
  // ptrack simulator
  'FakeTrack': {
    inputs: { 'markers': { x: 'axis', y: 'axis' } }
  },
  // speculative display object
  'SimDisplay': {
    outputs: {
      'displaylist': { x: 'axis', y: 'axis', sprite: 'uint', state: 'byte' }
    }
  },
  'PTrack': {}, // ptrack generator
  'TrackerSetup': {
    // REVIEW:  must be defined, or results in error
    /* T0193 ERROR IN PROMISE TypeError: Cannot convert undefined or null to object
      at Function.keys (<anonymous>)
      at UDevice.getInputControlNames (webpack-internal:///./src/class-udevice.js:226:19)
    */
    // fake inputs and outputs for now to see if we can get device to show up
    inputs: { 'foo': { x: 'axis', y: 'axis' } },
    outputs: { 'bar': { groups: 'array' } }
  },
  'Sim': {
    // fake inputs and outputs for now to see if we can get device to show up
    inputs: { 'foo': { x: 'axis', y: 'axis' } },
    outputs: { 'bar': { groups: 'array' } }
  }, // simulation engine
  'VidServer': {}, // video server
  'URBroker': {} // URNET broker endpoint
};

/// a control definition is a name of a control and a specified type.
/// A device can have more than one control!
const exampleControlDefinition = { x: 'axis', y: 'axis', jump: 'trigger' };

/// A UDEVICE defines multiple control inputs and outputs in the eponymous
/// class properties.
const cdef = exampleControlDefinition;
const exampleUDevice = {
  udid: 'udev01:1',
  meta: {},
  inputs: { 'markers': cdef } // an array of cdef objects
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
/// devices have to tell clients what data is being mapped to what, and this
/// is handled with control frames. The unique device number is used.
const cdo = exampleControlDataObject;
const exampleControlFrame = {
  udid: 'udev01:1',
  markers: [cdo, cdo]
};

/// URSYS UDEVICE CLASS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Class UDevice formalizes the notion of a "Device" on the network
 */
class UDevice {
  /** if provided an object, we want to create a UDevice instance from
   *  a plain object that was received  over the network. Otherwise,
   *  we are making a new device
   */
  constructor(objOrClass, uname) {
    /// this.descriptor = { device, user, student, inputs, outputs }
    if (objOrClass === '') throw Error('UDevice got invalid arg1: empty string');
    if (typeof objOrClass === 'object') this.deserialize(objOrClass);
    else if (typeof objOrClass === 'string') this._initNew(objOrClass, uname);
    else throw Error('UDevice constructor got non-string arg1:', objOrClass);
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
  addInputDef(controlName, controlProps) {
    // this._pushControlDef(this.inputs, controlName, controlProps);
    this._addControlDef(this.inputs, controlName, controlProps);
  }

  /** add a control definition to the device outputs array */
  addOutputDef(controlName, controlProps) {
    // this._pushControlDef(this.outputs, controlName, controlProps);
    this._addControlDef(this.outputs, controlName, controlProps);
  }

  /** return a SUBSET of device data that will be used for the device
   *  directory. It doesn't have user or student data
   */
  getDeviceDescriptor() {
    const { udid, meta, inputs, outputs } = this;
    return {
      udid,
      meta,
      inputs,
      outputs
    };
  }

  /** return a copy of this devices inputs hash */
  getInputDefs() {
    // if (Array.isArray(this.inputs)) return this.inputs.slice();
    if (typeof this.inputs === 'object') return this.inputs;
    console.log(
      ...PR(`warning: ${this.udid} inputs is not a object so returning []`)
    );
    return [];
  }

  /** return a copy of this devices outputs hash */
  getOutputDefs() {
    // if (Array.isArray(this.outputs)) return this.outputs.slice();
    if (typeof this.outputs === 'object') return this.outputs;
    console.log(
      ...PR(`warning: ${this.udid} outputs is not an object so returning []`)
    );
    return [];
  }

  /** list input names */
  getInputControlNames() {
    return Object.keys(this.inputs);
  }

  /** list output names */
  getOutputControlNames() {
    return Object.keys(this.outputs);
  }

  /** return a "builder" function that generates a control frame with your name */
  getControlFramer(cName) {
    if (typeof cName !== 'string') throw Error('arg1 must be string');
    // make sure the controlName is actually valid
    if (!(this.inputs[cName] || this.outputs[cName]))
      throw Error(`${cName} is not a defined control`);
    /** create a function that takes cdata (obj or obj[]) and returns
     *  the appropriate controlFrame populated with that cdata, with
     *  optional cProp validation
     */
    return (cdata, opt = { validate: false }) => {
      if (!Array.isArray(cdata)) cdata = [cdata];
      if (opt.validate) console.log('cData validation not yet implemented');
      return { udid: this.udid, [cName]: cdata };
    }; // end return function
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
    if (typeof inputs === 'object') this.inputs = inputs;
    if (typeof outputs === 'object') this.outputs = outputs;
  }

  /** return JSON string version of the data payload */
  serialize() {
    return JSON.stringify(this);
  }
  /** internal method used to add a control definition which looks like
   *  control = { 'markers':{ x:'axis', y:'axis', jump:'trigger' } }
   *  should only add one
   */
  _addControlDef(ioHash, cName, cProps) {
    // validate control object
    const cTypes = Object.values(cProps); // array of encodings 'axis'
    cTypes.forEach(enc => {
      if (!DEVICE_ENCODINGS.includes(enc))
        throw Error(`invalid encoding '${enc}'`);
    });
    if (ioHash[cName] !== undefined)
      console.warn(`'${cName}' control is being overwritten`);
    // add to hash
    ioHash[cName] = cProps;
  }
  /** internal method to create a blank device with default properties from
   *  the instantiating client with empty inputs, outputs. Use the
   *  addInputDef() and addOutputDef () methods to populate before
   *  registering the device
   */
  _initNew(uclass) {
    this.udid = DATACORE.GetNewDeviceUDID(); // in DATACORE
    const uaddr = DATACORE.MyUADDR();
    const uapp = DATACORE.MyAppPath();
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
    this.meta.uclass = uclass;
    if (DEVICE_CLASS_TEMPLATES[uclass]) {
      const template = DEVICE_CLASS_TEMPLATES[uclass];
      if (template.inputs) this.inputs = { ...template.inputs }; // shallow copy of controlDef map
      if (template.outputs) this.outputs = { ...template.outputs }; // shallow copy controlDef map
    } else {
      this.inputs = {}; // hash of controlName, controlDef
      this.outputs = {}; //hash of controlName, controlDef
    }
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// using CommonJS format on purpose for nodeJS cross-compatibility
module.exports = UDevice;
