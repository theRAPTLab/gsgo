/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIM BUNDLER


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Bundle from 'lib/class-sm-bundle';
import * as CHECK from './dc-sim-data-utils';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMBOL', 'TagPurple');

/// GLOBAL DATACORE STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let CUR_NAME = ''; // the current compiling bundle name (blueprint)
let CUR_PROGRAM = 'define'; // the current compiler output track
let CUR_BUNDLE: SM_Bundle;

/// COMPILER BUNDLE GATEKEEPING ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Tranpiler uses these to set an implicit bundle that's used for operations
/// to maintain compatibility
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: before starting TRANSPILER bundle-dependent ops, set the bundle */
function OpenBundle(bdl: SM_Bundle) {
  const fn = 'BeginBundle:';
  if (CUR_BUNDLE !== undefined)
    throw Error(`${fn} bundle already set ${CUR_BUNDLE.name}`);
  CUR_BUNDLE = bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: close the bundle, which unsets the CUR_BUNDLE and disables
 *  the bundle state methods that rely on current bundle
 */
function CloseBundle() {
  const fn = 'EndBundle:';
  if (CUR_BUNDLE === undefined) throw Error(`${fn} no bundle set, can't end`);
  CUR_BUNDLE = undefined;
}

/// BUNDLE OPERATIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set the datacore global var CUR_PROGRAM to bdlKey, which tells the
 *  AddProgram(bdl,prog) call where the program should be added
 */
function SetProgramOut(str: string): boolean {
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
function SetBundleName(
  bdl: ISMCBundle,
  bpName: string,
  bpParent?: string
): boolean {
  if (typeof bdl !== 'object') {
    console.warn('arg1 is not a bundle, got:', bdl);
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
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: set one of several tags */
function SetBundleTag(
  bdl: ISMCBundle,
  tagName: TBundleTagTypes,
  tagValue: any
): boolean {
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
  return true;
}

/// BUNDLE INCREMENTALLY ADDED DATA ///////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// methods that add data
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: add a compiled program to a bundle, based on the current programOut
 *  setting.
 *  note: bundle type because it may not have been set yet.
 */
function AddProgram(bdl: ISMCBundle, prog: TCompiledStatement) {
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
function AddSymbol(bdl: ISMCBundle, symdata: TSymbolData) {
  if (bdl.symbols === undefined) bdl.symbols = {};
  const _bdlsym = bdl.symbols;

  if (symdata.features) {
    // featureName --> featureModule
    if (_bdlsym.features === undefined) _bdlsym.features = {};
    for (const [featName, featSymbols] of Object.entries(symdata.features)) {
      if (_bdlsym.features[featName]) console.warn('feature', featName, 'exists');
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
      if (_bdlsym.props[propName]) console.warn('prop', propName, 'exists');
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

/// BUNDLE INSPECTOR FOR CURRENT BUNDLE ///////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the state of the bundler, which is valid while a blueprint
 *  script is being compiled (e.g. CompileBlueprint())
 */
function CompilerState() {
  return {
    bpName: CUR_NAME,
    programOut: CUR_PROGRAM,
    bundle: CUR_BUNDLE
  };
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  OpenBundle,
  CloseBundle,
  //
  SetBundleName,
  SetProgramOut,
  SetBundleTag,
  AddProgram,
  AddSymbol,
  //
  CompilerState
};
