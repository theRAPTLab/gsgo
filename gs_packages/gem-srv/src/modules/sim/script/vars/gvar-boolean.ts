import SM_Object from 'lib/class-sm-object';
// uses types defined in t-script.d
import { RegisterVarCTor } from 'modules/datacore';

export class GVarBoolean extends SM_Object implements IScopeable {
  fuzzy: number;
  constructor(initial = true, fuzzy = 0) {
    super();
    this.meta.type = Symbol.for('GVarBoolean');
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
  and(comparison: any): GVarBoolean {
    if (!this.fuzzy) throw Error("'and' incompatible with fuzzy logic");
    this.value &= comparison;
    return this;
  }
  or(comparison: any): GVarBoolean {
    if (!this.fuzzy) throw Error("'or' incompatible with fuzzy logic");
    this.value |= comparison;
    return this;
  }
  eq(comparison: any): GVarBoolean {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.value = this.value === comparison;
    return this;
  }
  slightlyTrue(): GVarBoolean {
    this.value = this.value && this.fuzzy > 0 && this.fuzzy < 0.25;
    return this;
  }
  mostlyTrue(): GVarBoolean {
    this.value = this.value && this.fuzzy > 0.75;
    return this;
  }
  slightlyFalse(): GVarBoolean {
    this.value = this.value && this.fuzzy < 0 && this.fuzzy > -0.25;
    return this;
  }
  mostlyFalse(): GVarBoolean {
    this.value = this.value && this.fuzzy < -0.75;
    return this;
  }

  symbolize(): TSymbolData {
    return GVarBoolean.Symbols;
  }
}

/// SYMBOLS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
GVarBoolean.Symbols = {
  ctors: { Boolean: GVarBoolean.Symbols },
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
RegisterVarCTor('Boolean', GVarBoolean);
