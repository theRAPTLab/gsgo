/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { RegisterFunction, GetFunction } from 'modules/datacore/dc-named-methods';
import {
  GetAllInteractions,
  SingleAgentFilter,
  PairAgentFilter
} from 'modules/datacore/dc-interactions';
import { GetScriptEventHandlers } from 'modules/datacore/dc-script-engine';
import { GetAgentsByType } from 'modules/datacore/dc-agents';
import { GetGlobalAgent } from 'lib/class-gagent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');
const DBG = false;
const GLOBAL_AGENT = GetGlobalAgent();
let EVENT_QUEUE = [];
let GLOBAL_INTERACTIONS = [];

/// REGISTER NAMED METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the old test program style (deprecated) is in tests/test-conditions.ts
RegisterFunction('dies', a => {
  if (a.prop.foodLevel.value < 1) {
    console.log('dead!');
    return true;
  }
  return false;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  wasTouchedWithin provides touch testing over time periods
 *  in contrast with the instantaneous touch tests of "touhces"
 *
 *  This uses the `didTouchDict` set by the Touches feature for the touch
 *  test.  It requires both Physics and Touches features.
 *  Call touchedWithin to update didTouchDIct before using wasTouchedWithin
 *
 *  Example:
 *     # PROGRAM UPDATE
 *     every 1 [[
 *       featCall Touches touchedWithin Ligthbeam 0.1
 *       when Algae wasTouchedWithin Lightbeam [[
 *         featCall Algae.Costume setGlow 0.5
 *       ]]
 *     ]]
 */
RegisterFunction('wasTouchedWithin', (a, b) => {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics'))
    console.error('wasTouchedWithin requires Physics');
  // make sure both objects have the Touches feature
  if (!a.hasFeature('Touches') || !b.hasFeature('Touches'))
    console.error('wasTouchedWithin requires Touches');
  // if either is inert, no touches are possible
  if (a.isInert || b.isInert) return false;
  // Look at touch table
  let wasTouched = false;

  const atouch = a
    .getFeatProp('Touches', 'didTouchDict')
    .getItem(b.blueprint.name);
  if (atouch && atouch.value) wasTouched = true;
  const btouch = b
    .getFeatProp('Touches', 'didTouchDict')
    .getItem(a.blueprint.name);
  if (btouch && btouch.value) wasTouched = true;
  return wasTouched;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('touches', (a, b) => {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  // if either is inert, no touches are possible
  if (a.isInert || b.isInert) return false;
  return a.callFeatMethod('Physics', 'intersectsWith', b);
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('touchesCenterOf', (a, b) => {
  // checks if 'a' bounds touches the center of 'b'
  if (!a.hasFeature('Physics')) return false;
  const size = 10; // size of the center box.
  const bb = {
    x: b.prop.x.value - size / 2,
    y: b.prop.y.value - size / 2,
    width: size,
    height: size
  };
  return a.callFeatMethod('Physics', 'intersectsWithBounds', boundsB);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('isCenteredOn', (a, b, distance = 5) => {
  // checks if distance between agents is less than distance
  let xs = a.prop.x.value - b.prop.x.value;
  let ys = a.prop.y.value - b.prop.y.value;
  if (Math.hypot(xs, ys) < distance) {
    return true; // touches!
  }
  return false; // doesn't touch
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('firstTouches', (a, b) => {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  // if either is inert, no touches are possible
  if (a.isInert || b.isInert) return false;
  const boundsA = a.callFeatMethod('Physics', 'getBounds');
  const boundsB = b.callFeatMethod('Physics', 'getBounds');
  const isTouching = a.callFeatMethod('Physics', 'intersectsWith', b);

  // HACK firstTouches by stuffing a Map into the agents
  // 1. Initialize if not set
  a.wasFirstTouching = a.wasFirstTouching || new Map();
  b.wasFirstTouching = b.wasFirstTouching || new Map();
  // 2. Is this a firstTouch?
  let res = false;
  if (
    isTouching &&
    !a.wasFirstTouching.get(b.id) &&
    !b.wasFirstTouching.get(a.id)
  ) {
    // they were not touching, so this is thefirst touch
    if (DBG) console.log(...PR('first touch!', a.id, b.id));
    res = true;
  }
  // 3. Save touch status
  a.wasFirstTouching.set(b.id, isTouching);
  b.wasFirstTouching.set(a.id, isTouching);

  return res;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('lastTouches', (a, b) => {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  // if either is inert, no touches are possible
  if (a.isInert || b.isInert) return false;
  const isTouching = a.callFeatMethod('Physics', 'intersectsWith', b);

  // HACK lastTouches by stuffing a Map into the agents
  // 1. Initialize if not set
  a.wasLastTouching = a.wasLastTouching || new Map();
  b.wasLastTouching = b.wasLastTouching || new Map();
  // 2. Is this a firstTouch?
  let res = false;
  if (!isTouching && a.wasLastTouching.get(b.id) && b.wasLastTouching.get(a.id)) {
    // they are not touching now, but were touching before, so this is last touch
    if (DBG) console.log(...PR('last touch!', a.id, b.id));
    res = true;
  }
  // 3. Save touch status
  a.wasLastTouching.set(b.id, isTouching);
  b.wasLastTouching.set(a.id, isTouching);

  return res;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('isCloseTo', (a, b, distance = 30) => {
  // checks if distance between agents is less than distance
  let xs = a.prop.x.value - b.prop.x.value;
  let ys = a.prop.y.value - b.prop.y.value;
  if (Math.hypot(xs, ys) < distance) {
    return true; // touches!
  }
  return false; // doesn't touch
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('sees', (a, b) => {
  // checks if b is within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSee ? a.canSee.get(b.id) : false;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
RegisterFunction('doesNotSee', (a, b) => {
  // checks if b is NOT within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSee ? !a.canSee.get(b.id) : true;
});

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via UR/APP_CONFIGURE */
function ModuleInit(/* gloop */) {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Update(frame) {
  /** HANDLE GLOBAL FILTER TESTS ***************************************************/
  /// run all the filtering tests and store results for use by Agents during
  /// their subsequent SIM/AGENTS_UPDATE phase
  GLOBAL_INTERACTIONS = [...GetAllInteractions()]; // [ [k,v], [k,v] ]
  GLOBAL_INTERACTIONS.forEach(entry => {
    const { singleTestArgs, pairTestArgs } = entry;
    if (singleTestArgs !== undefined) {
      // SINGLE AGENT TEST FILTER
      const [A, testName, ...args] = singleTestArgs;
      const [passed] = SingleAgentFilter(A, testName, ...args);
      entry.passed = passed;
    } else if (pairTestArgs !== undefined) {
      // PAIR AGENT TEST FILTER
      const [A, testName, B, ...args] = pairTestArgs;
      const [passed] = PairAgentFilter(A, testName, B, ...args);
      entry.passed = passed;
    } else {
      throw Error('malformed global_interaction entry');
    }
  });
  /** HANDLE SUBSCRIPTION EVENTS ***************************************************/
  /// handle the registered events for 'onEvent' keywords that have registered a
  /// consequent for an Agent Blueprint (the set of all Agents based on that
  /// blueprint)
  EVENT_QUEUE.forEach((event, idx) => {
    /*/
    these are all the handlers for all the registered blueprint types
    that are TOPcode[]. However, we need to get the context of each
    blueprint and run them per-agent
    /*/
    const handlers = GetScriptEventHandlers(event.type);
    handlers.forEach(h => {
      const { agentType, handler } = h;
      const agents = GetAgentsByType(agentType);
      agents.forEach(agent => {
        const ctx = { agent, [agentType]: agent };
        agent.exec(handler, ctx);
      });
    });
  });
  EVENT_QUEUE = [];
}

/// SYNCHRONOUS LIFECYCLE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('SIM/CONDITIONS_UPDATE', Update);
UR.HookPhase('UR/APP_CONFIGURE', ModuleInit);

/// ASYNCH MESSAGE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is the API for firing a system event that the onEvent keyword can
 *  listen to
 */
UR.HandleMessage('SCRIPT_EVENT', event => {
  EVENT_QUEUE.push(event);
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ModuleInit,
  Update
};
