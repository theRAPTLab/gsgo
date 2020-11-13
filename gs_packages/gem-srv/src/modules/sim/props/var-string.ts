/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The StringProp class does simple comparisons

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
import { IScopeable } from 'lib/t-script';
import { RegisterVarCTor } from 'modules/runtime-datacore';
import { BooleanProp } from './var-boolean';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class StringProp extends SM_Object implements IScopeable {
  constructor(initial?: string) {
    super();
    this.meta.type = Symbol.for('StringProp');
    this.value = initial || '';
  }
  setTo(str: string): StringProp {
    this.value = str;
    return this;
  }
  isEq(str: string) {
    return new BooleanProp(this.value === str);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterVarCTor('String', StringProp);
