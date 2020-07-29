/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The StringProp class does simple comparisons

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from '../lib/class-sm-object';
import BooleanProp from './var-boolean';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class StringProp extends SM_Object {
  constructor(initial = '') {
    super();
    this.meta.type = Symbol.for('StringProp');
    this.value = initial;
  }
  setTo(str) {
    this.value = str;
    return this;
  }
  isEq(str) {
    return new BooleanProp(this.value === str);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default StringProp;
