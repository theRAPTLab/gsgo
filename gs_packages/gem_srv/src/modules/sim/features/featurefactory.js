/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Features can (1) modify the agent (2) use agent properties to update
  its own properties stored in the agent (3) queue an event for a later
  stage in the agent's event queue.

  Features are instantiated once.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATURES = new Map(); // track all features
/* temp */
const MovementPack = {
  name: 'Movement',
  initialize: pm => {
    pm.Hook('INPUT', this.HandleInput);
  },
  decorate: agent => {
    return MovementPack;
  },
  setController: (agent, x) => {
    return MovementPack;
  }
};

const TimerPack = {
  name: 'Timer',
  subscribers: new Map(),
  initialize: pm => {
    pm.Hook('INPUT', this.HandleInput);
  },
  onTick: func => console.log('subscribe onTick'),
  decorate: agent => {
    return TimerPack;
  },
  defineTimer: (agent, timerName, timerOptions) => {
    return TimerPack;
  },
  on: (agent, eventName, subscriberFunc) => {
    return TimerPack;
  }
};
FEATURES.set(MovementPack.name, MovementPack);
FEATURES.set(TimerPack.name, TimerPack);

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Feature code uses agent objects for state and variable storage. When a
 *  feature is invoked by an agent, it passes itself in the invocation.
 */
class Feature {
  constructor(name) {
    if (FEATURES.has(name)) throw Error(`feature named ${name} already exists`);
    this.meta = {
      feature: name
    };
    FEATURES.set(name, this);
    // subclassers can add other properties
  }

  decorate(agent) {
    if (agent.features.has(this.name))
      throw Error(`agent already bound to feature ${this.name}`);
    // subclassers
  }

  /** get feature prop value */
  prop(agent, propName) {
    // get the feature storage object
    const fpobj = agent.prop.get(this.name);
    // return the propName for chaining
    return fpobj[propName];
  }

  /** set feature prop value */
  setProp(agent, propName, gVar) {
    // get the feature storage object, which is in its own object
    const fpobj = agent.prop.get(this.name);
    // store the variable and return gVar for chaining
    fpobj[propName] = gVar;
    return gVar;
  }
} // end of class

/// LIBRARY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetByName(name) {
  return FEATURES.get(name);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Feature,
  GetByName
};
