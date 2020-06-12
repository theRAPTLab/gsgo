import GBoolean from './g-boolean';

class GValue {
  constructor(initial = 0) {
    this.value = initial;
  }
  add(num) {
    this.value += num;
    return this;
  }
  sub(num) {
    this.value -= num;
    return this;
  }
  div(num) {
    this.value /= num;
    return this;
  }
  mul(num) {
    this.value *= num;
    return this;
  }
  isEq(num) {
    return new GBoolean(this.value === num);
  }
  isGT(num) {
    return new GBoolean(this.value > num);
  }
  isLT(num) {
    return new GBoolean(this.value < num);
  }
  isGTE(num) {
    return new GBoolean(this.value >= num);
  }
  isLTE(num) {
    return new GBoolean(this.value <= num);
  }
}

export default GValue;
