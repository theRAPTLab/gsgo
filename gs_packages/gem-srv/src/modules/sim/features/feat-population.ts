/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Population Class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/ required libraries /*/
import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
import { IAgent, TSMCProgram } from 'lib/t-script';
import {
  GVarBoolean,
  GVarDictionary,
  GVarNumber,
  GVarString
} from 'modules/sim/vars/_all_vars';
import {
  CopyAgentProps,
  DeleteAgent,
  GetAgentsByType,
  GetAllAgents,
  DefineInstance,
  GetAgentById
} from 'modules/datacore/dc-agents';
import * as TRANSPILER from 'modules/sim/script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are debug utilities
const PR = UR.PrefixUtil('PopulationPack');
const DBG = false;

let COUNT = 0;

const AGENTS_TO_REMOVE = []; // string[]
const AGENTS_TO_CREATE = []; // InstanceDef[]

/// CREATE LOOP //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_Delete(frame) {
  while (AGENTS_TO_REMOVE.length > 0) {
    const id = AGENTS_TO_REMOVE.pop();
    const agent = GetAgentById(id);
    if (agent) {
      DeleteAgent({
        id: agent.id,
        blueprint: agent.blueprint.name
      });
    }
  }
}
function m_Create(frame) {
  while (AGENTS_TO_CREATE.length > 0) {
    const def = AGENTS_TO_CREATE.pop();

    DefineInstance(def);
    let agent = TRANSPILER.MakeAgent(def);
    const parent = GetAgentById(def.parentId);
    if (parent) CopyAgentProps(parent, agent);

    // but reset inert!
    agent.prop.isInert.setTo(false);

    const initScript = def.initScript; // spawnscript
    agent.exec(initScript, { agent }); // run spawnscript
  }
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PopulationPack extends GFeature {
  constructor(name) {
    super(name);
    // Population Management
    this.featAddMethod('createAgent', this.createAgent);
    this.featAddMethod('spawnChild', this.spawnChild);
    this.featAddMethod('removeAgent', this.removeAgent);
    // Global Population Management
    this.featAddMethod('releaseInertAgents', this.releaseInertAgents);
    this.featAddMethod('hideInertAgents', this.hideInertAgents);
    this.featAddMethod('removeInertAgents', this.removeInertAgents);
    this.featAddMethod('agentsReproduce', this.agentsReproduce);
    // Statistics
    this.featAddMethod('getActiveAgentsCount', this.getActiveAgentsCount);
    this.featAddMethod('countAgents', this.countAgents);
    this.featAddMethod('countAgentProp', this.countAgentProp);
    this.featAddMethod('minAgentProp', this.minAgentProp);
    // Histogram
    this.featAddMethod('countAgentsByPropType', this.countAgentsByPropType);

    UR.HookPhase('SIM/DELETE', m_Delete);
    UR.HookPhase('SIM/CREATE', m_Create);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // /** This runs once to initialize the feature for all agents */
  // initialize(simloop) {
  //   super.initialize(simloop);
  //   simloop.hook('INPUT', frame => console.log(frame));
  // }
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

    // Used by populateBySpawning to set target population levels
    this.featAddProp(agent, 'targetPopulationSize', new GVarNumber(1));
    this.featAddProp(agent, 'deleteAfterSpawning', new GVarBoolean(true));

    agent.prop.Population._countsByProp = new Map();
  }

  /// POPULATION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Create agent of arbitrary blueprintName type via script
   * @param agent
   * @param blueprintName
   * @param initScript
   */
  createAgent(agent: IAgent, blueprintName: string, initScript: string) {
    const name = `${blueprintName}${COUNT++}`;
    // Queue Instance Defs
    const def = {
      name,
      blueprint: blueprintName,
      initScript,
      parentId: agent.id // save for positioning
    };
    AGENTS_TO_CREATE.push(def);
  }
  /**
   * Create child agent via script, duplicating properties of parent
   * and running special spawn script
   * @param agent
   * @param blueprintName
   * @param initScript
   */
  spawnChild(agent: IAgent, spawnScript: string) {
    const bpname = agent.blueprint.name;
    const name = `${bpname}${COUNT++}`;
    // Queue Instance Defs
    const def = {
      name,
      blueprint: bpname,
      initScript: spawnScript,
      parentId: agent.id // save for positioning
    };
    AGENTS_TO_CREATE.push(def);
  }
  /**
   * Removes self
   */
  removeAgent(agent: IAgent) {
    AGENTS_TO_REMOVE.push(agent.id);
  }

  /// GLOBAL METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Release cursors for ALL inert agents globally
   */
  releaseInertAgents(agent: IAgent) {
    const agents = GetAllAgents();
    agents.forEach(a => {
      if (a.isInert && a.hasFeature('Cursor'))
        a.callFeatMethod('Cursor', 'releaseCursor');
    });
  }
  /**
   * Turn off visible property for ALL inert agents globally
   */
  hideInertAgents(agent: IAgent) {
    const agents = GetAllAgents();
    agents.forEach(a => {
      if (a.isInert) {
        // console.error('hiding', a.id);
        a.visible = false;
      }
    });
  }
  /**
   * Remove ALL inert agents globally
   */
  removeInertAgents(agent: IAgent) {
    const agents = GetAllAgents();
    agents.forEach(a => {
      if (a.isInert) this.removeAgent(a);
    });
  }

  /**
   * For all agents of type bpname, call SpawnChild if not inert
   * @param agent
   * @param bpname
   * @param spawnScript
   */
  agentsReproduce(agent: IAgent, bpname: string, spawnScript: string) {
    const deleteAfterSpawning = agent.prop.Population.deleteAfterSpawning.value;
    const agents = GetAgentsByType(bpname);
    agents.forEach(a => {
      if (!a.isInert) {
        a.callFeatMethod('Population', 'spawnChild', spawnScript);
        if (deleteAfterSpawning) a.prop.isInert.setTo(true);
      }
    });
  }
  /**
   * For all agents of type bpname, call SpawnChild if not inert
   * @param agent
   * @param bpname
   * @param spawnScript
   */
  populateBySpawning(agent: IAgent, bpname: string, spawnScript: string) {
    const targetPopulationSize = agent.prop.Population.targetPopulationSize.value;
    const deleteAfterSpawning = agent.prop.Population.deleteAfterSpawning.value;
    let count = AGENTS_TO_CREATE.length;
    let agentIndex = 0;
    const agents = GetAgentsByType(bpname);

    while (count < targetPopulationSize) {
      const a = agents[agentIndex];
      if (!a.isInert) {
        this.spawnChild(a, spawnScript);
        count++;
        if (count >= targetPopulationSize) break;
      }
      agentIndex++;
      if (agentIndex >= agents.length) agentIndex = 0;
    }

    // force immediate creation so that population can be set
    // during PREP ROUND, otherwise population isn't created until
    // after START ROUND
    m_Create(0);

    if (deleteAfterSpawning) {
      agents.forEach(a => this.removeAgent(a));
      // force immediate delete otherwise deletion happens only after START ROUND
      m_Delete(0);
    }
  }

  /**
   * For all agents of type bpname, call program if not inert
   */
  agentsForEachActive(agent: IAgent, bpname: string, program: TSMCProgram) {
    const agents = GetAgentsByType(bpname);
    agents.forEach(a => {
      if (!a.isInert) a.exec(program, { agent: a });
    });
  }
  /**
   * For all agents of type bpname, call program regardless of inert state
   */
  agentsForEach(agent: IAgent, bpname: string, program: TSMCProgram) {
    const agents = GetAgentsByType(bpname);
    agents.forEach(a => a.exec(program, { agent: a }));
  }

  /// STATISTICS METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Population setRadius value
   */

  /**
   * Returns the number of active (non-inert) agents of a particular blueprint type
   */
  getActiveAgentsCount(agent: IAgent, blueprintName: string) {
    const agents = GetAgentsByType(blueprintName);
    let count = 0;
    agents.forEach(a => {
      if (!a.isInert) count++;
    });
    return count;
  }

  countAgents(agent: IAgent, blueprintName: string) {
    const agents = GetAgentsByType(blueprintName);
    agent.getFeatProp(this.name, 'count').setTo(agents.length);
  }
  /**
   * Updates three featProp statistics:
   *   count -- number of agents
   *   sum -- total of the agent's prop values (e.g. sum of algae energylevels)
   *   avg -- average of agent's prop values (e.g. avg of algae energylevel)
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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HISTOGRAM

  /**
   * Counts the number of agents that match a particular prop value
   * - This is generally used for a histogram with a prop that uses
   *   discrete categories or indices.
   * - It saves the count in the `countByProp` dictionary where the
   *   keys corresponnd to the prop's values.
   * - Use this for instance to count the number of agents using a
   *   particular colorscale color.
   * - Each call starts from a fresh count.
   *
   * e.g.:
   *    countByProp = [
   *      ['0', 11],
   *      ['1', 53],
   *      ['2', 22],
   *    ]
   * @param agent
   * @param blueprintName
   * @param prop
   */
  countAgentsByPropType(
    agent: IAgent,
    blueprintName: string,
    prop: string,
    clear: boolean
  ) {
    const agents = GetAgentsByType(blueprintName);
    const countsByProp = agent.prop.Population._countsByProp;

    // reset count first?
    if (clear) countsByProp.clear();

    agents.forEach(a => {
      // skip count if inert
      if (a.isInert) return;

      const key = a.getProp(prop).value;
      const count = countsByProp.get(key) + 1 || 1;
      countsByProp.set(key, count);
    });
    console.error('countByProp', countsByProp);
  }

  /// Prepopulate the countsByProp map with keys
  /// This is necessary so all bars in the histogram will have values
  /// otherwise, bars without values are not plotted.
  setAgentsByFeatPropTypeKeys(agent: IAgent, ...keys: string[]) {
    agent.prop.Population._countsByPropKeys = keys;
  }

  /// Clear counts for each key
  m_CountAgentsByFeatPropTypeReset(agent: IAgent) {
    agent.prop.Population._countsByPropKeys.forEach(k => {
      agent.prop.Population._countsByProp.set(k, 0);
    });
  }
  /**
   * Counts number of agents matching a featProp
   * e.g. Moth Costume colorScaleIndex, usually a dict?
   *
   * This assumes we only have a single countAgentsByFeatPropType
   * property.
   * @param agent
   * @param blueprintName
   * @param feature
   * @param featprop
   * @param clear reset counts to 0 with every invocation
   *              otherwise, the count is cumulative across invocations
   */
  m_CountAgentsByFeatPropType(
    agent: IAgent,
    agents: IAgent[],
    blueprintName: string,
    feature: string,
    featprop: string,
    clear: boolean
  ) {
    const countsByProp = agent.prop.Population._countsByProp;

    // reset count first?
    if (clear) {
      if (agent.prop.Population._countsByPropKeys.length > 0) {
        this.m_CountAgentsByFeatPropTypeReset(agent);
      } else {
        countsByProp.clear();
      }
    }

    agents.forEach(a => {
      // skip count if inert
      if (a.isInert) return;
      if (!a.prop[feature] || !a.prop[feature][featprop]) return;
      const key = a.prop[feature][featprop].value;
      const count = countsByProp.get(key) + 1 || 1;
      countsByProp.set(key, count);
    });
    console.error('countByProp', countsByProp);
  }
  /// Counts currently active (non-inert) agents
  /// NOTE this does not include newly spawned agents
  /// in the AGENTS_TO_CREATE array.  Use countSpawnedAgentsByFeatPropType
  /// to count AGENTS_TO_CREATE.
  countExistingAgentsByFeatPropType(
    agent: IAgent,
    blueprintName: string,
    feature: string,
    featprop: string,
    clear: boolean
  ) {
    const agents = GetAgentsByType(blueprintName);
    this.m_CountAgentsByFeatPropType(
      agent,
      agents,
      blueprintName,
      feature,
      featprop,
      clear
    );
  }

  /// THIS DOESN"T WORK!
  /// AGENTS_TO_CREATE Is an array of isntanceDefs, not actual agents.
  /// so we can't inspect its featprops.
  ///
  /// Counts agents newly spawned by agentsReproduce that have yet to be
  /// created. AGENTS_TO_CREATE
  // countSpawnedAgentsByFeatPropType(
  //   agent: IAgent,
  //   blueprintName: string,
  //   feature: string,
  //   featprop: string,
  //   clear: boolean
  // ) {
  //   const agents = AGENTS_TO_CREATE.filter(a => a.blueprint === blueprintName);
  //   console.error('Agents-to-create', AGENTS_TO_CREATE, agents);
  //   this.countAgentsByFeatPropType(
  //     agent,
  //     agents,
  //     blueprintName,
  //     feature,
  //     featprop,
  //     clear
  //   );
  // }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PopulationPack('Population');
Register(INSTANCE);
