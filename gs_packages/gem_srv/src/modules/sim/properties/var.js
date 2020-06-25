let m_counter = 100;
function m_VarCount() {
  return m_counter++;
}

class GSVariable {
  constructor() {
    this.meta = {
      id: m_VarCount(),
      type: 'var'
    };
    this.var = undefined;
  }
  get value() {
    return this.var;
  }
  set value(value) {
    this.var = value;
  }
  get() {
    return this.var;
  }
  serialize() {
    return ['value', this.var];
  }
}

export default GSVariable;
