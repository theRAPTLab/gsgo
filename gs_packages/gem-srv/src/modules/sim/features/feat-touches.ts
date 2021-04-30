/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Touches Class!

  This creates a lookup table for the last touch between agents.
  The indexes are nested.


  Data Structures

  AGENTS_TBL.get(agentId).get(blueprintName).get(targetId)

      AGENTS_TBL = [
        [ agentId, [
          [ blueprintId, [
              [ agentId, lastTouchTime ],
              [ agentId, lastTouchTime ],
          ]],
          [ blueprintId, [
              [ agentId, lastTouchTime ],
              [ agentId, lastTouchTime ],
          ]],
        ]
        ...
      ]

  The lookup table simply returns true if the agent last touched any agent of the
  target blueprint type.

      didTouchDict = [
        [ bluePrintId, didTouch: GVarBoolean ],
        [ bluePrintId, didTouch: GVarBoolean ],
        ...
      ]


  To Use:
  1. Use the Feature: `useFeat Touches`
  2. Log the blueprint to be monitored: `featCall Touches monitorTouchesWith 'Lightbeam'`
  3. When the sim starts, the Touches Feature will update AGENTS_TBL with the
     last time the two agents touched each other during each SIM/PHYSICS loop.
  4. When you want to see if there was a touch, you first have to call the `touchedWithin`
     method to define a period.  e.g. to look for all touches with any Lightbeam
     within the last second, use:
        `featCall Touches touchedWithin 'Lightbeam' 1`
     This will look for touches within the last second in AGENTS_TBL and
     update `didTouchDict` with touches for ALL Lightbeam agents.
  5. You can then check the value of `didTouchDict` for `LightBeam` to see if
     there was a touch:
        `ifExpr {{ agent.getFeatProp('Touches', 'didTouchDict').getItem('Lightbeam').value }} [[`
  6.  Or more conveniently, you can check the results of the featCall directly:
        ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Lightbeam', 1) }} [[
          // do something
        ]]
      With this method you do not need to make a second call to didTouchDict.

  Full Example:
      # PROGRAM DEFINE
      useFeat Touches
      featCall Touches monitorTouchesWith 'Lightbeam'

      # PROGRAM UPDATE
      featCall Touches touchedWithin 'Lightbeam' 1
      ifExpr {{ agent.getFeatProp('Touches', 'didTouchDict').getItem('Lightbeam').value }} [[
        // do something
      ]]

  Simple Example (with convenient return):
      # PROGRAM UPDATE
      ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Lightbeam', 1) }} [[
        // do something
      ]]

  Rationale
  * We're storing the lookup table with the Feature itself so that
    agents aren't cluttered up with lookup tables.
  * We're not using featProps to store the lookup tables because
    featProps are cumbersome to use and really only necessary if the
    tables themselves are meant to be read by agents directly via scripting.
    Since we have featMethods to handle the requests, it is not necessary
    to use featProps.
  * The `touchedWithin` call gives you a lot of flexibility with how you
    want to test the data once you've turned on monitoring.  Rather than
    specifying the period window when setting up the monitoring, you can
    request a different period with each call.
  * Even though `touchedWithin` will return the result, didTouchDict can
    still be used to test for touches with other blueprints previously
    tracked.  e.g. you call `touchedWithin` on 'Lightbeam', then call
    it again with 'Fish'.  The 'Lightbeam' status is still available
    in didTouchDict even after you call `touchedWithin` with fish.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { interval } from 'rxjs';
import UR from '@gemstep/ursys/client';
import {
  GVarNumber,
  GVarString,
  GVarDictionary,
  GVarBoolean
} from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import {
  GetAgentsByType,
  GetAgentById,
  GetAgentByName
} from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';
import { GetSpriteDimensions } from 'modules/datacore/dc-globals';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TouchesPack');
const DBG = true;

// const AGENTS_TBL = new Map(); // [ ...[ agentId, BTYPE_TBL: map ]]
// Blueprint Type: BTYPE_TBL  = [ ...[ blueprintName, TAGENT_TBL: map ]]
// Target Agent:   TAGENT_TBL = [ ...[ targetAgentId, lastTouched: number ]]

// Stuff in agents instead
const MONITORED_AGENTS = new Map();

const FPS = 30;
let TIMER: any;
let COUNTER: number;

UR.HookPhase('SIM/PHYSICS', m_update);

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * MONITORED AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  if (!a) MONITORED_AGENTS.delete(agentId);
  return a;
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class TouchesPack extends GFeature {
  //
  constructor(name) {
    super(name);
    this.featAddMethod('monitorTouchesWith', this.monitorTouchesWith);
    this.featAddMethod('touchedWithin', this.touchedWithin);

    this.startTimer = this.startTimer.bind(this);

    UR.HandleMessage('NET:HACK_SIM_START', this.startTimer);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.stopTimer);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  /// REVIEW: initialize is not called at the moment!
  initialize(simloop) {
    super.initialize(simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  clear() {
    // Stuff in agents instead
    // const agents = Array.from(AGENTS_TBL.keys());
    const agentIds = Array.from(MONITORED_AGENTS.keys());
    agentIds.forEach(id => {
      // Stuff in agents instead
      // const BTYPE_TBL = AGENTS_TBL.get(a);
      const agent = m_getAgent(id);
      if (!agent) return; // usu charControl dropped
      const BTYPE_TBL = agent.touchTable || new Map();
      const blueprints = Array.from(BTYPE_TBL.keys());
      blueprints.forEach(b => {
        const TAGENT_TBL = BTYPE_TBL.get(b) || new Map();
        // shouldn't we just clear them instead?
        TAGENT_TBL.clear();

        // Orig method
        // const targets = Array.from(TAGENT_TBL.keys());
        // targets.forEach(t => {
        //   TAGENT_TBL.set(t, 0);
        // });
      });
      // clear blueprint type too
      BTYPE_TBL.clear();
      agent.touchTable = BTYPE_TBL;
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  startTimer() {
    if (DBG) console.log(...PR('Start Timer'));
    COUNTER = 0;
    this.clear();
    const size = 1000 / FPS; // Interval size matches sim rate
    TIMER = interval(size).subscribe(count => {
      COUNTER = count;
    });
  }
  stopTimer() {
    if (DBG) console.log(...PR('Stop Timer'));
    TIMER.unsubscribe();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add physics-specific properties to the agent. The feature methods
   *  are defined inside the featurepack instance, not the agent instance
   *  as props are.
   */
  decorate(agent) {
    super.decorate(agent);
    // add feature props here
    this.featAddProp(agent, 'didTouchDict', new GVarDictionary(''));
  }

  /// TOUCHES METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Touchs setRadius value
   */

  /**
   * This sets up monitoring between the agent and the target blueprint
   * Do this for any blueprint you plan on touching
   * @param agent
   * @param targetBlueprintName -- blueprint name
   */
  monitorTouchesWith(agent: IAgent, targetBlueprintName: string) {
    // Stuff in agents instead
    // const BTYPE_TBL = AGENTS_TBL.get(agent.id) || new Map();
    const BTYPE_TBL = agent.touchTable || new Map();
    const TAGENT_TBL = BTYPE_TBL.get(targetBlueprintName) || new Map();
    BTYPE_TBL.set(targetBlueprintName, TAGENT_TBL);
    // Stuff in agents instead
    // AGENTS_TBL.set(agent.id, BTYPE_TBL);
    agent.touchTable = BTYPE_TBL;
    MONITORED_AGENTS.set(agent.id, agent.id);
  }
  /**
   * Returns true if agent touched ANY agent of targetBlueprintName type
   * Also updates didTouchDict with the result.
   *
   * Using this requires two calls:
   * 1. Request the test:
   *      featCall Touches touchedWithin 'Lightbeam' 1
   * 2. Retreive the result:
   *      agent.getFeatProp('Touches', 'touched').getItem('Lightbeam').value
   *
   * For convenience, touchedWithin also returns true if one of the
   * target type agents did touch the agent, so you can use it in an ifExpr.
   *        ifExpr {{ agent.callFeatMethod('Touches', 'touchedWithin', 'Lightbeam', 1) }} [[
   *          // do something
   *        ]]
   *
   * @param agent
   * @param targetBlueprintName
   * @param period
   */
  touchedWithin(
    agent: IAgent,
    targetBlueprintName: string,
    period: number
  ): boolean {
    // Stuff in agents instead
    // const BTYPE_TBL = AGENTS_TBL.get(agent.id);
    const BTYPE_TBL = agent.touchTable;
    // Users might call `touchedWithin` without first registering for monitoring
    if (!BTYPE_TBL)
      console.error(
        ...PR(`touchedWithin: ${targetBlueprintName} not intialized`)
      );
    const TAGENT_TBL = BTYPE_TBL.get(targetBlueprintName);
    if (!TAGENT_TBL)
      console.error(
        ...PR(`touchedWithin: ${targetBlueprintName} missing TAGENT_TBL`)
      );

    let didTouchAny = false;
    const targetAgents = GetAgentsByType(targetBlueprintName);
    targetAgents.forEach(targetAgent => {
      const lastTouch = TAGENT_TBL.get(targetAgent.id);
      const timeElapsed = COUNTER - lastTouch;

      // period is time period since last touch in seconds
      // e.g. period = 1 is last touch was within 1 second
      // e.g. period = 5 is rlast touch was within 5 seconds

      // COUNTER goes up by 1 every 33 ms.
      // e.g. COUNTER at 1 sec = 30
      // e.g. COUNTER at 5 sec = 150

      const isTouching = timeElapsed < period * FPS;
      didTouchAny = didTouchAny || isTouching;
    });
    const didTouchDict = agent.getFeatProp(this.name, 'didTouchDict');
    didTouchDict.updateItem(targetBlueprintName, new GVarBoolean(didTouchAny));
    return didTouchAny;
  }
}

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_isTouching(a: IAgent, b: IAgent) {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  // if either is inert, no touches are possible
  // REVIEW use Physics shape for bounds comparison?
  // This assumes rectangular!
  if (a.isInert || b.isInert) return false;
  const boundsA = a.callFeatMethod('Physics', 'getBounds');
  const boundsB = b.callFeatMethod('Physics', 'getBounds');
  const res =
    boundsA.x < boundsB.x + boundsB.width &&
    boundsA.x + boundsA.width > boundsB.x &&
    boundsA.y < boundsB.y + boundsB.height &&
    boundsA.y + boundsA.height > boundsB.y;
  return res;
}

function m_update() {
  // Stuff it in agents instead
  // const agents = Array.from(AGENTS_TBL.keys());
  const agentIds = Array.from(MONITORED_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return; // usu charControl dropped

    // Stuff it in agents instead
    // const BTYPE_TBL = AGENTS_TBL.get(agentId);
    const BTYPE_TBL = agent.touchTable;
    const blueprintNames = Array.from(BTYPE_TBL.keys());
    blueprintNames.forEach(blueprintName => {
      const targets = GetAgentsByType(blueprintName);
      const TAGENT_TBL = BTYPE_TBL.get(blueprintName);
      targets.forEach(b => {
        if (m_isTouching(agent, b)) {
          TAGENT_TBL.set(b.id, COUNTER);
        }
      });
    });
  });
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new TouchesPack('Touches');
Register(INSTANCE);
