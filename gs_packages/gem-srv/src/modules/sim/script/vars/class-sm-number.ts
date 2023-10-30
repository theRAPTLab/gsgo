/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Number Prop Type can do simple arithmetic and logical comparisons
  with literal numbers.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import merge from 'deepmerge';
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
    this.map = new Map();
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
  setToColor(num: number) {
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
  equal(num: number) {
    return new SM_Boolean(this.value === num);
  }
  notEqual(num: number) {
    return new SM_Boolean(this.value !== num);
  }
  greaterThan(num: number) {
    return new SM_Boolean(this.value > num);
  }
  lessThan(num: number) {
    return new SM_Boolean(this.value < num);
  }
  greaterThanOrEqual(num: number) {
    return new SM_Boolean(this.value >= num);
  }
  lessThanOrEqual(num: number) {
    return new SM_Boolean(this.value <= num);
  }
  clear() {
    this.value = null;
  }
  // OPTIONS
  addOption(optionLabel: string, optionValue: number) {
    const val = optionValue || 0; // if `optionValue` is not defined, use 0 so it's a valid number
    this.map.set(optionLabel, val);
  }
  setToOption(label: string) {
    // set this.value to the value associated with the option label
    this.value = this.map.get(label);
  }
  equalToOption(optionLabel: string) {
    return new SM_Boolean(this.value === this.map.get(optionLabel));
  }
  notEqualToOption(optionLabel: string) {
    return new SM_Boolean(this.value !== this.map.get(optionLabel));
  }
  greaterThanOption(optionLabel: string) {
    return new SM_Boolean(this.value > this.map.get(optionLabel));
  }
  lessThanOption(optionLabel: string) {
    return new SM_Boolean(this.value < this.map.get(optionLabel));
  }
  greaterThanOrEqualToOption(optionLabel: string) {
    return new SM_Boolean(this.value >= this.map.get(optionLabel));
  }
  lessThanOrEqualToOption(optionLabel: string) {
    return new SM_Boolean(this.value <= this.map.get(optionLabel));
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
  /**
   * Override generic 'SM_Number' method args with custom args
   * @param {object} methodsArgs { <method>: <argnumber> }
   *                    e.g. { setTo: ['degreesNumber:number']}
   */
  static SymbolizeCustom(methodsArgs): TSymbolData {
    const symbols: TSymbolData = merge.all([SM_Number.Symbolize()]);
    Object.entries(methodsArgs).forEach(([mKey, mVal]: [string, any]) => {
      symbols.methods[mKey].args = mVal;
    });
    return symbols;
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
      setMin: {
        args: ['min value:number'],
        info: 'Sets the minimum value allowed for this property.  If you try to set the property below this value, the property will be automatically changed to this value'
      },
      setMax: {
        args: ['max value:number'],
        info: 'Sets the maximum value allowed for this property.  If you try to set the property above this value, the property will be automatically changed to this value'
      },
      setTo: {
        args: ['number:number'],
        info: 'Sets the property to a value'
      },
      setToColor: {
        args: ['color:number'],
        info: 'Sets the property to a color value'
      },
      setToRnd: {
        args: ['min value:number', 'max value:number', 'asInteger:boolean'],
        info: 'Sets the property to a random value'
      },
      add: {
        args: ['number:number'],
        info: 'Changes the current value by adding the passed value'
      },
      addRnd: {
        args: ['min value:number', 'max value:number'],
        info: 'Changes the current value by adding a random number (could be float/decimal) between the min and max values passed'
      },
      addRndInt: {
        args: ['min value:number', 'max value:number'],
        info: 'Changes the current value by adding a random integer between the min and max values passed'
      },
      sub: {
        args: ['number:number'],
        info: 'Changes the current value by subtracting the passed value'
      },
      subRnd: {
        args: ['min value:number', 'max value:number'],
        info: 'Changes the current value by subtracting a random number (could be float/decimal) between the min and max values passed'
      },
      subRndInt: {
        args: ['min value:number', 'max value:number'],
        info: 'Changes the current value by subtracting a random integer between the min and max values passed'
      },
      div: { args: ['number:number'], info: 'divide current by value' },
      mul: { args: ['number:number'], info: 'multiple current by value' },
      equal: { args: ['number:number'], info: 'returns current equal to value' },
      notEqual: {
        args: ['number:number'],
        info: 'returns current not equal to value'
      },
      greaterThan: {
        args: ['number:number'],
        info: 'returns current greater than value'
      },
      lessThan: {
        args: ['number:number'],
        info: 'returns current less than value'
      },
      greaterThanOrEqual: {
        args: ['number:number'],
        info: 'returns current greater than or equal to value'
      },
      lessThanOrEqual: {
        args: ['number:number'],
        info: 'returns current less than or equal to value'
      },
      // OPTIONS
      addOption: {
        args: ['label:string', 'value:number'],
        info: 'Defines a new option "label"-"value" pair, e.g. label "healthy" can be set to the numeric value "100"'
      },
      setToOption: {
        args: ['option:string'],
        info: 'Sets the property to the value of the selected option'
      },
      equalToOption: {
        args: [`option:string`],
        info: 'Returns whether this property is equal to the referenced option value',
        returns: 'isEqual:boolean'
      },
      notEqualToOption: {
        args: [`option:string`],
        info: 'Returns whether this property is not equal to the referenced option value',
        returns: 'isNotEqual:boolean'
      },
      greaterThanOption: {
        args: [`option:string`],
        info: 'Returns whether this property is greater than the referenced option value',
        returns: 'isEqual:boolean'
      },
      lessThanOption: {
        args: [`option:string`],
        info: 'Returns whether this property is less than the referenced option value',
        returns: 'isNotEqual:boolean'
      },
      greaterThanOrEqualToOption: {
        args: [`option:string`],
        info: 'Returns whether this property is greater than or equal to the referenced option value',
        returns: 'isEqual:boolean'
      },
      lessThanOrEqualToOption: {
        args: [`option:string`],
        info: 'Returns whether this property is less than or equal to the referenced option value',
        returns: 'isNotEqual:boolean'
      }
    }
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('number', SM_Number);
