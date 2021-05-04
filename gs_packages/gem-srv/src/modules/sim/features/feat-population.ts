/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Population Class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/ required libraries /*/
import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
import { IAgent } from 'lib/t-script';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import { GetAgentsByType, GetAllAgents } from 'modules/datacore/dc-agents';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are debug utilities
const PR = UR.PrefixUtil('PopulationPack');
const DBG = false;

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PopulationPack extends GFeature {
  constructor(name) {
    super(name);
    this.featAddMethod('countAgents', this.countAgents);
    this.featAddMethod('countAgentProp', this.countAgentProp);
    this.featAddMethod('minAgentProp', this.minAgentProp);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  initialize(simloop) {
    super.initialize(simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add population-specific properties to the agent. The feature methods
   *  are defined inside the featurepack instance, not the agent instance
   *  as props are.
   */
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'count', new GVarString());
    this.featAddProp(agent, 'sum', new GVarString());
    this.featAddProp(agent, 'avg', new GVarString());
    this.featAddProp(agent, 'min', new GVarString());
    this.featAddProp(agent, 'max', new GVarString());
  }

  /// POPULATION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Population setRadius value
   */
  countAgents(agent: IAgent, blueprintName: string) {
    const agents = GetAgentsByType(blueprintName);
    agent.getFeatProp(this.name, 'count').setTo(agents.length);
  }
  /**
   *
   * @param agent
   * @param blueprintName
   * @param prop
   * @returns Sets three feature propertie: count, sum, avg
   */
  countAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    const agents = GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    const sum = agents
      .map(a => a.getProp(prop).value)
      .reduce((acc, cur) => acc + cur);
    agent.getFeatProp(this.name, 'count').setTo(agents.length);
    agent.getFeatProp(this.name, 'sum').setTo(sum);
    agent
      .getFeatProp(this.name, 'avg')
      .setTo(Number(sum / agents.length).toFixed(2));
  }
  minAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    const agents = GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    const minimizer = (min, cur) => Math.min(min, cur);
    const min = agents
      .map(a => a.getProp(prop).value)
      .reduce(minimizer, Infinity);
    agent.getFeatProp(this.name, 'min').setTo(min);
  }
  maxAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    const agents = GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    const maximizer = (max, cur) => Math.max(max, cur);
    const max = agents
      .map(a => a.getProp(prop).value)
      .reduce(maximizer, -Infinity);
    agent.getFeatProp(this.name, 'max').setTo(max);
  }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PopulationPack('Population');
Register(INSTANCE);
