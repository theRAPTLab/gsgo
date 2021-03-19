/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROGRAM BUNDLER

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { TOpcode, ISMCBundle, EBundleType } from 'lib/t-script.d';

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
 *  AddToBundle(bdl,prog) call where the program should be added
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
 *  AddToBundle(bdl,prog) call where the program should be added
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
export function CompilerState() {
  return {
    bundleName: BUNDLE_NAME,
    bundleOut: BUNDLE_OUT
  };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** main API for add a program to a bundle. It does not check the bundle
 *  type because it may not have been set yet.
 */
export function AddToBundle(bdl: ISMCBundle, prog: TOpcode[]) {
  if (typeof bdl !== 'object') throw Error(`${bdl} is not an object`);
  if (!bdl[BUNDLE_OUT]) bdl[BUNDLE_OUT] = [];
  // console.log(`writing ${prog.length} opcode(s) to [${BUNDLE_OUT}]`);
  bdl[BUNDLE_OUT].push(...prog);
}
