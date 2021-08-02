/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { interval } from 'rxjs';
import UR from '@gemstep/ursys/client';
import { GetAgentsByType } from 'modules/datacore/dc-agents';
import {
  GetRoundCount,
  GetRoundDef,
  RoundsShouldLoop
} from 'modules/datacore/dc-project';
import { GetGlobalAgent } from 'lib/class-gagent';
import SM_State from 'lib/class-sm-state';
import * as TRANSPILER from './script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_ROUNDS');
const DBG = false;

let ROUNDS_INDEX = -1; // index of roundDef
let ROUNDS_COUNTER = -1; // number of rounds run
// A loop may reset the index, but not the counter.

let TIMER;
let TIMER_COUNTER;
let ROUND_TIMER_START_VALUE = 0;

let RSIMSTATUS; // mapped to api-sim's SIMSTATUS

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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StartRoundTimer(stopfn) {
  if (DBG) console.log(...PR('Start Timer'));
  if (!ROUND_TIMER_START_VALUE) return;

  TIMER_COUNTER = 0;
  const size = 1000; // every second -- Interval size matches sim rate
  TIMER = interval(size).subscribe(count => {
    TIMER_COUNTER++;
    RSIMSTATUS.timer = ROUND_TIMER_START_VALUE - TIMER_COUNTER;
    if (TIMER_COUNTER >= ROUND_TIMER_START_VALUE) stopfn();
  });
}
function StopRoundTimer() {
  if (DBG) console.log(...PR('Stop Timer'));
  if (TIMER) TIMER.unsubscribe();
}
/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function StageInit() {
  const GLOBAL_AGENT = GetGlobalAgent();
  if (!GLOBAL_AGENT.hasFeature('Population'))
    GLOBAL_AGENT.addFeature('Population');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function RunScript(scriptUnits) {
  if (scriptUnits) {
    const program = TRANSPILER.CompileText(scriptUnits);
    const GLOBAL_AGENT = GetGlobalAgent();
    GLOBAL_AGENT.exec(program, { agent: GLOBAL_AGENT });

    // ALTERNATIVE METHOD using exec_smc, but this has context problems.
    // const ctx = { agent: GLOBAL_AGENT, global: GLOBAL_AGENT };
    // if (program) exec_smc(program, ctx);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RoundsReset() {
  ROUNDS_INDEX = -1;
  ROUNDS_COUNTER = -1;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RoundInit(SIMSTATUS) {
  RSIMSTATUS = SIMSTATUS;
  console.log(...PR('RoundInit!'));
  ROUNDS_INDEX++;
  ROUNDS_COUNTER++;
  const round = GetRoundDef(ROUNDS_INDEX);
  if (round) {
    if (round.time !== undefined) {
      ROUND_TIMER_START_VALUE = round.time;
      RSIMSTATUS.timer = ROUND_TIMER_START_VALUE;
      const intro = round.intro || '';
      const message = `Round ${ROUNDS_COUNTER + 1}: ${intro}`;
      UR.RaiseMessage('SHOW_MESSAGE', { message });
    }
    RunScript(round.initScript);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// 'stopfn' will be called when the timer runs out
export function RoundStart(stopfn) {
  StartRoundTimer(stopfn);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// @return true when all rounds are completed
export function RoundStop() {
  console.log(...PR('RoundStop!'));
  StopRoundTimer();
  const round = GetRoundDef(ROUNDS_INDEX);
  if (round) {
    const outtro = round.outtro || '';
    const message = `End Round ${ROUNDS_COUNTER + 1}: ${outtro}`;
    UR.RaiseMessage('SHOW_MESSAGE', { message });
    RunScript(round.endScript);
  }

  // Prep for Next Round

  // If there are more rounds, not complete
  if (ROUNDS_INDEX + 1 < GetRoundCount()) return false;

  // If rounds loop, not complete
  // (Rounds loop by default if 'noloop' is not defined or set to true)
  if (RoundsShouldLoop()) {
    ROUNDS_INDEX = -1;
    return false;
  }

  // No more rounds
  return true;
}

/// SYNCHRONOUS LIFECYCLE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// UR.HookPhase('UR/APP_CONFIGURE', ModuleInit);

/// ASYNCH MESSAGE ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is the API for firing a system event that the onEvent keyword can
 *  listen to
 */
// This is now handled via direct calls from api-sim
// UR.HandleMessage('SCRIPT_EVENT', event => {
//   if (event.type === 'RoundInit') RoundInit();
//   // if (event.type === 'Costumes') Costumes(); // future costume script?
//   if (event.type === 'RoundStop') RoundStop();
// });

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
