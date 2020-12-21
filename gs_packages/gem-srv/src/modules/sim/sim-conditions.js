/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GetGlobalAgent } from 'lib/class-agent';
import {
  GetAllGlobalConditions,
  GetScriptEventHandlers,
  GetAgentsByType
} from 'modules/datacore';
import { Evaluate } from 'lib/expr-evaluator';
import { RegisterFunction } from 'modules/datacore/dc-programs';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');
const GLOBAL = GetGlobalAgent();
let EVENT_QUEUE = [];
let GLOBAL_COND = [];

/// TEST PROGRAMS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the old test program style (deprecated) is in tests/test-conditions.ts
RegisterFunction('dies', a => {
  if (a.prop.foodLevel.value < 1) {
    console.log('dead!');
    return true;
  }
  return false;
});
RegisterFunction('touches', (a, b) => {
  // not really a touch
  // distance is less than 10
  const distance = 10;
  let xs = a.prop.x.value - b.prop.x.value;
  let ys = a.prop.y.value - b.prop.y.value;
  if (Math.hypot(xs, ys) < distance) return true;
  return false;
});

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via UR/APP_CONFIGURE */
function ModuleInit(/* gloop */) {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via SIM/CONDITIONS_UPDATE */
function Update(frame) {
  // execute any conditions that need to run this frame in the context
  // of the global agent context
  GLOBAL_COND = [...GetAllGlobalConditions()];
  GLOBAL_COND.forEach(entry => {
    const [key, value] = entry;
    GLOBAL.exec(value);
  });
  // route any queued messages
  EVENT_QUEUE.forEach((event, idx) => {
    /* these are all the handlers for all the registered blueprint types
    that are TOPcode[]. However, we need to get the context of each
    blueprint and run them per-agent */
    const handlers = GetScriptEventHandlers(event.type);
    handlers.forEach(h => {
      const { agentType, handler } = h;
      const agents = GetAgentsByType(agentType);
      agents.forEach(agent => agent.exec(handler));
    });
  });
  EVENT_QUEUE = [];
}

/// SYNCHRONOUS LIFECYCLE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM/CONDITIONS_UPDATE', Update);
UR.SystemHook('UR/APP_CONFIGURE', ModuleInit);

/// ASYNCH MESSAGE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.RegisterMessage('SCRIPT_EVENT', event => {
  EVENT_QUEUE.push(event);
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ModuleInit,
  Update
};
