/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Touches Class!

  TOUCH_AGENTS = [ ...[id, targetMap] ]

  targetMap = [ ...[targetBlueprintName, touchMap] ]
  touchMap =  [ ...[targetId, lastTouchTime]]

  e.g. TOUCH_AGENTS = [ [501, ['Lightbeam', [ [601, 30], [602, 0] ] ]]]


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
import { GetAgentsByType, GetAgentById } from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';
import { GetSpriteDimensions } from 'modules/datacore/dc-globals';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TouchesPack');
const DBG = true;

const TOUCH_AGENTS = [];

let TIMER: any;
let COUNTER: number;

UR.HookPhase('SIM/PHYSICS', m_update);

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class TouchesPack extends GFeature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('monitorTouchesWith', this.monitorTouchesWith);
    this.featAddMethod('touchedWithin', this.touchedWithin);

    UR.HandleMessage('NET:HACK_SIM_START', this.startTimer);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.stopTimer);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  /// REVIEW: initialie is not called at the moment!
  initialize(simloop) {
    super.initialize(simloop);
    console.error('simloop', simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  startTimer() {
    if (DBG) console.log(...PR('Start Timer'));
    const size = 33; // Interval size matches sim rate
    TIMER = interval(size).subscribe(count => {
      // console.log('count', count);
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
    this.featAddProp(agent, 'touched', new GVarDictionary('')); // dict name not used
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
    // Stuff the data into the agent
    const touchMap = agent.touchMap || new Map();
    touchMap.set(targetBlueprintName, new Map());
    agent.touchMap = touchMap;
    TOUCH_AGENTS.push(agent.id);
    console.error(agent.id, 'monitoring', touchMap);
  }
  /**
   * Using this requires two calls:
   * 1. Request the test:
   *      featCall Touches touchedWithin 'Lightbeam' 1
   * 2. Retreive the result:
   *      agent.getFeatProp('Touches', 'touched').getItem('Lightbeam').value
   * @param agent
   * @param targetBlueprintName
   * @param period
   */
  touchedWithin(agent: IAgent, targetBlueprintName: string, period: number) {
    if (!agent.touchMap) {
      console.warn(
        ...PR(
          'touchedWithin: Tried to request touch information for',
          targetBlueprintName,
          'without having registered for any touch monitoring. Use "monitorTouchesWith".'
        )
      );
      return;
    }
    const touchMap = agent.touchMap.get(targetBlueprintName);
    if (!agent.touchMap) {
      console.warn(
        ...PR(
          'touchedWithin: Tried to request touch information for a blueprint that was not registered',
          targetBlueprintName
        )
      );
      return;
    }
    const touchTargets = GetAgentsByType(targetBlueprintName);
    touchTargets.forEach(targetAgent => {
      const lastTouch = touchMap.get(targetAgent.id);
      const timeElapsed = COUNTER - lastTouch;
      console.log('...lastTOuch', lastTouch, 'elapsed', timeElapsed);

      // period is time since last touch
      // e.g. period = 1 is run 1 time every second
      // e.g. period = 5 is run 1 time every 5 seconds

      // COUNTER goes up by 1 every 33 ms.
      // e.g. COUNTER at 1 sec = 30
      // e.g. COUNTER at 5 sec = 150

      const isTouching = timeElapsed < period * 30;
      let touched = agent.getFeatProp(this.name, 'touched');
      console.log('got map', touched);
      if (!touched) touched = new Map();
      if (touched.has(targetBlueprintName)) {
        touched.getItem(targetBlueprintName).setTo(isTouching);
      } else {
        touched.addItem(targetBlueprintName, new GVarBoolean(isTouching));
      }
    });
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
  if (res) {
    console.error(a.id, 'is', res, 'touching', b.id);
  }
  return res;
}

function m_update() {
  TOUCH_AGENTS.forEach(agentId => {
    const a = GetAgentById(agentId);
    const blueprintNames = Array.from(a.touchMap.keys());
    // console.log('checking blueprint', blueprintNames);
    blueprintNames.forEach(targetBlueprintName => {
      const targets = GetAgentsByType(targetBlueprintName);
      // console.log('...checking', a.id, 'against', targets[0].id);
      targets.forEach(b => {
        if (m_isTouching(a, b)) {
          a.touchMap.get(targetBlueprintName).set(b.id, COUNTER);
          console.error('is touching at', COUNTER, a.touchMap);
        }
      });
    });
  });
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new TouchesPack('Touches');
Register(INSTANCE);
