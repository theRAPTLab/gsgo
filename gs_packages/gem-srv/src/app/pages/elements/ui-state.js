/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  pure data module for import by multiple modules that need to share this
  data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

const DBG = true;
const PR = UR.PrefixUtil('UI-STATE', 'TagDkOrange');

/// REACT STATE COMPATIBLE FLAT OBJECTS ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STATE = {
  locales: [],
  localeNames: [],
  app: {
    devices: '',
    entities: '',
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
/** Check if STATE contains a "section" with a particular property
 */
function u_StateHas(sec, prop) {
  const sections = Object.keys(STATE);
  if (prop === undefined) return sections.includes(sec);
  const props = Object.keys(STATE[sec]);
  return props.includes(prop);
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Call in the constructor of a component that is using this UISTATE module,
 *  passing a list of string arguments of sections to include.
 *  Returns { [arg1]: sectionData, [arg2]: sectionData, ... }
 */
export function ReadState(...sections) {
  const returnState = {};
  sections.forEach(section => {
    if (!u_StateHas(section))
      console.warn(...PR(`section '${section}' not in STATE`));
    else Object.assign(returnState, { [section]: STATE[section] });
  });
  console.log(
    ...PR(`... GetStateSections() returning ${JSON.stringify(returnState)}`)
  );
  return returnState;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Set a property within a section to a value. You can change one property in
 *  the section by (option 1) providing three parameters sec, prop, value. or
 *  you can (option 2) overwrite the entire section with sec, {}. NOTE: if you
 *  change the property names in the section, the next time you make a call here
 *  using (option 1) you can only change existing properties.
 */
export function SetState(sec, prop, value) {
  const syntaxError = 'args are (sec,{}) or (sec,key,value)';
  if (sec === undefined) throw Error(syntaxError);
  if (!u_StateHas(sec)) {
    console.error(
      `SetStateSection() invalid state[${sec}] (value to set:${value})`
    );
    return undefined;
  }
  if (typeof prop === 'string' && value !== undefined) {
    // write section prop with value
    if (!u_StateHas(sec, prop)) {
      console.error(`SetStateSection() invalid state.${sec} ${prop}`);
      return undefined;
    }
    STATE[sec][prop] = value;
    if (DBG)
      console.log(...PR(`SetStateSection() change: ${sec}.${prop} = ${value}`));
  } else if (typeof prop === 'object') {
    // write entire object to section
    STATE[sec] = prop;
    if (DBG)
      console.log(
        ...PR(`SetStateSection() change: ${sec} = ${JSON.stringify(prop)}`)
      );
  } else throw Error(syntaxError);
  return STATE[sec];
}
