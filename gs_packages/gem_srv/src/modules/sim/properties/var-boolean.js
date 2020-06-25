import GSValue from './var';

class GSBoolean extends GSValue {
  constructor(initial = true, fuzzy = 0) {
    super();
    this.value = initial;
    this.type = 'bool';
    this.fuzzy = fuzzy;
  }
  true() {
    return this.value;
  }
  false() {
    return !this.value;
  }
  and(comparison) {
    if (!this.fuzzy) throw Error("'and' incompatible with fuzzy logic");
    this.value &= comparison.state;
    return this;
  }
  or(comparison) {
    if (!this.fuzzy) throw Error("'or' incompatible with fuzzy logic");
    this.value |= comparison.state;
    return this;
  }
  equal(comparison) {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.value = this.value === comparison.state;
    return this;
  }
  slightlyTrue() {
    this.value = this.value && this.fuzzy > 0 && this.fuzzy < 0.25;
    return this;
  }
  mostlyTrue() {
    this.value = this.value && this.fuzzy > 0.75;
    return this;
  }
  slightlyFalse() {
    this.value = this.value && this.fuzzy < 0 && this.fuzzy > -0.25;
    return this;
  }
  mostlyFalse() {
    this.value = this.value && this.fuzzy < -0.75;
    return this;
  }
  serialize() {
    const values = super.serialize();
    values.push('fuzzy', this.fuzzy);
    return values;
  }
}

export default GSBoolean;
