/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Population Class

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/ required libraries /*/
import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import SM_Feature from 'lib/class-sm-feature';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as TRANSPILER from 'modules/sim/script/transpiler-v2';
import merge from 'deepmerge';

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
    const agent = SIMAGENTS.GetAgentById(id);
    if (agent) {
      // Clear isTouching and lastTouched values here
      // because agent will be removed and touch update
      // will no longer update touch state with this agent
      if (agent.hasFeature('Touches')) {
        agent.callFeatMethod('Touches', 'clearTouches', agent.id);
      }
      SIMAGENTS.DeleteAgent({
        id: agent.id,
        bpid: agent.blueprint.name
      });
    }
  }
}
function m_Create(frame) {
  while (AGENTS_TO_CREATE.length > 0) {
    const def = AGENTS_TO_CREATE.pop();

    SIMAGENTS.DefineInstance(def);
    let agent = TRANSPILER.MakeAgent(def);
    const parent = SIMAGENTS.GetAgentById(def.parentId);
    if (parent) {
      if (def.doClone) SIMAGENTS.CopyAgentProps(parent, agent);
      else {
        // just copy x/y
        agent.x = parent.x + RNG() * 8 - 4;
        agent.y = parent.y + RNG() * 8 - 4;
      }
    }

    // but reset inert!
    agent.prop.isInert.setTo(false);

    // if spawnMutation settings are defined, then change those
    // BEFORE executing the script
    if (def.mutationPropName !== undefined) {
      let mutationProp;
      if (def.mutationPropFeature) {
        // featProp
        mutationProp = agent.prop[def.mutationPropFeature][def.mutationPropName];
      } else {
        mutationProp = agent.prop[def.mutationPropName];
      }
      mutationProp.addRndInt(-def.mutationSubtract, def.mutationAdd);
    }

    const initScript = def.initScript; // spawnscript
    agent.exec(initScript, { agent }); // run spawnscript
  }
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PopulationPack extends SM_Feature {
  constructor(name) {
    super(name);
    // Population Management
    this.featAddMethod('createAgent', this.createAgent);
    this.featAddMethod('spawnChild', this.spawnChild);
    this.featAddMethod('removeAgent', this.removeAgent);
    this.featAddMethod('getRandomActiveAgent', this.getRandomActiveAgent);
    // Global Population Management
    this.featAddMethod('releaseAllAgents', this.releaseAllAgents);
    this.featAddMethod('releaseInertAgents', this.releaseInertAgents);
    this.featAddMethod('hideInertAgents', this.hideInertAgents);
    this.featAddMethod('removeInertAgents', this.removeInertAgents);
    this.featAddMethod('agentsReproduce', this.agentsReproduce);
    this.featAddMethod('oneAgentReproduce', this.oneAgentReproduce);
    this.featAddMethod('populateBySpawning', this.populateBySpawning);
    this.featAddMethod('agentsForEachActive', this.agentsForEachActive);
    this.featAddMethod('agentsForEach', this.agentsForEach);
    // Statistics
    this.featAddMethod('getActiveAgentsCount', this.getActiveAgentsCount);
    this.featAddMethod('countAgents', this.countAgents);
    this.featAddMethod('countAgentProp', this.countAgentProp);
    this.featAddMethod('minAgentProp', this.minAgentProp);
    this.featAddMethod('maxAgentProp', this.maxAgentProp);
    // Histogram
    this.featAddMethod('countAgentsByPropType', this.countAgentsByPropType);
    this.featAddMethod(
      'setAgentsByFeatPropTypeKeys',
      this.setAgentsByFeatPropTypeKeys
    );
    this.featAddMethod(
      'countExistingAgentsByFeatPropType',
      this.countExistingAgentsByFeatPropType
    );

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

    // statistics
    this.featAddProp(agent, 'count', new SM_String());
    this.featAddProp(agent, 'sum', new SM_String());
    this.featAddProp(agent, 'avg', new SM_String());
    this.featAddProp(agent, 'min', new SM_String());
    this.featAddProp(agent, 'max', new SM_String());

    // used by countAgentProp without parameters
    this.featAddProp(agent, 'monitoredAgent', new SM_String());
    this.featAddProp(agent, 'monitoredAgentProp', new SM_String());
    this.featAddProp(agent, 'monitoredAgentPropFeature', new SM_String());

    // Used by spawnChild
    this.featAddProp(agent, 'spawnMutationProp', new SM_String());
    this.featAddProp(agent, 'spawnMutationPropFeature', new SM_String()); // if prop is a featProp, this is the feature
    this.featAddProp(agent, 'spawnMutationMaxAdd', new SM_Number());
    this.featAddProp(agent, 'spawnMutationMaxSubtract', new SM_Number());

    // Used by populateBySpawning to set target population levels
    this.featAddProp(agent, 'targetPopulationSize', new SM_Number(1));
    this.featAddProp(agent, 'deleteAfterSpawning', new SM_Boolean(true));

    agent.prop.Population._countsByProp = new Map();
  }

  /// POPULATION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Create agent of arbitrary blueprintName type via script
   * Only copies x and y of parent
   * @param agent
   * @param blueprintName
   * @param initScript
   */
  createAgent(agent: IAgent, blueprintName: string, initScript: string) {
    const label = `${blueprintName}${COUNT++}`;
    // Queue Instance Defs
    const def = {
      label,
      bpid: blueprintName,
      initScript,
      doClone: false,
      parentId: agent.id // save for positioning
    };
    AGENTS_TO_CREATE.push(def);
  }
  /**
   * Create child agent via script, duplicating properties of parent
   * and running special spawn script.
   * The parent agent is the first `agent` parameter.
   * @param agent
   * @param spawnScript
   * @param def
   */
  spawnChild(agent: IAgent, spawnScript: string, def: any = {}) {
    const bpname = agent.blueprint.name;
    const label = `${bpname}${COUNT++}`;
    // Queue Instance Defs
    const thisDef: any = merge.all([def]); // clone since other children share the same def
    thisDef.label = label;
    thisDef.bpid = bpname;
    thisDef.initScript = spawnScript;
    thisDef.doClone = true;
    thisDef.parentId = agent.id;
    AGENTS_TO_CREATE.push(thisDef);
  }
  /**
   * Removes self
   */
  removeAgent(agent: IAgent) {
    AGENTS_TO_REMOVE.push(agent.id);
  }
  /**
   * Returns a random agent of blueprint type that is not inert.
   * @param agent
   * @param spawnScript
   */
  getRandomActiveAgent(agent: IAgent, bpname: string): IAgent {
    const agents = SIMAGENTS.GetAgentsByType(bpname);
    if (agents.length < 1) {
      console.error(`Population:getRandomActiveAgent: No ${bpname} agents left!`);
      return undefined; // no agents
    }
    const activeAgents = agents.filter(a => !a.isInert);
    if (activeAgents.length < 1) {
      console.error(
        `Population:getRandomActiveAgent: No non-inert ${bpname} agents left!`
      );
      return undefined; // no non-inert agents
    }
    return activeAgents[Math.floor(RNG()) * activeAgents.length];
  }

  /// GLOBAL METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Release cursors for ALL agents globally
   */
  releaseAllAgents(agent: IAgent) {
    const agents = SIMAGENTS.GetAllAgents();
    agents.forEach(a => {
      if (a.hasFeature('Cursor') && a.blueprint.name !== 'Cursor') {
        a.callFeatMethod('Cursor', 'releaseCursor');
      }
    });
  }

  /**
   * Release cursors for ALL inert agents globally
   */
  releaseInertAgents(agent: IAgent) {
    const agents = SIMAGENTS.GetAllAgents();
    agents.forEach(a => {
      if (a.isInert && a.hasFeature('Cursor'))
        a.callFeatMethod('Cursor', 'releaseCursor');
    });
  }
  /**
   * Turn off visible property for ALL inert agents globally
   */
  hideInertAgents(agent: IAgent) {
    const agents = SIMAGENTS.GetAllAgents();
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
    const agents = SIMAGENTS.GetAllAgents();
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
    const agents = SIMAGENTS.GetAgentsByType(bpname);
    const def = {
      mutationPropName: agent.prop.Population.spawnMutationProp.value,
      mutationPropFeature: agent.prop.Population.spawnMutationPropFeature.value,
      mutationAdd: agent.prop.Population.spawnMutationMaxAdd.value,
      mutationSubtract: agent.prop.Population.spawnMutationMaxSubtract.value
    };
    agents.forEach(a => {
      if (!a.isInert) {
        this.spawnChild(a, spawnScript, def);
        if (deleteAfterSpawning) a.prop.isInert.setTo(true);
      }
    });
  }
  /**
   * For ONE agents of type bpname, call SpawnChild if not inert
   * @param agent
   * @param bpname
   * @param spawnScript
   */
  oneAgentReproduce(agent: IAgent, bpname: string, spawnScript: string) {
    console.error('oneagentreproduce');
    const deleteAfterSpawning = agent.prop.Population.deleteAfterSpawning.value;
    const parent = this.getRandomActiveAgent(agent, bpname);
    if (parent === undefined) {
      console.error(
        'Popuation.oneAgentReproduce was not able to find a non-inert parent agent to reproduce from!'
      );
      return;
    }
    const def = {
      mutationPropName: agent.prop.Population.spawnMutationProp.value,
      mutationPropFeature: agent.prop.Population.spawnMutationPropFeature.value,
      mutationAdd: agent.prop.Population.spawnMutationMaxAdd.value,
      mutationSubtract: agent.prop.Population.spawnMutationMaxSubtract.value
    };
    this.spawnChild(parent, spawnScript, def);
    if (deleteAfterSpawning) parent.prop.isInert.setTo(true);
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
    const agents = SIMAGENTS.GetAgentsByType(bpname);

    if (agents.length < 1)
      throw Error(
        `populateBySpwaning can't spawn because there are no ${bpname} agents left!`
      );

    while (count < targetPopulationSize) {
      const a = agents[agentIndex];
      if (!a.isInert) {
        // mutationProps
        // Pass the mutation properties to SpawnChild and m_Create.
        // Mutation parameters are defined for the agent calling populateBySpawning
        // which in many cases is the GlobalAgent.
        // m_Create is run without any agent context other than
        // the newly created agent, which will not have the mutation
        // parameters defined.
        // Also, for populateBySpawning, spawnChild is run in the context
        // of a selected parent agent.  So again, the mutation parameters
        // will be missing.
        // So we need to pass the mutation parameters from here
        // to the spawnChild defintion, which then passes it
        // to m_Create.
        const def = {
          mutationPropName: agent.prop.Population.spawnMutationProp.value,
          mutationPropFeature:
            agent.prop.Population.spawnMutationPropFeature.value,
          mutationAdd: agent.prop.Population.spawnMutationMaxAdd.value,
          mutationSubtract: agent.prop.Population.spawnMutationMaxSubtract.value
        };
        this.spawnChild(a, spawnScript, def);
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
    const agents = SIMAGENTS.GetAgentsByType(bpname);
    agents.forEach(a => {
      if (!a.isInert) a.exec(program, { agent: a });
    });
  }
  /**
   * For all agents of type bpname, call program regardless of inert state
   */
  agentsForEach(agent: IAgent, bpname: string, program: TSMCProgram) {
    const agents = SIMAGENTS.GetAgentsByType(bpname);
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
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
    let count = 0;
    agents.forEach(a => {
      if (!a.isInert) count++;
    });
    return count;
  }

  countAgents(agent: IAgent, blueprintName: string) {
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
    let prop = agent.getFeatProp(this.name, 'count');
    (prop as SM_Number).setTo(agents.length);
  }
  /**
   * Updates three featProp statistics:
   *   count -- number of agents
   *   sum -- total of the agent's prop values (e.g. sum of algae energylevels)
   *   avg -- average of agent's prop values (e.g. avg of algae energylevel)
   * This is a one-time call.
   *
   * Using featProps
   * To use this with Script Wizard UI:
   * 1. First set monitoredAgent: featProp Population monitoredAgent setTo Moth
   * 2. Set monitoredAgentProp: featProp Population monitoredAgentProp setTo energyLevel
   * 3. Then call this without paramaeters: featCall Population countAgentProp
   *
   * @param agent
   * @param blueprintName (optional -- falls back to monitoredAgent)
   * @param prop (optional -- falls back to monitoredAgentProp)
   * @returns Sets three feature propertie: count, sum, avg
   */
  countAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    if (blueprintName === undefined)
      blueprintName = agent.prop.Population.monitoredAgent.value;
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    if (prop === undefined) prop = agent.prop.Population.monitoredAgentProp.value;
    const sum = agents
      .map(a => a.getProp(prop).value)
      .reduce((acc, cur) => acc + cur);
    let p = agent.getFeatProp(this.name, 'count');
    (p as SM_Number).setTo(agents.length);
    p = agent.getFeatProp(this.name, 'sum');
    (p as SM_Number).setTo(sum);
    p = agent.getFeatProp(this.name, 'avg');
    (p as SM_String).setTo(Number(sum / agents.length).toFixed(2));
  }
  /// Returns the minimum number of agents of type blueprintName
  minAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    const minimizer = (min, cur) => Math.min(min, cur);
    const min = agents
      .map(a => a.getProp(prop).value)
      .reduce(minimizer, Infinity);
    let p = agent.getFeatProp(this.name, 'min');
    (p as SM_Number).setTo(min);
  }
  /// Returns the maximum number of agents of type blueprintName
  maxAgentProp(agent: IAgent, blueprintName: string, prop: string) {
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
    if (agents.length < 1) return;
    const maximizer = (max, cur) => Math.max(max, cur);
    const max = agents
      .map(a => a.getProp(prop).value)
      .reduce(maximizer, -Infinity);
    let p = agent.getFeatProp(this.name, 'max');
    (p as SM_Number).setTo(max);
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
    const agents = SIMAGENTS.GetAgentsByType(blueprintName);
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
   * The result is stored in agent.prop.Population._countsByProp
   *
   * This assumes we only have a single countAgentsByFeatPropType
   * property.
   *
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
    feature: string,
    featprop: string,
    clear: boolean
  ) {
    const countsByProp = agent.prop.Population._countsByProp;

    // reset count first?
    if (clear || agent.prop.Population._countsByProp.size < 1) {
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
  }
  /**
   * Counts currently active (non-inert) agents
   *
   * NOTE this does not include newly spawned agents
   * in the AGENTS_TO_CREATE array.  Use countSpawnedAgentsByFeatPropType
   * to count AGENTS_TO_CREATE.
   *
   * Using featProps
   * To use this with Script Wizard UI:
   * 1. First set monitoredAgent: featProp Population monitoredAgent setTo Moth
   * 2. Set monitoredAgentProp: featProp Population monitoredAgentProp setTo energyLevel
   * 3. Then call this without paramaeters: featCall Population countAgentProp
   *
   */
  countExistingAgentsByFeatPropType(
    agent: IAgent,
    blueprintName: string,
    feature: string,
    featprop: string,
    clear: boolean // REVIEW: `clear` hard to set with if using featProp method?
    // e.g. have to use `featCall countExistingAgentsByFeatPropType undefined undefined undefined true`
  ) {
    const bpname = blueprintName || agent.prop.Population.monitoredAgent.value;
    const feat = feature || agent.prop.Population.monitoredAgentPropFeature.value;
    const prop = featprop || agent.prop.Population.monitoredAgentProp.value;
    const agents = SIMAGENTS.GetAgentsByType(bpname);
    this.m_CountAgentsByFeatPropType(agent, agents, feat, prop, clear);
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

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  symbolize(): TSymbolData {
    return {
      props: {
        'count': SM_Number.Symbols,
        'sum': SM_Number.Symbols,
        'avg': SM_Number.Symbols,
        'min': SM_Number.Symbols,
        'max': SM_Number.Symbols,
        'monitoredAgent': SM_Number.Symbols,
        'monitoredAgentProp': SM_Number.Symbols,
        'monitoredAgentPropFeature': SM_Number.Symbols,
        'spawnMutationProp': SM_Number.Symbols,
        'spawnMutationPropFeature': SM_Number.Symbols,
        'spawnMutationMaxAdd': SM_Number.Symbols,
        'spawnMutationMaxSubtract': SM_Number.Symbols,
        'targetPopulationSize': SM_Number.Symbols,
        'deleteAfterSpawning': SM_Number.Symbols
      },
      methods: {
        'createAgent': { args: ['blueprintName:string', 'initScript:string'] },
        'spawnChild': { args: ['spawnScript:string', 'def:objref'] },
        'removeAgent': {},
        'getRandomActiveAgent': { args: ['bpname:number'] },
        'releaseAllAgents': {},
        'releaseInertAgents': {},
        'hideInertAgents': {},
        'removeInertAgents': {},
        'agentsReproduce': { args: ['bpname:string', 'spawnScript:string'] },
        'oneAgentReproduce': { args: ['bpname:string', 'spawnScript:string'] },
        'populateBySpawning': { args: ['bpname:string', 'spawnScript:string'] },
        'agentsForEachActive': { args: ['bpname:string', 'program:program'] },
        'agentsForEach': { args: ['bpname:string', 'program:program'] },
        'getActiveAgentsCount': { args: ['blueprintName:string'] },
        'countAgents': { args: ['blueprintName:string'] },
        'countAgentProp': { args: ['blueprintName:string', 'prop:string'] },
        'minAgentProp': { args: ['bpname:string', 'prop:string'] },
        'maxAgentProp': { args: ['bpname:string', 'prop:string'] },
        'countAgentsByPropType': {
          args: ['bpname:string', 'prop:string', 'clear:boolean']
        },
        'setAgentsByFeatPropTypeKeys': { args: ['bpname:string', 'keys:{...}'] },
        'countExistingAgentsByFeatPropType': {
          args: [
            'blueprintName:string',
            'feature:string',
            'featprop:string',
            'clear:boolean'
          ]
        }
      }
    };
  }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PopulationPack('Population');
SIMDATA.RegisterFeature(INSTANCE);
