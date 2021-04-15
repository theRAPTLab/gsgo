/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "every" command object

  This should be run used in an UPDATE loop, e.g.
  in `# PROGRAM UPDATE` or `when`.

  The global timer will start when HACK_SIM_START
  is raised.

  The code block will run:
  1. Immediately when first called
  2. Every n seconds according to the period.

  You can use floating point seconds.
  It will not fire more frequently than the sim update loop cycle (33ms)

  Unlike "doEvery", this uses a single global timer.

  The NET:HACK_SIM_START handler (runProgs) is probably not needed.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { interval } from 'rxjs';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore/dc-script-engine';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('every');
const DBG = true;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class every extends Keyword {
  // base properties defined in KeywordDef
  TIMER: any;
  COUNTER: number;
  LAST_FIRED: any;

  constructor() {
    super('every');
    this.args = ['period:number', 'consq:TMethod'];

    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);

    this.TIMER = {};
    this.COUNTER = 0;
    this.LAST_FIRED = new Map();

    UR.HandleMessage('NET:HACK_SIM_START', this.startTimer);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.stopTimer);
  }

  startTimer() {
    if (DBG) console.log(...PR('Start Timer'));
    // Start Timer
    const size = 33; // Interval size matches sim rate
    this.TIMER = interval(size).subscribe(count => {
      this.COUNTER = count;
    });
  }

  stopTimer() {
    if (DBG) console.log(...PR('Stop Timer'));
    this.TIMER.unsubscribe();
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    let [kw, period, consq] = unit;
    if (DBG) console.log(...PR('compile every', kw, period, consq));

    // period is time to wait between runs
    // e.g. period = 1 is run 1 time every second
    // e.g. period = 5 is run 1 time every 5 seconds

    // COUNTER goes up by 1 every 33 ms.
    // e.g. COUNTER at 1 sec = 30
    // e.g. COUNTER at 5 sec = 150

    const frames = period * 30;
    const prog = [];
    prog.push((agent, state) => {
      const lastFired = this.LAST_FIRED.get(agent) || 0;
      const elapsed = this.COUNTER - lastFired;
      if (elapsed > frames) {
        agent.exec(consq, state.ctx);
        this.LAST_FIRED.set(agent, this.COUNTER);
      }
    });
    return prog;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { event: period, consq } = state;
    return [this.keyword, period, consq];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, period, consq] = unit;
    return super.jsx(
      index,
      unit,
      <>
        every {`'${period}'`} run {consq.length} ops
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(every);
