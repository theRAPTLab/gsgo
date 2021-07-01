/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  pure data module for import by multiple modules that need to share this
  data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STATE = {
  app: {
    devices: 'pre string',
    entities: 'pre string',
    localeId: 0
  },
  transform: {
    xRange: 1,
    yRange: 1,
    xOff: 0,
    yOff: 0,
    xScale: 1,
    yScale: 1,
    zRot: 0
  },
  faketrack: {
    num_entities: 2,
    prefix: 'f',
    jitter: 1,
    burst: false
  }
};
/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_StateHas(sec, prop) {
  const sections = Object.keys(STATE);
  if (prop === undefined) return sections.includes(sec);
  const props = Object.keys(STATE[sec]);
  return props.includes(prop);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetStateSection(sec, prop, value) {
  const syntaxError = 'args are (sec,{}) or (sec,key,value)';
  if (sec === undefined) throw Error(syntaxError);
  if (!u_StateHas(sec)) {
    console.error(`invalid state[${sec}] (value to set:${value})`);
    return undefined;
  }
  if (typeof prop === 'string' && value !== undefined) {
    // write section prop with value
    if (!u_StateHas(sec, prop)) {
      console.error(`invalid state.${sec} ${prop}`);
      return undefined;
    }
    STATE[sec][prop] = value;
    console.log(`state change: ${sec}.${prop} = ${value}`);
  } else if (typeof prop === 'object') {
    // write entire object to section
    STATE[sec] = prop;
    console.log(`state change: ${sec} = ${JSON.stringify(prop)}`);
  } else throw Error(syntaxError);
  return STATE[sec];
}

/// API METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetInitialStateFor(...args) {
  const returnState = {};
  [...args].forEach(sname => {
    if (u_StateHas(sname)) Object.assign(returnState, STATE[sname]);
  });
  return returnState;
}
/// - - - - - - - - - ß- - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function SetXForm(obj) {
  const keys = Object.keys(obj);
  keys.forEach(key => {
    SetStateSection('transform', key, obj[key]);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function XFormState() {
  return STATE.transform;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function FaketrackControlState() {
  return STATE.faketrack;
}
