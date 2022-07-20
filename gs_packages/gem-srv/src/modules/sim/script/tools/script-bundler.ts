/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIM BUNDLER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Bundle from 'lib/class-sm-bundle';
// workaround to import enumeration types as objects requires dirpath hack
import { EBundleType, EBundleTag } from 'modules/../types/t-script.d';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMBOL', 'TagPurple');

/// GLOBAL DATACORE STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let CUR_NAME: string; // the current compiling bundle name (blueprint)
let CUR_PROGRAM: string; // the current compiler output track
let CUR_BUNDLE: SM_Bundle;
let CUR_GLOBALS: TAnyObject;

/// MODULE HELPERS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility: throws an error if there is no CURRENT_BUNDLE, otherwise */
function m_HasCurrentBundle(prompt: string): SM_Bundle {
  if (CUR_BUNDLE === undefined)
    throw Error(`${prompt} call OpenBundle() before this call`);
  return CUR_BUNDLE;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility: throws an error if there is a CURRENT_BUNDLE set */
function m_CheckNoOpenBundle(prompt: string): void {
  if (CUR_BUNDLE !== undefined)
    throw Error(`${prompt} bundle already set ${CUR_BUNDLE.name}`);
  return undefined;
}

/// BUNDLE STATUS FOR CURRENT TRANSPILER OPERATION ////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the state of the bundler, which is valid while a blueprint
 *  script is being compiled (e.g. CompileBlueprint()) */
function BundlerState() {
  return {
    bpName: CUR_NAME,
    programOut: CUR_PROGRAM,
    bundle: CUR_BUNDLE,
    globals: CUR_GLOBALS
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return data structure used by CompileStatement */
function SymbolRefs(): TSymbolRefs {
  return { bundle: CUR_BUNDLE, globals: CUR_GLOBALS };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ClearBundlerState() {
  CUR_NAME = undefined;
  CUR_PROGRAM = 'INIT'; // default to init always
  CUR_BUNDLE = undefined;
  CUR_GLOBALS = {};
}

/// COMPILER BUNDLE GATEKEEPING ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Tranpiler uses these to set an implicit bundle that's used for operations
/// to maintain compatibility
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Sets the "working bundle" from either a provided bundle or bpName
 *  that is an index into the SIMDATA Bundle Dictionary */
function OpenBundle(bp: string | SM_Bundle): SM_Bundle {
  const fn = 'BeginBundle:';
  m_CheckNoOpenBundle(fn);
  if (CUR_GLOBALS === undefined) CUR_GLOBALS = {};
  if (bp instanceof SM_Bundle) CUR_BUNDLE = bp;
  if (typeof bp === 'string') CUR_BUNDLE = SIMDATA.GetOrCreateBlueprintBundle(bp);
  if (CUR_BUNDLE instanceof SM_Bundle) return CUR_BUNDLE;
  throw Error(`${fn} arg1 was not a bundle or bundleName`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: close the bundle, which unsets the CUR_BUNDLE and disables
 *  the bundle state methods that rely on current bundle. */
function CloseBundle(): SM_Bundle {
  const fn = 'EndBundle:';
  const bdl = m_HasCurrentBundle(fn);
  CUR_BUNDLE = undefined;
  CUR_GLOBALS = undefined;
  return bdl;
}

/// BUNDLE OPERATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the datacore global var CUR_PROGRAM to bdlKey, which tells the
 *  AddProgram(bdl,prog) call where the program should be added */
function SetProgramOut(progName: string): boolean {
  const fn = 'SetProgramOut:';
  if (DBG) console.log(...PR(`${fn} setting bundleType ${progName}`));
  m_HasCurrentBundle(fn);
  const bdlKey = progName.toUpperCase();
  if (CHECK.IsValidBundleProgram(bdlKey)) {
    CUR_PROGRAM = bdlKey;
    return true;
  }
  console.warn(`${fn} invalid bundle key ${bdlKey}`);
  return false;
}

/// BUNDLE SETTINGS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// methods for setting the fixed properties of a bundle
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the datacore global var CUR_NAME to to bpName, which tells the
 *  AddProgram(bdl,prog) call where the program should be added. Used by
 *  Transpiler */
function SetBundleName(bpName: string, bpParent?: string): boolean {
  const fn = 'SetBundleName:';
  const bdl = m_HasCurrentBundle(fn);
  if (!(bdl instanceof SM_Bundle)) {
    console.warn('no current bundle to name');
    return false;
  }
  if (typeof bpName !== 'string') {
    console.warn('arg2 is not bundleName, got:', bpName);
    return false;
  }
  if (bpParent !== undefined && typeof bpParent !== 'string') {
    console.warn('arg3 is not bundleParent, got:', bpParent);
    return false;
  }
  // set the bundle name AND save it
  bdl.name = bpName;
  CUR_NAME = bpName;
  if (DBG) console.log(...PR(`${fn} setting bundleName ${CUR_NAME}`));
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the globals object to use during current compiler operation */
function AddGlobals(globals: TAnyObject): boolean {
  const fn = 'AddGlobals:';
  const bdl = m_HasCurrentBundle(fn);
  if (!(bdl instanceof SM_Bundle)) {
    console.warn('no current bundle active');
    return false;
  }
  if (typeof globals !== 'object') {
    console.warn('arg is not an object', globals);
    return false;
  }
  CUR_GLOBALS = { ...CUR_GLOBALS, ...globals };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the bundle type of current bundle */
function SetBundleType(type: EBundleType = EBundleType.BLUEPRINT) {
  const fn = 'SetBundleType:';
  const bdl = m_HasCurrentBundle(fn);
  if (bdl.type !== type) {
    if (DBG)
      console.warn(`${fn} ${bdl.name} type changed from ${bdl.type} to ${type}`);
  }
  bdl.setType(type);
  if (DBG) console.log(...PR(`${fn} setting bundleType ${type}`));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set one of several tags */
function SetBundleTag(tagName: EBundleTag, tagValue: any): boolean {
  const fn = 'SetBundleTag:';
  const bdl = m_HasCurrentBundle(fn);
  if (!(bdl instanceof SM_Bundle)) {
    console.warn('arg1 is not a bundle, got:', bdl);
    return false;
  }
  if (typeof tagName !== 'string') {
    console.warn('arg2 is not bundleName, got:', tagName);
    return false;
  }
  if (tagValue === undefined) {
    console.warn('arg3 is not tagValue, got:', tagValue);
    return false;
  }
  // set the bundle name AND save it
  bdl.setTag(tagName, tagValue);
  if (DBG) console.log(...PR(`${fn} setting bundleTag ${tagName} ${tagValue}`));
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set tags from TAGS { [tagName]:value }
 *  the tagname is derived from decoded scriptunit args[0]
 *  the tagvalue is derived from args[1]
 *  i.e. the source scriptokens were _pragma TAG ...args
 */
function SetBundleTags(tags: { [tagName: string]: any }) {
  Object.entries(tags).forEach(([name, value]) => {
    SetBundleTag(name as EBundleTag, value);
  });
}

/// BUNDLE INCREMENTALLY ADDED DATA ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// methods that add data
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: add a compiled program to a bundle, based on the current programOut
 *  setting. */
function AddProgram(prog: TSMCProgram) {
  const fn = 'AddProgram:';
  const bdl = m_HasCurrentBundle(fn);
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[CUR_PROGRAM]) bdl[CUR_PROGRAM] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${CUR_PROGRAM}]`);
  bdl[CUR_PROGRAM].push(...prog);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: special case when we want to add some code to a specfic named
 *  program other than the current one */
function AddToProgramOut(prog: TSMCProgram, progName: string) {
  const fn = 'AddToProgramOut:';
  const bdl = m_HasCurrentBundle(fn);
  const bdlKey = progName.toUpperCase();
  if (!CHECK.IsValidBundleProgram(bdlKey))
    throw Error(`${fn} invalid progName ${bdlKey}`);
  if (bdlKey === CUR_PROGRAM && DBG)
    console.warn(`${fn} progname '${bdlKey}' is already the set output`);
  if (typeof bdl !== 'object') throw Error(`${fn} ${bdl} is not an object`);
  if (!bdl[bdlKey]) bdl[bdlKey] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${bdlKey}]`);
  bdl[bdlKey].push(...prog);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: add properties to symbol table where TBundleSymbols contains
 *  { props, methods, features } that point to a Map<string,gvar> or
 *  Map<string,any[]> respectively:
 *  { features: { [featName]: featModule } }
 *  { props: { [propName]: propType } }
 *  { methods: { [methodName]: methodArgs } }
 */
function AddSymbols(symdata: TSymbolData) {
  const fn = 'AddSymbols:';
  const bdl = m_HasCurrentBundle(fn);
  if (bdl.symbols === undefined) bdl.symbols = {};
  const _bdlsym = bdl.symbols;

  if (symdata === undefined) {
    console.warn(`${fn} no symbol data provided`);
    return;
  }

  if (symdata.features) {
    // featureName --> featureModule
    if (_bdlsym.features === undefined) _bdlsym.features = {};
    for (const [featName, featSymbols] of Object.entries(symdata.features)) {
      if (DBG && _bdlsym.features[featName]) {
        console.groupCollapsed(
          `%credefining feature ${featName}`,
          'color:rgba(0,0,0,0.25)'
        );
        console.groupEnd();
      }
      if (DBG) {
        console.groupCollapsed(...PR(`AddSymbol: ${featName}`));
        console.log(featSymbols);
        console.groupEnd();
      }
      _bdlsym.features[featName] = featSymbols;
      // if (DBG) console.log(bdl.name, 'addFeature', key);
    }
  }
  if (symdata.props) {
    // propName --->
    if (_bdlsym.props === undefined) _bdlsym.props = {};
    for (const [propName, symbolData] of Object.entries(symdata.props)) {
      if (DBG && _bdlsym.props[propName]) {
        console.groupCollapsed(
          `%credefining prop ${propName}`,
          'color:rgba(0,0,0,0.25)'
        );
        console.log('old, new', _bdlsym.props[propName], symbolData);
        console.groupEnd();
      }
      if (DBG) {
        console.groupCollapsed(...PR(`AddSymbol: ${propName}`));
        console.log(symbolData);
        console.groupEnd();
      }
      _bdlsym.props[propName] = symbolData;
      // if (DBG) console.log(bdl.name, 'addProp', key, argType);
    }
  }
  if (symdata.error) console.log('symbol error:', symdata.error);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Save a script to the bundle */
function SaveScript(script: TScriptUnit[]) {
  const fn = 'SaveScript:';
  const bdl = m_HasCurrentBundle(fn);
  bdl.saveScript(script);
}

/// CURRENT BUNDLE INSPECTORS /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsValidBundle() {
  const fn = 'IsValidBundle:';
  const bdl = m_HasCurrentBundle(fn);
  return CHECK.IsValidBundle(bdl);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasBundleName() {
  return CUR_NAME;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: an active bundler is when the bundle is set, but not necessarily
 *  the name or current program
 */
function BundlerActive() {
  return CUR_BUNDLE !== undefined;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BundlerProgramIsSet() {
  return BundlerActive() && CUR_PROGRAM !== undefined;
}

/// SYMBOL BUNDLE LOOKUPS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasFeatureSymbols(sName: string) {
  const fn = 'HasFeatureSymbol:';
  const bdl = m_HasCurrentBundle(fn);
  const { features } = bdl.symbols;
  if (features) return features[sName];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasPropSymbols(pName: string) {
  const fn = 'HasPropSymbol:';
  const bdl = m_HasCurrentBundle(fn);
  const { props } = bdl.symbols;
  if (props) return props[pName];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HasBlueprintSymbols(bpName: string) {
  const fn = 'HasBlueprintSymbols:';
  const bdl = m_HasCurrentBundle(fn);
  const blueprint = SIMDATA.GetBlueprintBundle(bpName);
  if (blueprint) return blueprint.symbols;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Compiletime Utility: if the passed objref has symbols in the current
 *  blueprint bundle or the global blueprints table, return its symbol data from
 *  the bundle. Note that this does not check symbols for correctness; that is
 *  the job of the validation pass that runs before compile!!! */
function GetSymbolsForObjref(
  objref: IToken
): [category: string, parts: string[]] {
  const fn = 'GetSymbolsForObjref:';
  let cat: string;
  let [type, ref] = CHECK.UnpackToken(objref);
  if (type === 'identifier' || type === 'jsString') {
    ref = [ref];
  } else if (type !== 'objref') return ['invalid-token', undefined];
  cat = ref[0]; // first part
  if (DBG) console.log(`${fn} processing objRef`, objref);
  if (cat === 'agent') {
    if (DBG) console.log(`...renaming ${cat} to ${ref[1]}, ref is`, ref);
    cat = ref[1]; // remove agent part
    ref.shift();
    if (DBG) console.log(`...cat is now ${cat}, ref is`, ref);
  }
  const len = ref.length;
  // test features
  let symbols = HasFeatureSymbols(cat);
  if (symbols) {
    if (len === 1) return ['feature', ref];
    if (len === 2) return ['featureProp', ref];
    return ['invalid-featref', undefined];
  }
  // test props
  symbols = HasPropSymbols(cat);
  if (symbols) {
    if (len === 1) return ['prop', ref];
    return ['invalid-propref', undefined];
  }
  // test blueprints - note that the blueprint referred to has to exist
  // in the current blueprints dictionary to pass
  symbols = HasBlueprintSymbols(cat);
  if (symbols) {
    if (len === 2) return ['blueprintFeature', ref];
    if (len === 3) return ['blueprintFeatureProp', ref];
    return ['invalid-bp', undefined];
  }

  // failure
  return ['invalid-match', undefined];
}

/// ERROR LOGGING /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LogKeywordError(keyword: string, scriptLine) {
  console.log(`error: ${keyword} with`, scriptLine);
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  OpenBundle,
  CloseBundle,
  //
  SetBundleName,
  AddGlobals,
  SymbolRefs,
  SetBundleType,
  SetProgramOut,
  SetBundleTag,
  SetBundleTags,
  AddProgram,
  AddToProgramOut, //
  AddSymbols,
  SaveScript,
  //
  LogKeywordError,
  //
  BundlerState,
  ClearBundlerState,
  BundlerActive,
  BundlerProgramIsSet,
  //
  IsValidBundle,
  HasBundleName,
  //
  HasFeatureSymbols,
  HasPropSymbols,
  HasBlueprintSymbols,
  GetSymbolsForObjref
};
