/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine State Condition Flags

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const NOZ_ERR = 'zerocheck not called before flag read';
const NOC_ERR = 'compareNumbners not called before flag read';
const NOS_ERR = 'compareStrings not called before flag read';

/** A stack machine also maintains a flags "register" for containing the
 *  results of an operation. This storage class represents the register
 *  and provides utility functions for setting/interpeting the flags
 */
export default class T_Condition {
  VAZ: boolean; // true when zerocheck runs
  VAC: boolean; // true when condition runs
  VAS: boolean; // true for string comparisons
  Z: boolean; // zero flag
  LT: boolean; // less-than, same as !(GT&&EQ)
  EQ: boolean; // equal flag
  constructor() {
    this.reset();
  }
  reset() {
    this.VAZ = false;
    this.VAC = false;
    this.VAS = false;
    //
    this.Z = undefined;
    this.LT = undefined;
    this.EQ = undefined;
  }

  /// COMPARISON FLAGS : NUMBERS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack.
   */
  compareNumbers(a: number, b: number) {
    this.EQ = a === b;
    this.LT = a < b;
    this.VAC = true;
  }
  lt() {
    if (this.VAC) return this.LT;
    throw Error(NOC_ERR);
  }
  lte() {
    if (this.VAC) return this.LT || this.EQ;
    throw Error(NOC_ERR);
  }
  gte() {
    if (this.VAC) return !this.LT || this.EQ;
    throw Error(NOC_ERR);
  }
  gt() {
    if (this.VAC) return !(this.LT || this.EQ);
    throw Error(NOC_ERR);
  }
  eq() {
    if (this.VAC) return this.EQ;
    throw Error(NOC_ERR);
  }
  neq() {
    if (this.VAC) return !this.EQ;
    throw Error(NOC_ERR);
  }
  /// COMPARISON FLAGS : STRINGS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack.
   */
  compareStrings(s1: string, s2: string) {
    this.EQ = s1 === s2;
    this.VAS = true;
  }
  str_eq() {
    if (this.VAS) return this.EQ;
    throw Error(NOS_ERR);
  }
  str_neq() {
    if (this.VAS) return !this.EQ;
    throw Error(NOS_ERR);
  }

  /// ZERO FLAG CHECKS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack
   *  based on the passed numeric value
   */
  checkZero(value: number) {
    if (value === 0) {
      this.Z = true;
    } else {
      this.Z = false;
    }
    this.VAZ = true;
  }
  z() {
    if (this.VAZ) return this.Z;
    throw Error(NOZ_ERR);
  }
  nz() {
    if (this.VAZ) return !this.Z;
    throw Error(NOZ_ERR);
  }
}
