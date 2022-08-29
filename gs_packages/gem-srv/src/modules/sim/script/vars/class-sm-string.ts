/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_String Prop Type contains a string and supports strict equality
  comparisons only

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
  noteq(str: string) {
    return new SM_Boolean(this.value !== str);
  }
  clear() {
    this.value = '';
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    if (!SM_String._CachedSymbols)
      SM_String._CachedSymbols = SM_Object._SymbolizeNames(SM_String.Symbols);
    return SM_String._CachedSymbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return SM_String.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static Symbols: TSymbolData = {
    methods: {
      setTo: { args: ['character string:string'] },
      eq: { args: ['comparison string:string'], returns: 'isEqual:boolean' },
      notEq: {
        args: ['comparison string:string'],
        returns: 'isNotEqual:boolean'
      },
      clear: {}
    }
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('string', SM_String);
