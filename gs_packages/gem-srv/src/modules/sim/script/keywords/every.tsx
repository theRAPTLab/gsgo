/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "every" command object

  IMPORTANT: DO NOT USE THIS in a 'when' BLOCK!
             It will not do what you expect!
             The prog code will run for EVERY agent of that blueprint type
             regardless of whether they match the when condition.

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
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class every extends Keyword {
  // base properties defined in KeywordDef
  EVERY_STATEMENT_ID: number;
  TIMER: any;
  COUNTER: number;
  LAST_FIRED: any;

  constructor() {
    super('every');
    this.args = ['period:number', 'consq:TMethod'];

    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);

    this.EVERY_STATEMENT_ID = 0;
    this.TIMER = {};
    this.COUNTER = 0;
    this.LAST_FIRED = new Map();

    UR.HandleMessage('NET:HACK_SIM_START', this.startTimer);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.stopTimer);
  }

  startTimer() {
    if (DBG) console.log(...PR('Start Timer'));
    // Reset Data
    this.COUNTER = 0;
    this.LAST_FIRED.clear();
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

    // EVERY_STATEMENT_ID is the number of 'every' statements in
    // the blueprint.  Since an agent might have more than one
    // 'every' statement, eacher timer has to be keyed to
    // both the unique agent and the 'every' instance.
    this.EVERY_STATEMENT_ID++;
    const frames = period * 30;
    const prog = [];
    const uid = this.EVERY_STATEMENT_ID;
    prog.push((agent, state) => {
      // Inside a 'when' loop, the prog is run whether or not
      // the when condition is met.
      // Example: Algae touches Lightbeam
      // Let's say algae01 touches Lightbeam, but algae02 does not
      // 1. for algae01, the code will run with
      //      agent     = algae01
      //      state.ctx = [Algae=algae01, Lightbeam=lightbeam01, and agent=algae01]
      // 2. for algae02, the code will also run
      //      agent     = algae02
      //      state.ctx = [Algae=algae01, Lightbeam=lightbeam01, and agent=algae01]
      // So #1 fires as expected.
      // But #2 will also fire even though the right context is passed.
      // this results in the code being applied twice to algae01 and lightbeam01
      //
      // agent is every single agent regardless of when condition
      // state.ctx contains Algae, Lightbeam, and agent (parent script agent)
      const key = `${agent.id}:${uid}`; // `${agent.id}:${this.UID}`;
      const lastFired = this.LAST_FIRED.get(key) || 0;
      const elapsed = this.COUNTER - lastFired;
      if (elapsed > frames) {
        agent.exec(consq, state.ctx);
        this.LAST_FIRED.set(key, this.COUNTER);
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
