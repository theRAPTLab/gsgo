/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DATACORE SIM BUNDLER

  This module keeps track of the current blueprint compiling operation as well
  as provide utility methods for manipulating Blueprint Bundle objects that
  are passed to its utility methods.

  The actual blueprint bundle is managed by DATACORE SIM RESOURCES, where it
  is saved in the BUNDLES dictionary.

  CONCEPTUAL DESIGN

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TCompiledStatement, ISMCBundle, TSymbolData } from 'lib/t-script.d';
import * as CHECK from './dc-type-check';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('SYMBOL', 'TagPurple');

/// GLOBAL DATACORE STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let BUNDLE_NAME = ''; // the current compiling bundle name (blueprint)
let BUNDLE_OUT = 'define'; // the current compiler output track

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the datacore global var BUNDLE_NAME to to bpName, which tells the
 *  BundleOut(bdl,prog) call where the program should be added
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
  BUNDLE_NAME = bpName;
  return true;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the datacore global var BUNDLE_OUT to bdlKey, which tells the
 *  BundleOut(bdl,prog) call where the program should be added
 */
function SetBundleOut(str: string): boolean {
  const bdlKey = str.toLowerCase();
  if (CHECK.IsValidBundleProgram(bdlKey)) {
    BUNDLE_OUT = bdlKey;
    return true;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the state of the bundler, which is valid while a blueprint script is
 *  being compiled (e.g. CompileBlueprint())
 */
function CompilerState() {
  return {
    bundleName: BUNDLE_NAME,
    bundleOut: BUNDLE_OUT
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** add properties to symbol table where TBundleSymbols contains
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function BundleTag(bdl: ISMCBundle, tagName: string, tagValue: any): boolean {
  if (typeof bdl !== 'object') {
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

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** main API for add a program to a bundle. It does not check the bundle
 *  type because it may not have been set yet.
 */
function BundleOut(bdl: ISMCBundle, prog: TCompiledStatement) {
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[BUNDLE_OUT]) bdl[BUNDLE_OUT] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${BUNDLE_OUT}]`);
  bdl[BUNDLE_OUT].push(...prog);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: returns bundle if it is a bundle, throw error otherwise */
function IsValidBundle(bundle: ISMCBundle) {
  const { symbols, name } = bundle;
  const { props, features } = symbols;
  const hasSymbols =
    typeof props !== 'undefined' || typeof features !== 'undefined';
  if (hasSymbols) return bundle;
  console.warn('IsValidBundle: not a bundle', bundle);
  throw Error('IsValidBundle: invalid parameter not bundle');
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SetBundleName,
  SetBundleOut,
  CompilerState,
  AddSymbol,
  BundleTag,
  BundleOut,
  IsValidBundle
};
