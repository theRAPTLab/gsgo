/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE TYPE DICTIONARIES

  These are the lookup tables that are used to validate parameters of different
  types. We need these because we're interpreting GEM-SCRIPT, and can't rely
  on Typescript's compile-time static type checking to help us here.

  inherits data structures from
  - dc-sim-resources    ValidateArgs used by RegisterKeyword

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import {
  TSymArg,
  TSymUnpackedArg,
  TSValidType,
  EBundleType
} from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const VALID_ARGTYPES: TSValidType[] = [
  // see t-script.d "SYMBOL DATA AND TYPES"
  // these are used both for keyword args and method signature args
  'boolean',
  'string',
  'number',
  'enum',
  //
  'prop', // same as objref in some keywords
  'method',
  'gvar',
  'block',
  //
  'objref', // value of anobject ref
  'expr', // an expression that can be coerced to any type
  '{value}', // composite: literal, objref or expression
  //
  'pragma',
  'test',
  'program',
  'event',
  'feature',
  'blueprint',
  // placeholder keyword args for use in scriptunits
  '{...}'
];

/// KEYWORD UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of TSymbolArgType (or array of arrays TSymbolArgType)
 *  iterate through all the argument definitions and make sure they are
 *  valid syntax
 */
function ValidateArgs(args: TSymArg[]): boolean {
  const fn = 'ValidateArgs';
  if (!Array.isArray(args)) {
    console.warn(`${fn}: invalid argtype array`);
    return false;
  }
  for (const arg of args) {
    if (Array.isArray(arg)) return ValidateArgs(arg);
    if (typeof arg !== 'string') {
      console.warn(`${fn}: invalid argDef ${typeof arg}`);
      return false;
    }
    if (DBG)
      console.log(
        `%c${arg}%c passes arg check`,
        'font-weight:bold',
        'font-weight:normal'
      );
    const [argName, argType] = arg.split(':');
    if (argName.length === 0) {
      console.warn(`${fn}: missing argName in '${arg}'`);
      return false;
    }
    if (!VALID_ARGTYPES.includes(argType as TSValidType)) {
      console.warn(`${fn}: '${arg}' has invalid argtype`);
      return false;
    }
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a string 'arg' of form 'name:argType', return [name, argType] if the
 *  string meets type requirements, [undefined, undefined] otherwise
 */
function UnpackArg(arg: TSymArg): TSymUnpackedArg {
  if (typeof arg !== 'string') return [undefined, undefined];
  let [name, type, ...xtra] = arg.split(':') as TSymUnpackedArg;
  // if there are multiple :, then that is an error
  if (xtra.length > 0) return [undefined, undefined];
  if (!VALID_ARGTYPES.includes(type)) return [undefined, undefined];
  // a zero-length name is an error except for the
  // multi-argument {args} glob type
  if (name.length === 0) {
    if (type === '{...}') name = '**';
    else return [undefined, undefined];
  }
  // name and type are good, so return valid unpacked arg
  return [name, type];
}

/// BUNDLE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// valid keys are defined in ISMCBundle, and values indicate the
/// context that these program
const BUNDLE_CONTEXTS = [
  'define',
  'init',
  'update',
  'think',
  'exec',
  'condition',
  'event',
  'test',
  'conseq',
  'alter'
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsValidBundleProgram(name: string): boolean {
  return BUNDLE_CONTEXTS.includes(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the passed bundle string is valid */
function IsValidBundleType(type: EBundleType) {
  return Object.values(EBundleType).includes(type as any);
}

/// MODULE ExPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ValidateArgs, UnpackArg };
export { UnpackToken } from 'script/tools/class-gscript-tokenizer-v2';
export { IsValidBundleProgram, IsValidBundleType };
