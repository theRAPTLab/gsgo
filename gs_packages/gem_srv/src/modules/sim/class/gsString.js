import GSBoolean from './gsBoolean';
import GSBaseType from './gsBasetype';

class GSString extends GSBaseType {
  constructor(initial = '') {
    super();
    this.value = initial;
  }
  setTo(str) {
    this.value = str;
    return this;
  }
  isEq(str) {
    return new GSBoolean(this.value === str);
  }
}

export default GSString;
