/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_String class does simple comparisons

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object from 'lib/class-sm-object';
// uses types defined in t-script.d
import { RegisterPropType } from 'modules/datacore';
import { SM_Boolean } from './class-sm-boolean';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class SM_String extends SM_Object {
  constructor(initial?: string) {
    super();
    this.meta.type = Symbol.for('SM_String');
    this.value = initial;
  }
  setTo(str: string): SM_String {
    this.value = str;
    return this;
  }
  eq(str: string) {
    return new SM_Boolean(this.value === str);
  }
  clear() {
    this.value = '';
  }
  symbolize(): TSymbolData {
    return SM_String.Symbols;
  }
}

/// SYMBOLS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SM_String.Symbols = {
  ctors: { String: SM_String.Symbols },
  methods: {
    setTo: { args: ['value:string'] },
    eq: { args: ['str:string'], returns: 'isEqual:boolean' },
    clear: {}
  }
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('String', SM_String);
