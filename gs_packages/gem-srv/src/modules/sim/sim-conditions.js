/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as DCENGINE from 'modules/datacore/dc-sim-resources';
import * as DCCONDS from 'modules/datacore/dc-sim-conditions';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';

import { GetGlobalAgent } from 'lib/class-gagent';
import { DistanceTo } from 'lib/util-vector';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');
const DBG = false;
const GLOBAL_AGENT = GetGlobalAgent();
let EVENT_QUEUE = [];
let GLOBAL_INTERACTIONS = [];

/// REGISTER NAMED METHODS ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DCENGINE.RegisterFunction('dies', a => {
  if (a.prop.foodLevel.value < 1) {
    console.log('dead!');
    return true;
  }
  return false;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  DEPRECATED -- This needs to be rewritten
 *                Design issue: How to designate the period?
 *
 *  wasTouchedWithin provides touch testing over time periods
 *  in contrast with the instantaneous touch tests of "touches"
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
// RegisterFunction('wasTouchedWithin', (a, b) => {
//   // make sure both objects have the Physics feature
//   if (!a.hasFeature('Physics') || !b.hasFeature('Physics'))
//     console.error('wasTouchedWithin requires Physics');
//   // make sure both objects have the Touches feature
//   if (!a.hasFeature('Touches') || !b.hasFeature('Touches'))
//     console.error('wasTouchedWithin requires Touches');
//   // if either is inert, no touches are possible
//   if (a.isInert || b.isInert) return false;
//   // Look at touch table
//   let wasTouched = false;

//   // REVIEW: This is testing whether a touched ANY agent
//   // of blueprint type b.  Is that really waht we want?
//   // Don't we want to compare specific agents?
//   const atouch = a
//     .getFeatProp('Touches', 'didTouchDict')
//     .getItem(b.blueprint.name);
//   if (atouch && atouch.value) wasTouched = true;
//   const btouch = b
//     .getFeatProp('Touches', 'didTouchDict')
//     .getItem(a.blueprint.name);
//   if (btouch && btouch.value) wasTouched = true;
//   return wasTouched;
// });
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// Show Bounding Box
// Bounds debugging ala vision cone agent.debug
//
// // debug
// // HACK This is EXPENSIVE!!!
// // Show bounding box
// const ab = a.callFeatMethod('Physics', 'getBounds');
// const apath = [
//   ab.x,
//   ab.y,
//   ab.x + ab.width,
//   ab.y,
//   ab.x + ab.width,
//   ab.y + ab.height,
//   ab.x,
//   ab.y + ab.height
// ];
// a.debug = apath;
// const bpath = [
//   bb.x,
//   bb.y,
//   bb.x + bb.width,
//   bb.y,
//   bb.x + bb.width,
//   bb.y + bb.height,
//   bb.x,
//   bb.y + bb.height
// ];
// b.debug = bpath;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Two centers are within `distance` of each other
/// NOTE: This can be used without Physics or Touches
///       This is functionally equivalent to 'centerTouchesCenter'
DCENGINE.RegisterFunction('isCenteredOn', (a, b, distance = 5) => {
  // checks if distance between agents is less than distance
  return DistanceTo(a, b) <= distance;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DCENGINE.RegisterFunction('isCloseTo', (a, b, distance = 30) => {
  // checks if distance between agents is less than distance
  // Doesn't need Physics or Touch
  return DistanceTo(a, b) <= distance;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_TouchTest(a, b, touchType) {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  const isTouching = a.isTouching ? a.isTouching.get(b.id) : false;
  // They were not touching, but now they are, so this is first touch
  return isTouching && isTouching[touchType];
}
/// a center touches b center
/// This is the Physics equivalent of `isCenteredOn`
DCENGINE.RegisterFunction('centerTouchesCenter', (a, b) => {
  return m_TouchTest(a, b, 'c2c');
});
/// a center touches b bounds
DCENGINE.RegisterFunction('centerTouches', (a, b) => {
  return m_TouchTest(a, b, 'c2b');
});
/// a bounds touches b bounds
DCENGINE.RegisterFunction('touches', (a, b) => {
  return m_TouchTest(a, b, 'b2b');
});
/// a bounds touches b bounds
DCENGINE.RegisterFunction('isInside', (a, b) => {
  return m_TouchTest(a, b, 'binb');
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_FirstTouchTest(a, b, touchType) {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics'))
    throw new Error('First Touches test needs both agents to have Physics!');
  const isTouching = a.isTouching ? a.isTouching.get(b.id) : false;
  const wasTouching = a.lastTouched ? a.lastTouched.get(b.id) : false;
  // They were not touching, but now they are, so this is first touch
  return (
    isTouching && wasTouching && isTouching[touchType] && !wasTouching[touchType]
  );
}
/// a center first touches b center
DCENGINE.RegisterFunction('centerFirstTouchesCenter', (a, b) => {
  return m_FirstTouchTest(a, b, 'c2c');
});
/// a center first touches b bounds
DCENGINE.RegisterFunction('centerFirstTouches', (a, b) => {
  return m_FirstTouchTest(a, b, 'c2b');
});
/// a bounds first touches b bounds
DCENGINE.RegisterFunction('firstTouches', (a, b) => {
  return m_FirstTouchTest(a, b, 'b2b');
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LastTouchTest(a, b, touchType) {
  // make sure both objects have the Physics feature
  if (!a.hasFeature('Physics') || !b.hasFeature('Physics')) return false;
  const isTouching = a.isTouching ? a.isTouching.get(b.id) : false;
  const wasTouching = a.lastTouched ? a.lastTouched.get(b.id) : false;
  // They were touching, but now they are not, so this is last touch
  return (
    isTouching && wasTouching && wasTouching[touchType] && !isTouching[touchType]
  );
}
/// a center last touches b center
DCENGINE.RegisterFunction('centerLastTouchesCenter', (a, b) => {
  return m_LastTouchTest(a, b, 'c2c');
});
/// a center last touches b bounds
DCENGINE.RegisterFunction('centerLastTouches', (a, b) => {
  return m_LastTouchTest(a, b, 'c2b');
});
/// a bounds last touches b bounds
DCENGINE.RegisterFunction('lastTouches', (a, b) => {
  return m_LastTouchTest(a, b, 'b2b');
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DCENGINE.RegisterFunction('sees', (a, b) => {
  // checks if b is within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSeeCone ? a.canSeeCone.get(b.id) : false;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DCENGINE.RegisterFunction('doesNotSee', (a, b) => {
  // checks if b is NOT within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSeeCone ? !a.canSeeCone.get(b.id) : true;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
DCENGINE.RegisterFunction('seesCamouflaged', (a, b) => {
  // checks if b's color relative to its background is visible to a
  // AND the color range is outside of the detectableRange
  const canSeeCone = a.canSeeCone ? !a.canSeeCone.get(b.id) : true;
  const canSeeColor = a.canSeeColor ? a.canSeeColor.get(b.id) : false;
  return canSeeCone && canSeeColor;
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
  GLOBAL_INTERACTIONS = [...DCCONDS.GetAllInteractions()]; // [ [k,v], [k,v] ]
  GLOBAL_INTERACTIONS.forEach(entry => {
    const { singleTestArgs, pairTestArgs } = entry;
    if (singleTestArgs !== undefined) {
      // SINGLE AGENT TEST FILTER
      const [A, testName, ...args] = singleTestArgs;
      const [passed] = DCCONDS.SingleAgentFilter(A, testName, ...args);
      entry.passed = passed;
    } else if (pairTestArgs !== undefined) {
      // PAIR AGENT TEST FILTER
      const [A, testName, B, ...args] = pairTestArgs;
      const [passed] = DCCONDS.PairAgentFilter(A, testName, B, ...args);
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
    const handlers = DCENGINE.GetScriptEventHandlers(event.type);
    handlers.forEach(h => {
      const { agentType, handler } = h;
      const agents = DCAGENTS.GetAgentsByType(agentType);
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
