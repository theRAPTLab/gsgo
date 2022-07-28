/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as SIMCOND from 'modules/datacore/dc-sim-conditions';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';

import SM_Agent from 'lib/class-sm-agent';
import { DistanceTo } from 'lib/util-vector';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');
const DBG = false;
const GLOBAL_AGENT = SM_Agent.GetGlobalAgent();
let EVENT_QUEUE = [];
let GLOBAL_INTERACTIONS = [];

/// REGISTER NAMED METHODS ////////////////////////////////////////////////////
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
// RegisterWhenTest('wasTouchedWithin', (a, b) => {
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

/// PROXIMITY TESTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Two centers are within `distance` of each other
 * NOTE: This can be used without Physics or Touches
 * This is functionally equivalent to 'centerTouchesCenter'
 */
SIMDATA.RegisterWhenTest('isCenteredOn', (a, b, distance = 5) => {
  // checks if distance between agents is less than distance
  return DistanceTo(a, b) <= distance;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SIMDATA.RegisterWhenTest('isCloseTo', (a, b, distance = 30) => {
  // checks if distance between agents is less than distance
  // Doesn't need Physics or Touch
  return DistanceTo(a, b) <= distance;
});

/// TOUCH TESTS ///////////////////////////////////////////////////////////////
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
SIMDATA.RegisterWhenTest('centerTouchesCenter', (a, b) => {
  return m_TouchTest(a, b, 'c2c');
});
/// a center touches b bounds
SIMDATA.RegisterWhenTest('centerTouches', (a, b) => {
  return m_TouchTest(a, b, 'c2b');
});
/// a bounds touches b bounds
SIMDATA.RegisterWhenTest('touches', (a, b) => {
  return m_TouchTest(a, b, 'b2b');
});
/// a bounds touches b bounds
SIMDATA.RegisterWhenTest('isInside', (a, b) => {
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
SIMDATA.RegisterWhenTest('centerFirstTouchesCenter', (a, b) => {
  return m_FirstTouchTest(a, b, 'c2c');
});
/// a center first touches b bounds
SIMDATA.RegisterWhenTest('centerFirstTouches', (a, b) => {
  return m_FirstTouchTest(a, b, 'c2b');
});
/// a bounds first touches b bounds
SIMDATA.RegisterWhenTest('firstTouches', (a, b) => {
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
SIMDATA.RegisterWhenTest('centerLastTouchesCenter', (a, b) => {
  return m_LastTouchTest(a, b, 'c2c');
});
/// a center last touches b bounds
SIMDATA.RegisterWhenTest('centerLastTouches', (a, b) => {
  return m_LastTouchTest(a, b, 'c2b');
});
/// a bounds last touches b bounds
SIMDATA.RegisterWhenTest('lastTouches', (a, b) => {
  return m_LastTouchTest(a, b, 'b2b');
});

/// VISION TESTS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SIMDATA.RegisterWhenTest('sees', (a, b) => {
  // checks if b is within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSeeCone ? a.canSeeCone.get(b.id) : false;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SIMDATA.RegisterWhenTest('doesNotSee', (a, b) => {
  // checks if b is NOT within vision cone of a
  if (!a.hasFeature('Vision') || !b.hasFeature('Costume')) return false;
  return a.canSeeCone ? !a.canSeeCone.get(b.id) : true;
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
SIMDATA.RegisterWhenTest('seesCamouflaged', (a, b) => {
  // checks if b's color relative to its background is visible to a
  // AND the color range is outside of the detectableRange
  const canSeeCone = a.canSeeCone ? !a.canSeeCone.get(b.id) : true;
  const canSeeColor = a.canSeeColor ? a.canSeeColor.get(b.id) : false;
  return canSeeCone && canSeeColor;
});

/// UPDATE METHOD HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** cycle through the interaction cache and run tests, saving the results */
function m_ProcessInteractions() {
  GLOBAL_INTERACTIONS = [...SIMCOND.GetAllInteractions()]; // [ [k,v], [k,v] ]
  GLOBAL_INTERACTIONS.forEach(entry => {
    try {
      const { singleTestArgs, pairTestArgs } = entry;
      if (singleTestArgs !== undefined) {
        // SINGLE AGENT TEST FILTER
        const [A, testName, ...args] = singleTestArgs;
        const [passed] = SIMCOND.SingleAgentFilter(A, testName, ...args);
        entry.passed = passed;
      } else if (pairTestArgs !== undefined) {
        // PAIR AGENT TEST FILTER
        const [A, testName, B, ...args] = pairTestArgs;
        const [passed] = SIMCOND.PairAgentFilter(A, testName, B, ...args);
        entry.passed = passed;
      } else {
        throw Error('malformed global_interaction entry');
      }
    } catch (caught) {
      ERROR(`could not dispatch global interaction`, {
        source: 'runtime',
        data: {
          pairTestArgs
        },
        where: 'sim-conditions.Update GLOBAL_INTERACTIONS',
        caught
      });
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** process the events in the event queue, looking up which blueprints have
 *  defined handlers for the event and sending them the consequent to
 *  execute */
function m_ProcessEventQueue() {
  EVENT_QUEUE.forEach((event, idx) => {
    /// these are all the handlers for all the registered blueprint types
    /// that are TOPcode[]. However, we need to get the context of each
    /// blueprint and run them per-agent
    try {
      const handlers = SIMDATA.GetHandlersForScriptEvent(event.type);
      handlers.forEach(h => {
        const { agentType, handler } = h;
        const agents = SIMAGENTS.GetAgentsByType(agentType);
        agents.forEach(agent => {
          const ctx = { agent, [agentType]: agent };
          agent.exec(handler, ctx);
        });
      });
    } catch (caught) {
      ERROR(`could not dispatch agent event`, {
        source: 'runtime',
        data: {
          event,
          idx
        },
        where: 'sim-conditions.Update EVENT_QUEUE',
        caught
      });
    }
  });
  EVENT_QUEUE = [];
}

/// LIFECYCLE GAMELOOP METHODS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**PHASE MACHINE: SIM/CONDITIONS_UPDATE */
UR.HookPhase('SIM/CONDITIONS_UPDATE', function Update(frame) {
  // run all the filtering tests and cache the results
  m_ProcessInteractions();
  // if there any events queued, then invoke the event handler on all
  // agents that registered for this event.
  m_ProcessEventQueue();
});

/// SCRIPT EVENT HANDLER //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is the API for publishing a system event that can be received by
 *  blueprint instance. Blueprints register the code to run in the onEvent
 *  keyword, which makes use of the data structures in SIMDATA (yeah, that
 *  is a little weird) */
UR.HandleMessage('SCRIPT_EVENT', event => {
  EVENT_QUEUE.push(event);
});

/// DUMMY REGISTRATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** call this from the importing module to ensure that it is not tree-shaken
 *  out by webpack and never initializes */
function Register(parent) {
  if (DBG) console.log(...PR('MESSAGE EXCHANGE API LOADED'), parent);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  Register
};
