/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  pure data module for import by multiple modules that need to share this
  data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STATE = {
  select: {
    localeId: ''
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
    console.error(`invalid state[section] ${sec}`);
    return undefined;
  }
  if (typeof prop === 'string' && value !== undefined) {
    // write section prop with value
    if (!u_StateHas(sec, prop)) {
      console.error(`invalid state.${sec} ${prop}`);
      return undefined;
    }
    STATE[sec][prop] = value;
  } else if (typeof prop === 'object') {
    // write entire object to section
    STATE[sec] = prop;
  } else throw Error(syntaxError);
  console.log('stage changed', sec, prop);
  return STATE[sec];
}

/// API METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
