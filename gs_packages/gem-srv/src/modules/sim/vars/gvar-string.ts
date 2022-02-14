/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The GVarString class does simple comparisons

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
import { IScopeable, TSymbolData } from 'lib/t-script';
import { RegisterVarCTor } from 'modules/datacore';
import { GVarBoolean } from './gvar-boolean';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class GVarString extends SM_Object implements IScopeable {
  constructor(initial?: string) {
    super();
    this.meta.type = Symbol.for('GVarString');
    this.value = initial;
  }
  setTo(str: string): GVarString {
    this.value = str;
    return this;
  }
  eq(str: string) {
    return new GVarBoolean(this.value === str);
  }
  clear() {
    this.value = '';
  }
  symbolize(): TSymbolData {
    return GVarString.Symbols;
  }
}

/// SYMBOLS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GVarString.Symbols = {
  ctors: { String: GVarString.Symbols },
  methods: {
    setTo: { args: ['value:string'] },
    eq: { args: ['str:string'], returns: 'isEqual:boolean' },
    clear: {}
  }
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterVarCTor('String', GVarString);
