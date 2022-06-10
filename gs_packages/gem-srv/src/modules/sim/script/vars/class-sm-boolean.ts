import SM_Object from 'lib/class-sm-object';
// uses types defined in t-script.d
import { RegisterPropType } from 'modules/datacore';

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
  eq(comparison: any): SM_Boolean {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.value = this.value === comparison;
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

  symbolize(): TSymbolData {
    return SM_Boolean.Symbols;
  }
}

/// SYMBOLS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SM_Boolean.Symbols = {
  ctors: { Boolean: SM_Boolean.Symbols },
  methods: {
    setTo: { args: ['value:boolean'] },
    true: { returns: 'value:boolean' },
    false: { returns: 'value:boolean' },
    invert: { returns: 'value:boolean' },
    and: { args: ['comparison:{value}'] },
    or: { args: ['comparison:{value}'] },
    eq: { args: ['comparison:{value}'] },
    slightlyTrue: { returns: 'value:boolean' },
    mostlyTrue: { returns: 'value:boolean' },
    slightlyFalse: { returns: 'value:boolean' },
    mostlyFalse: { returns: 'value:boolean' }
  }
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterPropType('Boolean', SM_Boolean);
