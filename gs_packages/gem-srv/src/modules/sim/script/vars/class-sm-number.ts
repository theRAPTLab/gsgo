/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Number Prop Type can do simple arithmetic and logical comparisons
  with literal numbers.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import SM_Object from 'lib/class-sm-object';
// uses types defined in t-script.d
import { RegisterPropType } from 'modules/datacore';
import { SM_Boolean } from './class-sm-boolean';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_CheckMinMax(vobj) {
  // REVIEW: Algorithm is problematic
  // If min is 0, but max is not set,
  // then this will skip the min check
  // because max by default is 0.
  //
  // Default values should probably be `undefined`?
  // So first line would be:
  //   if (vobj.min === undefined || vobj.max === undefined) return;
  // And both min and max must always be defined for any checking to occur
  // otherwise, the nvalue calculation would err?
  //
  if (vobj.min === undefined || vobj.max === undefined) return;

  // Orig Code
  // if (vobj.min === vobj.max && vobj.min === 0) return;

  if (vobj.min > vobj.max) {
    if (DBG) console.log('swap min<-->max');
    const min = vobj.min;
    vobj.min = vobj.max;
    vobj.max = min;
  }
  if (vobj.value > vobj.max) {
    if (vobj.wrap) vobj.value = vobj.min;
    else vobj.value = vobj.max;
  }
  if (vobj.value < vobj.min) {
    if (vobj.wrap) vobj.value = vobj.max;
    else vobj.value = vobj.min;
  }
  vobj.nvalue = (vobj.value - vobj.min) / (vobj.max - vobj.min);
}

/// Supports 3 forms:
/// 1. `u_rnd()` returns random between 0 and 1
/// 2. `u_rnd(val)` returns random * val
/// 3. `u_rnd(min, max)' returns random between min and max
function u_rnd(min: number, max: number): number {
  if (min === undefined) return RNG();
  if (max === undefined) return RNG() * min;
  const minval = min > max ? max : min;
  const maxval = min > max ? min : max;
  return RNG() * (maxval - minval) + minval;
}
function u_RND(min: number, max: number, integer: boolean): number {
  const val = u_rnd(min, max);
  return integer ? Math.round(val) : val;
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class SM_Number extends SM_Object implements ISM_Object {
  nvalue: number;
  min: number;
  max: number;
  wrap: boolean;
  constructor(initial = undefined) {
    super(initial);
    this.meta.type = Symbol.for('SM_Number');
    this.value = initial;
    this.nvalue = undefined;
    // Orig Code
    // this.min = 0;
    // this.max = 0;
    this.min = undefined;
    this.max = undefined;
    this.wrap = false;
  }
  setWrap(flag: boolean = true) {
    this.wrap = flag;
  }
  // REVIEW
  // Always setMax BEFORE calling setMin
  // If max is not set (=0), and min is > 0
  // u_CheckMinMax will swap min and max.
  // Calling u_CheckMinMax will then change
  // the initial value if it is > min.
  setMin(num: number) {
    this.min = num;
    u_CheckMinMax(this);
    return this;
  }
  setMax(num: number) {
    this.max = num;
    u_CheckMinMax(this);
    return this;
  }
  setTo(num: number) {
    this.value = num;
    u_CheckMinMax(this);
    return this;
  }
  setToRnd(min: number, max: number, integer: boolean) {
    this.value = u_RND(min, max, integer);
    u_CheckMinMax(this);
    return this;
  }
  add(num: number) {
    this.value += num;
    u_CheckMinMax(this);
    return this;
  }
  addRnd(min: number, max: number) {
    this.value += u_RND(min, max, false);
    u_CheckMinMax(this);
    return this;
  }
  addRndInt(min: number, max: number) {
    this.value += u_RND(min, max, true);
    u_CheckMinMax(this);
    return this;
  }
  sub(num: number) {
    this.value -= num;
    u_CheckMinMax(this);
    return this;
  }
  // HACK to allow 2 decimal place math
  // To work around stupid IEEE 754 floating point numbers.
  // otherwise 0.6 - 0.05 = 0.59999999
  subFloat2(num: number) {
    this.value = Number((1000 * (this.value - num)) / 1000).toFixed(3);
    u_CheckMinMax(this);
    return this;
  }
  subRnd(min: number, max: number) {
    this.value -= u_RND(min, max, false);
    u_CheckMinMax(this);
    return this;
  }
  subRndInt(min: number, max: number) {
    this.value -= u_RND(min, max, true);
    u_CheckMinMax(this);
    return this;
  }
  div(num: number) {
    this.value /= num;
    u_CheckMinMax(this);
    return this;
  }
  mul(num: number) {
    this.value *= num;
    u_CheckMinMax(this);
    return this;
  }
  eq(num: number) {
    return new SM_Boolean(this.value === num);
  }
  notEq(num: number) {
    return new SM_Boolean(this.value !== num);
  }
  gt(num: number) {
    return new SM_Boolean(this.value > num);
  }
  lt(num: number) {
    return new SM_Boolean(this.value < num);
  }
  gte(num: number) {
    return new SM_Boolean(this.value >= num);
  }
  lte(num: number) {
    return new SM_Boolean(this.value <= num);
  }
  clear() {
    this.value = null;
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    if (!SM_Number._CachedSymbols)
      SM_Number._CachedSymbols = SM_Object._SymbolizeNames(SM_Number.Symbols);
    return SM_Number._CachedSymbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return SM_Number.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static Symbols: TSymbolData = {
    methods: {
      setMin: { args: ['min value:number'], info: 'minimum value' },
      setMax: { args: ['max value:number'], info: 'maximum value' },
      setTo: { args: ['numeric value:number'], info: 'assign value' },
      setToRnd: {
        args: ['min:number', 'max:number', 'asInteger:boolean'],
        info: 'randomize value'
      },
      add: { args: ['number:number'], info: 'add value to current' },
      sub: { args: ['number:number'], info: 'sub value to current' },
      div: { args: ['number:number'], info: 'divide current by value' },
      mul: { args: ['number:number'], info: 'multiple current by value' },
      eq: { args: ['number:number'], info: 'returns current equal to value' },
      notEq: {
        args: ['number:number'],
        info: 'returns current not equal to value'
      },
      gt: { args: ['number:number'], info: 'returns current greater than value' },
      lt: { args: ['number:number'], info: 'returns current less than value' },
      gte: {
        args: ['number:number'],
        info: 'returns current greater than or equal to value'
      },
      lte: {
        args: ['number:number'],
        info: 'returns current less than or equal to value'
      }
    }
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('number', SM_Number);
