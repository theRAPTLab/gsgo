import SM_Object from 'lib/class-sm-object';
import { IScopeable } from 'lib/t-script';
import { RegisterVarCTor } from 'modules/datacore';

export class GVarBoolean extends SM_Object implements IScopeable {
  fuzzy: number;
  constructor(initial = true, fuzzy = 0) {
    super();
    this.meta.type = Symbol.for('GVarBoolean');
    this.value = initial;
    this.fuzzy = fuzzy;
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
  equal(comparison: any): GVarBoolean {
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
  serialize() {
    const values = super.serialize();
    values.push('fuzzy', this.fuzzy);
    return values;
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see class export above
RegisterVarCTor('Boolean', GVarBoolean);
