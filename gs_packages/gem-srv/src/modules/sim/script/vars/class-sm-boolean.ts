/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The SM_Boolean Prop Type can do common boolean operations and also
  support experimental "fuzzy" operators

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import merge from 'deepmerge';
import SM_Object from 'lib/class-sm-object';
import { RegisterPropType } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class SM_Boolean extends SM_Object {
  fuzzy: number;
  constructor(initial = true, fuzzy = 0) {
    super();
    this.meta.type = Symbol.for('SM_Boolean');
    this.value = initial;
    this.fuzzy = fuzzy;
  }
  setTo(value: boolean) {
    this.value = value;
    return this;
  }
  true(): boolean {
    return this.value;
  }
  false(): boolean {
    return !this.value;
  }
  invert(): boolean {
    this.value = !this.value;
    return this.value;
  }
  and(comparison: any): SM_Boolean {
    if (!this.fuzzy) throw Error("'and' incompatible with fuzzy logic");
    this.value &= comparison;
    return this;
  }
  or(comparison: any): SM_Boolean {
    if (!this.fuzzy) throw Error("'or' incompatible with fuzzy logic");
    this.value |= comparison;
    return this;
  }
  equal(comparison: any): SM_Boolean {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.value = this.value === comparison;
    return this;
  }
  notEqual(comparison: any): SM_Boolean {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.value = this.value !== comparison;
    return this;
  }
  slightlyTrue(): SM_Boolean {
    this.value = this.value && this.fuzzy > 0 && this.fuzzy < 0.25;
    return this;
  }
  mostlyTrue(): SM_Boolean {
    this.value = this.value && this.fuzzy > 0.75;
    return this;
  }
  slightlyFalse(): SM_Boolean {
    this.value = this.value && this.fuzzy < 0 && this.fuzzy > -0.25;
    return this;
  }
  mostlyFalse(): SM_Boolean {
    this.value = this.value && this.fuzzy < -0.75;
    return this;
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    if (!SM_Boolean._CachedSymbols)
      SM_Boolean._CachedSymbols = SM_Object._SymbolizeNames(SM_Boolean.Symbols);
    return SM_Boolean._CachedSymbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Override generic 'SM_Boolean' method args with custom args
   * @param {object} methodsArgs { <method>: <argstring> }
   *                    e.g. { setTo: ['movementTypeString:string']}
   */
  static SymbolizeCustom(methodsArgs): TSymbolData {
    const symbols: TSymbolData = merge.all([SM_Boolean.Symbolize()]);
    Object.entries(methodsArgs).forEach(([mKey, mVal]: [string, any]) => {
      symbols.methods[mKey].args = mVal;
    });
    return symbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return SM_Boolean.Symbols;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static Symbols: TSymbolData = {
    methods: {
      setTo: {
        args: ['true or false:boolean'],
        info: 'Sets the property to a value'
      },
      true: { returns: 'if true:boolean' },
      false: { returns: 'if false:boolean' },
      invert: { returns: 'inverted:boolean' },
      and: { args: ['boolean:boolean'] },
      or: { args: ['boolean:boolean'] },
      equal: {
        args: ['boolean:boolean'],
        info: 'Returns whether this property is equal to the passed value'
      },
      notEqual: { args: ['boolean:boolean'] },
      slightlyTrue: { returns: 'value:boolean' },
      mostlyTrue: { returns: 'value:boolean' },
      slightlyFalse: { returns: 'value:boolean' },
      mostlyFalse: { returns: 'value:boolean' }
    }
  };
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('boolean', SM_Boolean);
