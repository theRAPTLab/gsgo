/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GetTest } from 'modules/runtime-datacore';
import { GetGlobalAgent } from 'lib/class-agent';
import { Evaluate } from 'lib/script-evaluator';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_CONDITIONS');
const GLOBAL = GetGlobalAgent();

/// TEST PROGRAMS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the old test program style (deprecated) is in tests/test-conditions.ts

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via UR/APP_CONFIGURE */
function ModuleInit(/* gloop */) {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via SIM/CONDITIONS_UPDATE */
function Update(frame) {
  // console.log('condition frame update', frame);
  // const bunnyTest = GetTest('BunnyTest');
  // console.log('evaluating', Evaluate(bunnyTest, { global: GLOBAL }));
}

/// MODULE INITIALIZATION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM/CONDITIONS_UPDATE', Update);
UR.SystemHook('UR/APP_CONFIGURE', ModuleInit);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ModuleInit,
  Update
};
