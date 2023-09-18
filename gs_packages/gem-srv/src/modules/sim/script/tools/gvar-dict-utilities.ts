/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    GVAR Dict Utilities

    Utilities for defining and using dictionary data structures.
    This provides data for the slot editor to render the UI.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GVAR_DICT = new Map<string, any>(); // [ propName, [ constantName ] ]
const OPTIONS_LIST_METHODS = [
  // 'addOption', -- does not include 'addOption' because it is used to to add
  // new options rather than select from a list of options
  'setToOption',
  'equalToOption',
  'notEqualToOption',
  'greaterThanOption',
  'lessThanOption',
  'greaterThanOrEqualToOption',
  'lessThanOrEqualToOption'
];

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Constructs a list of "options" defined in a `map` dictionary for GVars
 *  via a GVars `addOption` method by parsing script tokens
 *  for the current blueprint
 *  @param {Array} script_tokens Array of script lines
 *  @returns {map} [ propName, [constantValues] ]
 */
function GetGVarDicts(script_tokens): any {
  const dict = new Map();
  script_tokens.forEach(line_tokens => {
    if (line_tokens.length > 4) {
      const [keywordTok, objrefTok, methodTok, nameTok, valTok] = line_tokens;
      if (
        keywordTok.identifier === 'prop' &&
        methodTok.identifier === 'addOption'
        // OPTIONS_LIST_METHODS.includes(methodTok.identifier)
      ) {
        let propName, constantValue;

        // 1. get propName
        const objref = objrefTok.objref;
        if (Array.isArray(objref)) {
          // ['character', 'colour']
          if (objref.length > 1) propName = objref[1];
          // ['colour']
          else propName = objref[0];
        } else {
          // 'colour'
          propName = objref;
        }

        // 2. get constant value
        constantValue = nameTok.string;

        // 3. update constant values for each propName
        const values = dict.get(propName) || [];
        values.push(constantValue);
        dict.set(propName, values);
      }
    }
  });

  return dict;
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GVAR_DICT, OPTIONS_LIST_METHODS, GetGVarDicts };
