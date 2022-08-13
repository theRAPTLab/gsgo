/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Touches Class

  2021-06-04

  A complete rewrite of Touches.

  Dependencies:
  * feat-physics
  * feat-movement -- to set distanceTo before we do our touch tests during m_Update

  This is a simpler and more efficient version of Touches that adds support
  for different types of touches.

  * There are four types of touches:
    1. c2c -- Center to Center
    2. c2b -- Center to Bounds -- center touches edges of bouds
    3. b2b -- Bounds to Bounds -- edges of bounds touch
    4. binb -- Bounds1 inside Bound2

  * These correspond to new conditions tests:
    1. c2c --> centerTouchesCenter
    2. c2b --> centerTouches
    3. b2b --> touches
    4. binb --> isInside

  * Each condition test also has a 'firstTouches' and 'lastTouches' variant.

  * It hooks into SIM/AGENTS_UPDATE phase instead of using a rxjs interval timer
    REVIEW: We're using AGENTS_UPDATE so it doesn't run during PRERUN
            We might need a new phase or something that only runs when
            the simulation is running and NOT during PRERUN.
            It also needs to run BEFORE CONDITIONS_UPDATE, since the
            conditions tests rely on the calculations.
  * Most calculations are done during the update loop.
  * The touch information is saved into agent.
    --  agent.lastTouch -- touch info from the previous frame
    --  agent.isTouching -- touch info from the current frame
  * lastTouch/isTouching are dictionaries, keyed to the target id whose
    values are the frame number of the detected touch types. e.g.:

        agent.lastTouched[501] = {
          c2c: 1534920,
          c2b: undefined,
          b2b: undefined,
          binb: undefined
        }

  * There no feature properties.  The data is stored in agent.
  * There are essentially no methods other than 'monitor'.  Use
    conditions tests.


  To Use

  The key steps:
  1. You have to register the type of touch you want to monitor.
  2. Use the corresponding condition test

  Example:
        useFeature Physics
        useFeature Touches
        featCall Touch monitor Algae b2b

        when Fish touches Algae [[ ... ]]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SM_Feature from 'lib/class-sm-feature';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

import { DistanceTo } from 'lib/util-vector';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Touches';
const PR = UR.PrefixUtil(FEATID);
const DBG = false;

const AGENT_TOUCHTYPES = new Map(); // Touch-enabled Agents

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * WIDGET_AGENTS
 * @param agentId
 */
function m_GetAgent(agentId): IAgent {
  const a = SIMAGENTS.GetAgentById(agentId);
  if (!a) AGENT_TOUCHTYPES.delete(agentId);
  return a;
}

function m_Clear(agent: IAgent) {
  agent.lastTouched = undefined;
  agent.isTouching = undefined;
}

/// Center to Center
function m_TouchesC2C(a: IAgent, b: IAgent) {
  return DistanceTo(a, b) < 10;
}
/// Center to Bounds
function m_TouchesC2B(a: IAgent, b: IAgent) {
  return a.callFeatMethod('Physics', 'intersectsCenterWithAgentBounds', b);
}
/// Bounds to Bounds
function m_TouchesB2B(a: IAgent, b: IAgent) {
  return a.callFeatMethod('Physics', 'intersectsWith', b);
}
/// Bounds a inside Bounds b
function m_TouchesBinB(a: IAgent, b: IAgent) {
  return a.callFeatMethod('Physics', 'isBoundedBy', b);
}

/// TOUCH LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * TOUCH Update Loop -- Runs once per gameloop
 * Depends on feat-movmeent first setting distances during PHYSICS_UPDATE
 */
/// Stores the frametime of the last touch of each type
/// agent.lastTouched[501] = { c2c: 1534920, c2b: undefined, b2b: undefined }
function m_Update(frame) {
  AGENT_TOUCHTYPES.forEach((d_TouchTypes, agentId) => {
    const agent = m_GetAgent(agentId);
    if (!agent) return;

    d_TouchTypes.forEach((touchTypes, bpname) => {
      const targets = SIMAGENTS.GetAgentsByType(bpname);
      targets.forEach(t => {
        // skip self
        if (agentId === t.id) return;

        // make sure target agent also has Physics feature
        if (!t.hasFeature('Physics'))
          throw new Error(`Touches requires Physics for ${t.name}!`);

        let c2c;
        let c2b;
        let b2b;
        let binb;
        // if agent or target is inert, we still need to clear c2c/c2b/b2b
        if (!agent.isInert && !t.isInert) {
          if (touchTypes.includes('c2c')) {
            c2c = m_TouchesC2C(agent, t) ? frame : undefined;
            if (DBG && c2c) console.log('touches c2c', frame);
          }
          if (touchTypes.includes('c2b')) {
            c2b = m_TouchesC2B(agent, t) ? frame : undefined;
            if (DBG && c2b) console.log('touches c2b', frame);
          }
          if (touchTypes.includes('b2b')) {
            b2b = m_TouchesB2B(agent, t) ? frame : undefined;
            if (DBG && b2b) console.log('touches b2b', frame);
          }
          if (touchTypes.includes('binb')) {
            binb = m_TouchesBinB(agent, t) ? frame : undefined;
            if (DBG && binb) console.log('touches binb', frame);
          }
        }
        if (!agent.lastTouched) agent.lastTouched = new Map();
        if (!agent.isTouching) agent.isTouching = new Map();
        agent.lastTouched.set(t.id, agent.isTouching.get(t.id));
        agent.isTouching.set(t.id, { c2c, c2b, b2b, binb });
      });
    });
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class TouchPack extends SM_Feature {
  //
  constructor(name) {
    super(name);
    this.featAddMethod('monitor', this.monitor);
    this.featAddMethod('getTouchingAgent', this.getTouchingAgent);
    this.featAddMethod('clearTouches', this.clearTouches);
    UR.HookPhase('SIM/PHYSICS_THINK', m_Update);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    AGENT_TOUCHTYPES.clear();
  }

  /// VISION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  monitor(agent: IAgent, targetBlueprintName: string, ...touchTypes: string[]) {
    // make sure agent has the Physics feature
    if (!agent.hasFeature('Physics'))
      throw new Error(`Touches requires Physics for ${agent.name}!`);
    if (touchTypes.length < 1)
      throw new Error('Touches monitor requires a touchType!');
    const d_TouchTypes = AGENT_TOUCHTYPES.get(agent.id) || new Map();
    d_TouchTypes.set(targetBlueprintName, touchTypes);
    AGENT_TOUCHTYPES.set(agent.id, d_TouchTypes);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Returns the first agent that matches the touchtype
  getTouchingAgent(agent: IAgent, touchType: string) {
    if (!agent.isTouching) return undefined;
    const targetIds = [...agent.isTouching.keys()];
    const touchingId = targetIds.find(id => agent.isTouching.get(id)[touchType]);
    if (touchingId) {
      // console.log(agent.id, 'isTouching', touchingId);
      return SIMAGENTS.GetAgentById(touchingId);
    }
    return undefined;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Clears saved isTouching and lastTouched relative to targetId for ALL agents
  /// Use when deleting an agent otherwise isTouching and lastTouched
  /// are never reset.  See feat-population.m_Delete
  clearTouches(agent: IAgent, targetId: string) {
    const agents = SIMAGENTS.GetAllAgents();
    agents.forEach(a => {
      // use `delete` not clear to prevent memory leak
      if (a.lastTouched) a.lastTouched.delete(targetId);
      if (a.isTouching) a.isTouching.delete(targetId);
    });
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(TouchPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return TouchPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {},
    methods: {
      monitor: { args: ['targetBlueprintName:string', 'touchType:identifier'] },
      getTouchingAgent: { args: ['touchType:identifier'] },
      clearTouches: { args: ['targetId:string'] }
    }
  };
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new TouchPack(FEATID);
SIMDATA.RegisterFeature(INSTANCE);
