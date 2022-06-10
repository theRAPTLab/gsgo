/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIM BUNDLER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Bundle from 'lib/class-sm-bundle';
// workaround to import enumeration types as objects requires dirpath hack
import { EBundleType, EBundleTag } from 'modules/../types/t-script.d';
import * as CHECK from '../../../datacore/dc-sim-data-utils';
import * as SIMDATA from '../../../datacore/dc-sim-data';

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
 *  script is being compiled (e.g. CompileBlueprint())
 */
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
  CUR_PROGRAM = undefined;
  CUR_BUNDLE = undefined;
  CUR_GLOBALS = {};
}

/// COMPILER BUNDLE GATEKEEPING ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Tranpiler uses these to set an implicit bundle that's used for operations
/// to maintain compatibility
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Sets the "working bundle" from either a provided bundle or bpName
 *  that is an index into the SIMDATA Bundle Dictionary
 *  @param {(string|SM_Bundle)} bp - blueprintName or bundle to use for
 *  subsequent bundle operations
 *  @returns SM_Bundle
 */
function OpenBundle(bp: string | SM_Bundle): SM_Bundle {
  const fn = 'BeginBundle:';
  m_CheckNoOpenBundle(fn);
  if (CUR_GLOBALS === undefined) CUR_GLOBALS = {};
  if (bp instanceof SM_Bundle) CUR_BUNDLE = bp;
  if (typeof bp === 'string') CUR_BUNDLE = SIMDATA.GetBlueprintBundle(bp);
  if (CUR_BUNDLE instanceof SM_Bundle) return CUR_BUNDLE;
  throw Error(`${fn} arg1 was not a bundle or bundleName`);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: close the bundle, which unsets the CUR_BUNDLE and disables
 *  the bundle state methods that rely on current bundle.
 *  @returns the bundle that was originally "opened" with OpenBundle()
 */
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
 *  AddProgram(bdl,prog) call where the program should be added
 */
function SetProgramOut(str: string): boolean {
  const fn = 'SetProgramOut:';
  if (DBG) console.log(...PR(`${fn} setting bundleType ${str}`));
  m_HasCurrentBundle(fn);
  const bdlKey = str.toLowerCase();
  if (CHECK.IsValidBundleProgram(bdlKey)) {
    CUR_PROGRAM = bdlKey;
    return true;
  }
  return false;
}

/// BUNDLE SETTINGS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// methods for setting the fixed properties of a bundle
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the datacore global var CUR_NAME to to bpName, which tells the
 *  AddProgram(bdl,prog) call where the program should be added. Used by
 *  Transpiler.
 */
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
  const fn = 'SetProgramOut:';
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
 *  setting.
 *  note: bundle type because it may not have been set yet.
 */
function AddProgram(prog: TCompiledStatement) {
  const fn = 'SetProgramOut:';
  const bdl = m_HasCurrentBundle(fn);
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[CUR_PROGRAM]) bdl[CUR_PROGRAM] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${CUR_PROGRAM}]`);
  bdl[CUR_PROGRAM].push(...prog);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: add properties to symbol table where TBundleSymbols contains
 *  { props, methods, features } that point to a Map<string,gvar> or
 *  Map<string,any[]> respectively:
 *  { features: { [featName]: featModule } }
 *  { props: { [propName]: propType } }
 *  { methods: { [methodName]: methodArgs } }
 *  @param {ISMCBundle} bdl - the bundle to manipulate
 *  @param {TSymbolData} symdata - an object to write into bundle.symbols
 *  @returns void
 *
 */
function AddSymbols(symdata: TSymbolData) {
  const fn = 'SetProgramOut:';
  const bdl = m_HasCurrentBundle(fn);
  if (bdl.symbols === undefined) bdl.symbols = {};
  const _bdlsym = bdl.symbols;

  if (symdata === undefined) console.error(`${fn} no symbol data provided`);

  if (symdata.features) {
    // featureName --> featureModule
    if (_bdlsym.features === undefined) _bdlsym.features = {};
    for (const [featName, featSymbols] of Object.entries(symdata.features)) {
      if (_bdlsym.features[featName])
        console.warn('overwriting feature', featName);
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
      if (_bdlsym.props[propName]) console.warn('overwriting prop', propName);
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
  HasBundleName
};
