/* eslint-disable no-unneeded-ternary */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  StackMachine State Condition Flags

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

// uses types from t-script.d

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOZ_ERR = 'zerocheck not called before flag read';
const NOC_ERR = 'compareNumbers not called before flag read';
const NOS_ERR = 'compareStrings not called before flag read';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A stack machine maintains a flags "register" for containing the
 *  results of a comparison operation. This storage class represents
 *  the register and provides utility functions for setting/interpeting
 *  the flags. In this version of the stack machine, these flags are
 *  only set by comparison opcodes
 */
export default class SM_Comparator implements IComparator {
  VAZ: boolean; // true when zerocheck runs
  VAC: boolean; // true when condition runs
  VAS: boolean; // true for string comparisons
  _Z: boolean; // zero flag
  _LT: boolean; // less-than, same as !(GT&&EQ)
  _EQ: boolean; // equal flag
  //
  constructor() {
    this.reset();
  }
  /// DIRECT FLAG MANIPULATION ////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset(): void {
    this.VAZ = false;
    this.VAC = false;
    this.VAS = false;
    //
    this._Z = undefined;
    this._LT = undefined;
    this._EQ = undefined;
  }
  setZ(setting?: boolean): void {
    setting = setting && setting; // force undefined to false
    this._Z = setting;
  }
  setLT(setting?: boolean): void {
    setting = setting && setting;
    this._LT = setting;
    this._EQ = false;
  }
  setGT(setting?: boolean): void {
    setting = setting && setting;
    this._LT = !setting;
    this._EQ = false;
  }
  setEQ(setting?: boolean): void {
    setting = setting && setting;
    this._EQ = setting;
  }

  /// DIRECT FLAG READ ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  status(): object {
    let z = this._Z ? '1' : '0';
    let lt = this._LT ? '1' : '0';
    let eq = this._EQ ? '1' : '0';
    z = this.VAZ ? z : '#';
    lt = this.VAC ? lt : '#';
    eq = this.VAC ? eq : '#';
    return {
      info: `Z:${z} LT:${lt} EQ:${eq}`,
      Z: this._Z,
      LT: this._LT,
      EQ: this._EQ
    };
  }

  /// COMPARISON FLAGS : NUMBERS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack.
   */
  compareNumbers(a: number, b: number): void {
    this._EQ = a === b;
    this._LT = a < b;
    this.VAC = true;
  }
  LT(): boolean {
    if (this.VAC) return this._LT;
    throw Error(NOC_ERR);
  }
  LTE(): boolean {
    if (this.VAC) return this._LT || this._EQ;
    throw Error(NOC_ERR);
  }
  GTE(): boolean {
    if (this.VAC) return !this._LT || this._EQ;
    throw Error(NOC_ERR);
  }
  GT(): boolean {
    if (this.VAC) return !(this._LT || this._EQ);
    throw Error(NOC_ERR);
  }
  EQ(): boolean {
    if (this.VAC) return this._EQ;
    throw Error(NOC_ERR);
  }
  NEQ(): boolean {
    if (this.VAC) return !this._EQ;
    throw Error(NOC_ERR);
  }

  /// COMPARISON FLAGS : STRINGS //////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack.
   */
  compareStrings(s1: string, s2: string): void {
    this._EQ = s1 === s2;
    this.VAS = true;
  }
  STR_EQ(): boolean {
    if (this.VAS) return this._EQ;
    throw Error(NOS_ERR);
  }
  STR_NEQ(): boolean {
    if (this.VAS) return !this._EQ;
    throw Error(NOS_ERR);
  }

  /// ZERO FLAG CHECKS ////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Call this to set zero and true/false flags and validate condition stack
   *  based on the passed numeric value
   */
  checkZero(value: number): void {
    if (value === 0) {
      this._Z = true;
    } else {
      this._Z = false;
    }
    this.VAZ = true;
  }
  Z(): boolean {
    if (this.VAZ) return this._Z;
    throw Error(NOZ_ERR);
  }
  NZ(): boolean {
    if (this.VAZ) return !this._Z;
    throw Error(NOZ_ERR);
  }
}
