import GValue from './g-value';
import GString from './g-string';

class Agent {
  constructor() {
    this.props = new Map([
      ['name', new GString()],
      ['x', new GValue()],
      ['y', new GValue()],
      ['skin', new GString()]
    ]);
    this.features = new Map();
  }
  prop(name) {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no base prop named '${name}'`);
    return p;
  }
  defineProp(name, gObj) {
    if (this.props.has(name)) throw Error(`prop ${name} already defined`);
    this.props.set(name, gObj);
    return gObj;
  }
  addFeature(fPack) {
    if (this.features.has(fPack.name))
      throw Error(`feature ${fPack.name} already added`);
    this.features.set(fPack.name, fPack);
    fPack.reset();
    return fPack;
  }
  export() {
    const obj = {};
    this.props.forEach((value, key) => {
      obj[key] = value.value;
    });
    return obj;
  }
}

export default Agent;
