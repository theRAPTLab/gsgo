/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROGRAM BUNDLER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TCompiledStatement,
  ISMCBundle,
  EBundleType,
  TSymbolData
} from 'lib/t-script.d';

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

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// const PR = UR.PrefixUtil('DCBDL');
const DBG = false;
const PR = UR.PrefixUtil('SYMBOL', 'TagPurple');

/// GLOBAL DATACORE STATE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let BUNDLE_NAME = ''; // the current compiling bundle name (blueprint)
let BUNDLE_OUT = 'define'; // the current compiler output track

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function IsValidBundleProgram(name: string): boolean {
  return BUNDLE_CONTEXTS.includes(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return true if the passed bundle string is valid */
export function IsValidBundleType(type: EBundleType) {
  return Object.values(EBundleType).includes(type as any);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** set the datacore global var BUNDLE_NAME to to bpName, which tells the
 *  BundleOut(bdl,prog) call where the program should be added
 */
export function SetBundleName(
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
export function SetBundleOut(str: string): boolean {
  const bdlKey = str.toLowerCase();
  if (IsValidBundleProgram(bdlKey)) {
    BUNDLE_OUT = bdlKey;
    return true;
  }
  return false;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the state of the bundler, which is valid while a blueprint script is
 *  being compiled (e.g. CompileBlueprint())
 */
export function CompilerState() {
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
export function AddSymbol(bdl: ISMCBundle, symdata: TSymbolData) {
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
export function BundleTag(
  bdl: ISMCBundle,
  tagName: string,
  tagValue: any
): boolean {
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
export function BundleOut(bdl: ISMCBundle, prog: TCompiledStatement) {
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[BUNDLE_OUT]) bdl[BUNDLE_OUT] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${BUNDLE_OUT}]`);
  bdl[BUNDLE_OUT].push(...prog);
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** HELPER: returns bundle if it is a bundle, throw error otherwise */
export function IsValidBundle(bundle: ISMCBundle) {
  const { symbols, name } = bundle;
  const { props, features } = symbols;
  const hasSymbols =
    typeof props !== 'undefined' || typeof features !== 'undefined';
  if (hasSymbols) return bundle;
  console.warn('IsValidBundle: not a bundle', bundle);
  throw Error('IsValidBundle: invalid parameter not bundle');
}
