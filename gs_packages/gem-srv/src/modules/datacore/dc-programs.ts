/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROGRAMS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TSMCProgram } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCPROGS', 'TagRed');

export const CONDITIONS: Map<string, TSMCProgram> = new Map();
export const FUNCTIONS: Map<string, Function> = new Map();
export const PROGRAMS: Map<string, TSMCProgram> = new Map();

/// CONDITION UTILITIES ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function AddGlobalCondition(sig: string, condprog: TSMCProgram) {
  if (!Array.isArray(condprog)) {
    console.warn(...PR(condprog, 'is not a program...skipping'));
    return;
  }
  if (!CONDITIONS.has(sig)) CONDITIONS.set(sig, []);
  const master = CONDITIONS.get(sig);
  // add all the instructions from conditional program to the master
  master.push(...condprog);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RemoveGlobalCondition(sig: string) {
  CONDITIONS.set(sig, []);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetGlobalCondition(sig: string) {
  const master = CONDITIONS.get(sig);
  console.log(...PR(`getting condition '${sig}' (has ${master.length} opcodes)`));
  return master;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetAllGlobalConditions() {
  const conditions = CONDITIONS.entries();
  return conditions;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllGlobalConditions() {
  CONDITIONS.clear();
}

/// TEST UTILITIES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterFunction(name: string, func: Function): boolean {
  const newRegistration = !FUNCTIONS.has(name);
  FUNCTIONS.set(name, func);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetFunction(name: string): Function {
  let f = FUNCTIONS.get(name);
  // return always random results if the test doesn't exist
  if (!f) f = () => Math.random() > 0.5;
  return f;
}

/// PROGRAM UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterProgram(name: string, program: TSMCProgram) {
  if (PROGRAMS.has(name)) throw Error(`RegisterProgram: ${name} exists`);
  PROGRAMS.set(name, program);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetProgram(name: string): TSMCProgram {
  return PROGRAMS.get(name);
}
