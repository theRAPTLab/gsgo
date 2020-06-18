import GSBoolean from './gsBoolean';
import GSBaseType from './gsBasetype';

class GSRange extends GSBaseType {
  constructor(a = Number.MIN_SAFE_INTEGER, b = Number.MAX_SAFE_INTEGER) {
    super();
    this.value = a;
    this.min = a;
    this.max = b;
  }
  set(num) {
    this.value = num;
  }
  isBetween(num = this.value) {
    return new GSBoolean(num > this.min && num < this.max);
  }
}

export default GSRange;
