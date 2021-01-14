/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GVarString class does simple comparisons

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
import { IScopeable } from 'lib/t-script';
import { RegisterVarCTor } from 'modules/datacore';
import { GVarBoolean } from './gvar-boolean';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class GVarString extends SM_Object implements IScopeable {
  constructor(initial?: string) {
    super();
    this.meta.type = Symbol.for('GVarString');
    this.value = initial || '';
  }
  setTo(str: string): GVarString {
    this.value = str;
    return this;
  }
  isEq(str: string) {
    return new GVarBoolean(this.value === str);
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterVarCTor('String', GVarString);
