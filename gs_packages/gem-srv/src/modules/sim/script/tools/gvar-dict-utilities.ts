/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

    GVAR Dict Utilities

    Utilities for defining and using dictionary data structures.
    This provides data for the slot editor to render the UI.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GVAR_DICT = new Map<string, any>(); // key, { bpName, constantName, constantValue }
const OPTIONS_METHODS = [
  'addOption',
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
 *  via a GVars `addOption` method by parsing script tokens.
 */
function GetGVarDicts(script_tokens): any {
  const dict = [];
  script_tokens.forEach(line_tokens => {
    if (line_tokens.length > 4) {
      const [keywordTok, objrefTok, methodTok, nameTok, valTok] = line_tokens;
      if (
        keywordTok.identifier === 'prop' &&
        OPTIONS_METHODS.includes(methodTok.identifier)
      ) {
        let propName, constantValue;

        // CURRENTLY NOT USED
        // because we do not need to specify a specific agent.
        // We simply return ALL constantValues for any CURRENT agent option-related method
        // rather than restricting it based on the specific NON-CURRENT agent (local or global)
        //
        // // 1. get propName
        // const objref = objrefTok.objref;
        // if (Array.isArray(objref)) {
        //   // ['character', 'colour']
        //   if (objref.length > 1) propName = objref[1];
        //   // ['colour']
        //   else propName = objref[0];
        // } else {
        //   // 'colour'
        //   propName = objref;
        // }

        // 2. get constant value
        constantValue = nameTok.string;

        dict.push(constantValue);
      }
    }
  });

  console.error('found gvar dicts', dict);
  return dict;
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GVAR_DICT, OPTIONS_METHODS, GetGVarDicts };
