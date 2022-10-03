/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_String Prop Type contains a string and supports strict equality
  comparisons only

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import merge from 'deepmerge';
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
  equal(str: string) {
    return new SM_Boolean(this.value === str);
  }
  notEqual(str: string) {
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
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Override generic 'SM_String' method args with custom args
   * @param {object} methodsArgs { <method>: <argstring> }
   *                    e.g. { setTo: ['movementTypeString:string']}
   */
  static SymbolizeCustom(methodsArgs): TSymbolData {
    const symbols: TSymbolData = merge.all([SM_String.Symbolize()]);
    Object.entries(methodsArgs).forEach(([mKey, mVal]: [string, any]) => {
      symbols.methods[mKey].args = mVal;
    });
    return symbols;
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
      setTo: { args: [`string:string`], info: 'Sets the property to a value' },
      equal: {
        args: ['comparison string:string'],
        info: 'Returns whether this property is equal to the passed value',
        returns: 'isEqual:boolean'
      },
      notEqual: {
        args: ['comparison string:string'],
        returns: 'isNotEqual:boolean'
      },
      clear: { info: 'Clears the current property value' }
    }
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('string', SM_String);
