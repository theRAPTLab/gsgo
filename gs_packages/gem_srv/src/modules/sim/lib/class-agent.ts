/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Class!

  This class implements unique property storage for agents in the simulation.
  To preserve memory, user methods are implemented in an unusual way, stored as
  pointers in a methods map outside of the agent.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import SM_Object, { AddProp, AddMethod } from './class-sm-object';
import SM_State from './class-sm-state';
import { T_Agent, T_Scopeable, T_Stackable, T_Message } from '../types/t-smc';
import { FEATURES } from '../runtime-core';
import NumberVar from '../props/var-number';
import StringVar from '../props/var-string';

/// CONSTANTS & DECLARATIONS ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ERR_WHATMSG = 'unhandled message; got';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class Agent extends SM_Object implements T_Agent {
  features: Map<string, any>;
  updateQueue: T_Message[];
  thinkQueue: T_Message[];
  execQueue: T_Message[];
  _name: StringVar;
  _x: NumberVar;
  _y: NumberVar;
  _skin: StringVar;
  //
  constructor(agentName = '<anon>') {
    super(agentName); // sets _value to agentName, which is only for debugging
    // this.props map defined in SM_Object
    // this.methods map defined in SM_Object
    this.features = new Map();
    this.execQueue = [];

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
  addFeature(fName: string): any {
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

  /** Retrieve a prop object
   *  This overrides sm-object prop()
   */
  prop(name: string): T_Scopeable {
    const p = this.props.get(name);
    if (p === undefined) throw Error(`no prop named '${name}'`);
    return p;
  }

  /** Invoke method by name. functions return values, smc programs return stack
   *  This overrides sm-object method()
   */
  method(name: string, ...args: any): T_Stackable[] {
    const m = this.methods.get(name);
    if (m === undefined) throw Error(`no method named '${name}'`);
    if (typeof m === 'function') return m.apply(this, ...args);
    if (Array.isArray(m)) return this.exec_smc(m, [...args]);
    throw Error(`method ${name} object is neither function or ops array`);
  }

  /** retrieve the feature reference */
  feature(name: string): any {
    const f = this.features.get(name);
    if (f === undefined) throw Error(`no feature named '${name}'`);
    return f;
  }

  /** Execute agent stack machine program. Note that commander also
   *  implements ExecSMC to run arbitrary programs as well when
   *  processing AgentSets. Optionally pass a stack to reuse.
   */
  exec_smc(program, stack = []) {
    const state = new SM_State(stack);
    // console.log('exec got program', program.length);
    try {
      // run the program with the passed stack, if any
      program.forEach(op => op(this, state));
    } catch (e) {
      console.error(e);
      debugger;
    }
    // return the stack as a result, though
    return state.stack;
  }

  /** handle queue */
  queue(msg: T_Message) {
    switch (msg.message) {
      case 'update':
        this.updateQueue.push(msg);
        break;
      case 'think':
        this.thinkQueue.push(msg);
        break;
      case 'exec':
        this.execQueue.push(msg);
        break;
      default:
        throw Error(`${ERR_WHATMSG} ${msg.message}`);
    }
  }

  // serialization
  serialize() {
    // call serialize on all features
    // call serialize on all props
    return super
      .serialize()
      .concat([
        'name',
        this.name(),
        'x',
        this.x(),
        'y',
        this.y(),
        'skin',
        this.skin(),
        'features',
        [...this.features.keys()]
      ]);
  }
} // end of Agent class

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// export main Agent
export default Agent;
export { AddMethod, AddProp };
/*/ use as
    import Agent, {AddMethod, AddProp} from './class-agent'
/*/
