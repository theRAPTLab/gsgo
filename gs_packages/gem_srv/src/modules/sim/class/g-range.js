import GBoolean from './g-boolean';

class GRange {
  constructor(a = Number.MIN_SAFE_INTEGER, b = Number.MAX_SAFE_INTEGER) {
    this.value = a;
    this.min = a;
    this.max = b;
  }
  set(num) {
    this.value = num;
  }
  isBetween(num = this.value) {
    return new GBoolean(num > this.min && num < this.max);
  }
}

export default GRange;
