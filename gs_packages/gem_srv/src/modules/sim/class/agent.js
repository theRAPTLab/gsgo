import GSValue from './gsValue';
import GSString from './gsString';
import FEATURE from './util-feature';

class Agent {
  constructor() {
    this.props = new Map([
      ['name', new GSString()],
      ['x', new GSValue()],
      ['y', new GSValue()],
      ['skin', new GSString()]
    ]);
    this.features = new Map();
    this.eventQ = [];
  }

  /** Define a new built-in property in this.props
   */
  defineProp(name, gObj) {
    if (this.props.has(name)) throw Error(`prop ${name} already defined`);
    this.props.set(name, gObj);
    return gObj;
  }

  /** Retrieve a built-in property in this.props. The returned object
   *  is a ValueObject with chainable methods.
   */
  prop(name) {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no base prop named '${name}'`);
    return p;
  }

  /** Add a "feature pack" to this agent, which adds additional methods
   *  that can add methods and properties to this.features to enable
   *  new functionality.
   */
  addFeature(fPack) {
    if (this.features.has(fPack.name))
      throw Error(`feature ${fPack.name} already added`);
    this.features.set(fPack.name, fPack);
    fPack.bind(this);
    return fPack;
  }

  /**
   *  agent.feature('Timer').
   */
  feature(featureName) {
    const fPack = this.features.get(featureName);
    if (!fPack) throw Error(`feature ${featureName} is not part of this agent`);
    return fPack;
  }

  export() {
    const obj = {};
    this.props.forEach((value, key) => {
      obj[key] = value.value;
    });
    return obj;
  }

  queueEvent(eventName, eventData) {
    console.log(`agent ${this.name} received event ${eventName}`);
    this.eventQ.push({ eventName, data: { ...eventData } });
  }
}

export default Agent;
