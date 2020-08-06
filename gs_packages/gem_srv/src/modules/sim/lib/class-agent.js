/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object, { AddProp, AddMethod } from './class-sm-object';
import { T_State } from '../types/t-smc';
import { FEATURES } from '../runtime-core';
import NumberVar from '../props/var-number';
import StringVar from '../props/var-string';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Agent extends SM_Object {
  constructor(agentName = '<anon>') {
    super(agentName); // sets _value to agentName, which is only for debugging
    // this.props map defined in SM_Object
    // this.methods map defined in SM_Object
    this.features = new Map();
    this.events = [];

    // declare agent basic properties
    this._name = new StringVar(agentName);
    this._x = new NumberVar();
    this._y = new NumberVar();
    this._skin = new StringVar();
    // mirror basic props in props for conceptual symmetry
    this.props.set('name', this._name);
    this.props.set('x', this._x);
    this.props.set('y', this._y);
    this.props.set('skin', this._skin);
  }

  // accessor methods for built-in props
  name = () => this._name.value;
  x = () => this._x.value;
  y = () => this._y.value;
  skin = () => this._skin.value;

  // definition methods
  // addProp defined in SM_Object
  // addMethod defined in SM_Object

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** API: add a featurepack to an agent's feature map by feature name
   *  featurepacks store its own properties directly in agent.props
   *  featurepacks store method pointers in agent.methods, and all methods
   *  have the signature method(agentInstance, ...args)
   *  @param {string} featureName - name of FeatureLib to look up and add
   *  @returns {FeatureLib} - for chaining agent calls
   */
  addFeature(fName) {
    const { features } = this;
    // does key already exist in this agent? double define in template!
    if (features.has(fName))
      throw Error(`feature '${fName}' already in template`);
    // save the FeaturePack object reference in agent.feature map
    const fpack = FEATURES.get(fName);
    if (!fpack) throw Error(`'${fName}' is not an available feature`);
    // this should return agent
    this.features.set(fName, fpack);
    return fpack.decorate(this);
  }

  /** retrieve a prop object */
  prop(name) {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no prop named '${name}'`);
    return p;
  }

  /** invoke method by name. functions return values, smc programs return stack */
  method(name, ...args) {
    const m = this.methods.get(name);
    if (m === undefined) throw Error(`no method named '${name}'`);
    if (typeof m === 'function') return m.apply(this, ...args);
    if (Array.isArray(m)) return this.exec_smc(m, [...args]);
    throw Error(`method ${name} object is neither function or ops array`);
  }

  /** retrieve the feature reference */
  feature(name) {
    const f = this.features.get(name);
    if (f === undefined) throw Error(`no feature named '${name}'`);
    return f;
  }

  /** Execute agent stack machine program. Note that commander also
   *  implements ExecSMC to run arbitrary programs as well when
   *  processing AgentSets
   */
  exec_smc(program, stack = []) {
    const state = new T_State(stack);
    try {
      // run the program with the passed stack, if any
      program.forEach(op => op(this, state));
    } catch (e) {
      console.error(e);
      debugger;
    }
    return state.stack;
  }

  // serialization
  serialize() {
    const obj = {
      name: this.name(),
      x: this.x(),
      y: this.y(),
      skin: this.skin()
    };
    // call serialize on all features
    // call serialize on all props
    return JSON.stringify(obj);
  }
} // end of Agent class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// attach as static methods
Agent.AddMethod = AddMethod; // forward from SM_Object
Agent.AddProp = AddProp; // forward from SM_Object
/// export main Agent
export default Agent;
/*/ use as
    import Agent from './class-agent'
    const { AddMethods, AddProp } = Agent
/*/
