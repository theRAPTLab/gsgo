/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE TYPE DICTIONARIES

  These are the lookup tables that are used to validate parameters of different
  types. We need these because we're interpreting GEM-SCRIPT, and can't rely
  on Typescript's compile-time static type checking to help us here.

  Decoders take an object and interpret it as a value
  Unpackers take an object and return [type, value]
  Validators take an object and return the value, validOptions, and errors

  A kwTok is a scriptToken that follows the keyword. They are of type IToken,
  an object with properties.
  A mArg is an argument passed to an SMObject method. They are of type
  TGSArg, a formatted string.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// workaround to import enumeration types as objects requires dirpath hack
import { EBundleType, EBundleTag } from 'modules/../types/t-script.d';
import { SCRIPT_PAGE_INDEX_OFFSET } from 'config/dev-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// LINE AND POSITION NUMBERING UTILITIES /////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** convert a zero-based index to 1-indexing if SCRIPT_PAGE_INDEX_OFFSET is set */
function OffsetLineNum(num: number, inc: 'add' | 'sub'): number {
  const fn = 'OffsetLineNum:';
  if (inc === 'add') return num + SCRIPT_PAGE_INDEX_OFFSET;
  if (inc === 'sub') return num - SCRIPT_PAGE_INDEX_OFFSET;
  throw Error(`${fn} arg2 must be 'add' or 'sub'`);
}

/// METHOD ARGUMENT UTILITIES /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GSTYPES: TGSType[] = [
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given an array of TSymbolArgType (or array of arrays TSymbolArgType)
 *  iterate through all the argument definitions and make sure they are
 *  valid syntax
 */
function AreValidArgs(args: TGSArg[]): boolean {
  const fn = 'AreValidArgs';
  if (!Array.isArray(args)) {
    console.warn(`${fn}: invalid argtype array`);
    return false;
  }
  for (const arg of args) {
    if (Array.isArray(arg)) return AreValidArgs(arg);
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
    const [argName, gsType] = arg.split(':');
    if (argName.length === 0) {
      console.warn(`${fn}: missing argName in '${arg}'`);
      return false;
    }
    if (!GSTYPES.includes(gsType as TGSType)) {
      console.warn(`${fn}: '${arg}' has invalid gsType`);
      return false;
    }
  }
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a string 'arg' of form 'name:argType', return [name, argType] if the
 *  string meets type requirements, [undefined, undefined] otherwise
 */
function UnpackArg(arg: TGSArg): TSymUnpackedArg {
  if (Array.isArray(arg)) return ['{...}', '{list}']; // when keyword uses weird array of args that needs to be fixed
  if (typeof arg !== 'string') return [undefined, undefined];
  let [name, gsType, ...xtra] = arg.split(':') as TSymUnpackedArg;
  // if there are multiple :, then that is an error
  if (xtra.length > 0) return [undefined, undefined];
  if (!GSTYPES.includes(gsType)) return [undefined, undefined];
  // a zero-length name is an error except for the
  // multi-argument {args} glob type
  if (name.length === 0) {
    if (gsType === '{...}') name = '**';
    else return [undefined, undefined];
  }
  // name and type are good, so return valid unpacked arg
  return [name, gsType];
}

/// BUNDLE UTILITIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// valid keys are defined in ISMCBundle, and values indicate the
/// simulation engine phase/context.
const BUNDLE_CONTEXTS = [
  'define', // programs that run during SIM DEFINE for each agent
  'init', // programs that run on SIM INITIALIZE the agent state
  'update', // programs that run on every SIM UPDATE
  'think', // programs that run during SIM AI thinking phase
  'exec', // programs that run during SIM EXECUTION phase
  //
  'condition', // programs that define global triggers
  'event', // programs that define event handlers
  //
  'test', // result of a conditional keyword
  'conseq', // block of code to run if condition true
  'alter' // block of code to run if condition false
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsValidBundleProgram(name: string): boolean {
  return BUNDLE_CONTEXTS.includes(name.toLowerCase());
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the passed bundle string is valid */
function IsValidBundleType(type: EBundleType) {
  return Object.values(EBundleType).includes(type as any);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the passed bundle string is valid */
function IsValidBundleTag(type: EBundleType) {
  return Object.values(EBundleTag).includes(type as any);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: returns bundle if it is a bundle with minimum properties,
 *  throw error otherwise
 */
function IsValidBundle(bundle: ISMCBundle) {
  const fn = 'IsValidBundle:';
  if (bundle === undefined) {
    console.warn(`${fn} arg must be bundle object`);
    return false;
  }
  const { symbols, name } = bundle;
  if (typeof name !== 'string' || name.length === 0) {
    console.warn(`${fn} bundle missing name`);
    return false;
  }
  const { props, features } = symbols;
  const hasSymbols =
    typeof props !== 'undefined' || typeof features !== 'undefined';
  if (hasSymbols) return true;
  console.warn(`${fn} missing props or features dict(s)`, bundle);
  return undefined;
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// data check utitlities
export { OffsetLineNum };

/// token check utilities
export {
  // type checks
  IsNonCodeToken,
  IsValidToken,
  IsValidTokenKey,
  // token evaluation
  DecodePragmaToken,
  DecodeKeywordToken,
  UnpackToken,
  UnpackStatement,
  TokenValue
} from 'script/tools/class-gscript-tokenizer-v2';
export {
  // method arguments
  UnpackArg,
  AreValidArgs
};
export {
  /// bundle checking utilities
  IsValidBundleProgram,
  IsValidBundleType,
  IsValidBundleTag,
  IsValidBundle
};
