/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PROGRAMS

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { TSMCProgram } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('DCPROGS');

/// REGISTER TEST PROGRAMS BY NAME ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const TEST_DICT = new Map<string, TSMCProgram>();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** returns true if test was saved for the first time, false otherwise */
export function RegisterTest(name: string, program: TSMCProgram): boolean {
  // if (TESTS.has(name)) throw Error(`RegisterTest: ${name} exists`);
  const newRegistration = !TEST_DICT.has(name);
  TEST_DICT.set(name, program);
  return newRegistration;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetTest(name: string): TSMCProgram {
  return TEST_DICT.get(name);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function DeleteAllTests() {
  TEST_DICT.clear();
}

/// FUNCTION UTILITIE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const FUNCTIONS: Map<string, Function> = new Map();
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
export const PROGRAMS: Map<string, TSMCProgram> = new Map();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RegisterProgram(name: string, program: TSMCProgram) {
  if (PROGRAMS.has(name)) throw Error(`RegisterProgram: ${name} exists`);
  PROGRAMS.set(name, program);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GetProgram(name: string): TSMCProgram {
  return PROGRAMS.get(name);
}
