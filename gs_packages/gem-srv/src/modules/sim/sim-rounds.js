/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GetAgentsByType } from 'modules/datacore/dc-agents';
import { GetRoundDef } from 'modules/datacore/dc-project';
import { GetGlobalAgent } from 'lib/class-gagent';
import SM_State from 'lib/class-sm-state';
import * as TRANSPILER from './script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_ROUNDS');
const DBG = false;
const GLOBAL_AGENT = GetGlobalAgent();

let ROUNDS_COUNTER = -1;

/// HELPER METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CURRENTLY NOT USED: Using GlobalAgent exec instead.
/** Copied from class-gagent.ts.
 *  Execute agent stack machine program. Note that commander also
 *  implements ExecSMC to run arbitrary programs as well when
 *  processing AgentSets. Optionally pass a stack to reuse.
 *  @param {TSMCProgram} program
 */
function exec_smc(program, ctx, ...args) {
  const state = new SM_State([...args], ctx);
  program.forEach((op, index) => {
    if (typeof op !== 'function')
      console.warn(`op is not a function, got ${typeof op}`, op);
    op(this, state);
  });
  // return the stack as a result, though
  return state.stack;
}

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** invoked via UR/APP_CONFIGURE */
function ModuleInit(/* gloop */) {
  GLOBAL_AGENT.addFeature('Population');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RunScript(scriptUnits) {
  if (scriptUnits) {
    const program = TRANSPILER.CompileText(scriptUnits);
    GLOBAL_AGENT.exec(program, { agent: GLOBAL_AGENT });

    // ALTERNATIVE METHOD using exec_smc, but this has context problems.
    // const ctx = { agent: GLOBAL_AGENT, global: GLOBAL_AGENT };
    // if (program) exec_smc(program, ctx);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundInit() {
  console.log(...PR('RoundInit!'));
  ROUNDS_COUNTER++;
  const round = GetRoundDef(ROUNDS_COUNTER);
  if (round) RunScript(round.initScript);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RoundStop() {
  console.log(...PR('RoundStop!'));
  const round = GetRoundDef(ROUNDS_COUNTER);
  if (round) RunScript(round.endScript);
}

/// SYNCHRONOUS LIFECYCLE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('UR/APP_CONFIGURE', ModuleInit);

/// ASYNCH MESSAGE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is the API for firing a system event that the onEvent keyword can
 *  listen to
 */
UR.HandleMessage('SCRIPT_EVENT', event => {
  if (event.type === 'RoundInit') RoundInit();
  // if (event.type === 'Costumes') Costumes(); // future costume script?
  if (event.type === 'RoundStop') RoundStop();
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  ModuleInit
};
