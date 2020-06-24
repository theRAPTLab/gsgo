import GSBoolean from './var-boolean';
import GSValue from './var';

const DBG = false;

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

class GSNumber extends GSValue {
  constructor(initial = 0) {
    super();
    this.value = initial;
    this.nvalue = undefined;
    this.min = 0;
    this.max = 0;
  }
  setMin(num) {
    this.min = num;
    u_CheckMinMax(this);
    return this;
  }
  setMax(num) {
    this.max = num;
    u_CheckMinMax(this);
    return this;
  }
  setTo(num) {
    this.value = num;
    u_CheckMinMax(this);
    return this;
  }
  add(num) {
    this.value += num;
    u_CheckMinMax(this);
    return this;
  }
  sub(num) {
    this.value -= num;
    u_CheckMinMax(this);
    return this;
  }
  div(num) {
    this.value /= num;
    u_CheckMinMax(this);
    return this;
  }
  mul(num) {
    this.value *= num;
    u_CheckMinMax(this);
    return this;
  }
  eq(num) {
    return new GSBoolean(this.value === num);
  }
  gt(num) {
    return new GSBoolean(this.value > num);
  }
  lt(num) {
    return new GSBoolean(this.value < num);
  }
  gte(num) {
    return new GSBoolean(this.value >= num);
  }
  lte(num) {
    return new GSBoolean(this.value <= num);
  }
}

export default GSNumber;
