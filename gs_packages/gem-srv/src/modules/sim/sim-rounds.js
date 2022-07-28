/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  global condition and script event manager

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { interval } from 'rxjs';
import UR from '@gemstep/ursys/client';
import * as ACRounds from 'modules/appcore/ac-rounds';
import { SM_Number } from 'modules/sim/script/vars/_all_vars';
import SM_Agent from 'lib/class-sm-agent';
import * as TRANSPILER from './script/transpiler-v2';
import ERROR from 'modules/error-mgr';

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

/// HELPER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StartRoundTimer(stopfn) {
  if (DBG) console.log(...PR('Start Timer'));
  if (!ROUND_TIMER_START_VALUE) return;

  const GLOBAL_AGENT = SM_Agent.GetGlobalAgent();

  TIMER_COUNTER = 0;
  GLOBAL_AGENT.prop.roundTime.setTo(0); // reset between rounds

  const size = 1000; // every second -- Interval size matches sim rate
  TIMER = interval(size).subscribe(count => {
    TIMER_COUNTER++;
    GLOBAL_AGENT.prop.roundTime.setTo(TIMER_COUNTER);
    RSIMSTATUS.timer = ROUND_TIMER_START_VALUE - TIMER_COUNTER;
    if (TIMER_COUNTER >= ROUND_TIMER_START_VALUE) stopfn();
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StopRoundTimer() {
  if (DBG) console.log(...PR('Stop Timer'));
  if (TIMER) TIMER.unsubscribe();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** method to run an arbitrary script within this module, in this case they
 *  are the "round initialization, stop" scripts */
function m_RunScript(scriptText) {
  if (scriptText) {
    const refs = { bundle: {}, globals: {} };
    const program = TRANSPILER.CompileText(scriptText, refs);
    const GLOBAL_AGENT = SM_Agent.GetGlobalAgent();
    GLOBAL_AGENT.exec(program, { agent: GLOBAL_AGENT });
  }
}

/// LIFECYCLE METHODS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Called api-sim during Stage() to hack-in stuff to the global agent if it
 *  doesn't exist */
function StageInit() {
  const GLOBAL_AGENT = SM_Agent.GetGlobalAgent();
  if (!GLOBAL_AGENT.hasFeature('Population'))
    GLOBAL_AGENT.addFeature('Population');
  if (!GLOBAL_AGENT.getProp('roundTime')) {
    const prop = new SM_Number();
    GLOBAL_AGENT.addProp('roundTime', prop);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** When starting a simulation run from the very beginning */
function RoundsReset() {
  ROUNDS_INDEX = -1;
  ROUNDS_COUNTER = -1;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** at api-sim NextRound(), update timers accordingly and load the next
 *  round's set of data and scripts */
function RoundInit(SIMSTATUS) {
  try {  RSIMSTATUS = SIMSTATUS;
  console.log(...PR('RoundInit!'));
  ROUNDS_INDEX++;
  ROUNDS_COUNTER++;
  const round = ACRounds.GetRoundDef(ROUNDS_INDEX);
  if (round) {
    if (round.time !== undefined) {
      ROUND_TIMER_START_VALUE = round.time;
      RSIMSTATUS.timer = ROUND_TIMER_START_VALUE;
    }
    if (round.intro) {
      const message = `Round ${ROUNDS_COUNTER + 1}: ${round.intro}`;
      UR.RaiseMessage('SHOW_MESSAGE', { message });
    }
    m_RunScript(round.initScript);
  }
  } catch (caught) {
    ERROR(`could not run round init script`, {
      source: 'runtime',
      data: {
        round,
        RSIMSTATUS,
        ROUNDS_INDEX,
        ROUNDS_COUNTER
      },
      where: 'sim-rounds.RoundInit',
      caught
    });
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** at api-sim start, start timing */
function RoundStart(stopfn) {
  m_StartRoundTimer(stopfn);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** at api-sim stop, stop counting and do some stuff */
function RoundStop() {
  try {
  console.log(...PR('RoundStop!'));
  m_StopRoundTimer();
  const round = ACRounds.GetRoundDef(ROUNDS_INDEX);
  if (round) {
    if (round.outtro) {
      const message = `End Round ${ROUNDS_COUNTER + 1}: ${round.outtro}`;
      UR.RaiseMessage('SHOW_MESSAGE', { message });
    }
    m_RunScript(round.endScript);
  }

    // Prep for Next Round

    // If there are more rounds, not complete
    if (ROUNDS_INDEX + 1 < ACRounds.GetRoundCount()) return false;

    // If rounds loop, not complete
    // (Rounds loop by default if 'noloop' is not defined or set to true)
    if (ACRounds.RoundsShouldLoop()) {
      ROUNDS_INDEX = -1;
      return false;
    }

    // No more rounds
    return true;
  } catch (caught) {
    ERROR(`could not run round stop script`, {
      source: 'runtime',
      data: {
        round,
        RSIMSTATUS,
        ROUNDS_INDEX,
        ROUNDS_COUNTER
      },
      where: 'sim-rounds.Roundstop',
      caught
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  StageInit, // called during api-sim Stage()
  RoundsReset, // called during api-sim Reset()
  RoundInit, // called during api-sim NextRound()
  RoundStart, // called during api-sim Start()
  RoundStop // called during api-sim Stop()
};
