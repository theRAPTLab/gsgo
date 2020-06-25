import GSBoolean from './var-boolean';
import GSValue from './var';

class GSString extends GSValue {
  constructor(initial = '') {
    super();
    this.value = initial;
    this.type = 'str';
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
