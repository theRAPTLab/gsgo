import GBoolean from './g-boolean';
import GBaseType from './g-basetype';

class GString extends GBaseType {
  constructor(initial = '') {
    super();
    this.value = initial;
  }
  setTo(str) {
    this.value = str;
    return this;
  }
  isEq(str) {
    return new GBoolean(this.value === str);
  }
}

export default GString;
