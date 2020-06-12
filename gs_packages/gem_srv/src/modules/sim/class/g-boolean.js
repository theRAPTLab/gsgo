class GBoolean {
  constructor(initial = true, fuzzy = 0) {
    this.state = initial;
    this.fuzzy = fuzzy;
  }
  and(comparison) {
    if (!this.fuzzy) throw Error("'and' incompatible with fuzzy logic");
    this.state &= comparison.state;
    return this;
  }
  or(comparison) {
    if (!this.fuzzy) throw Error("'or' incompatible with fuzzy logic");
    this.state |= comparison.state;
    return this;
  }
  equal(comparison) {
    if (!this.fuzzy) throw Error("'equal' incompatible with fuzzy logic");
    this.state = this.state === comparison.state;
    return this;
  }
  slightlyTrue() {
    this.state = this.state && this.fuzzy > 0 && this.fuzzy < 0.25;
    return this;
  }
  mostlyTrue() {
    this.state = this.state && this.fuzzy > 0.75;
    return this;
  }
  slightlyFalse() {
    this.state = this.state && this.fuzzy < 0 && this.fuzzy > -0.25;
    return this;
  }
  mostlyFalse() {
    this.state = this.state && this.fuzzy < -0.75;
    return this;
  }
}

export default GBoolean;
