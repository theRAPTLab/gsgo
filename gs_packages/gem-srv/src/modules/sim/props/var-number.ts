/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The NumberProp class can do simple arithmetic and logical comparisons
  with literal numbers.

  In our first prototype, we do not support arbitrary expressions.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
import { IScopeable } from 'lib/t-smc';
import { RegisterValueCTor } from 'modules/runtime-datacore';
import { BooleanProp } from './var-boolean';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function u_CheckMinMax(vobj) {
  if (vobj.min === vobj.max && vobj.min === 0) return;
  if (vobj.min > vobj.max) {
    if (DBG) console.log('swap min<-->max');
    const min = vobj.min;
    vobj.min = vobj.max;
    vobj.max = min;
  }
  if (vobj.value > vobj.max) {
    if (DBG) console.log('clamp max', vobj.max);
    vobj.value = vobj.max;
  }
  if (vobj.value < vobj.min) {
    if (DBG) console.log('clamp min', vobj.min);
    vobj.value = vobj.min;
  }
  vobj.nvalue = (vobj.value - vobj.min) / (vobj.max - vobj.min);
}

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class NumberProp extends SM_Object implements IScopeable {
  nvalue: number;
  min: number;
  max: number;
  constructor(initial = 0) {
    super(initial);
    this.meta.type = Symbol.for('NumberProp');
    this.value = initial;
    this.nvalue = undefined;
    this.min = 0;
    this.max = 0;
  }
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
  add(num: number) {
    this.value += num;
    u_CheckMinMax(this);
    return this;
  }
  sub(num: number) {
    this.value -= num;
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
    return new BooleanProp(this.value === num);
  }
  gt(num: number) {
    return new BooleanProp(this.value > num);
  }
  lt(num: number) {
    return new BooleanProp(this.value < num);
  }
  gte(num: number) {
    return new BooleanProp(this.value >= num);
  }
  lte(num: number) {
    return new BooleanProp(this.value <= num);
  }
  serialize() {
    const values = super.serialize();
    values.push('nvalue', this.nvalue);
    values.push('min', this.min);
    values.push('max', this.max);
    return values;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterValueCTor('Number', NumberProp);
