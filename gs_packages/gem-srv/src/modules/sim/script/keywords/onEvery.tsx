/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "onEvery" command object

  1. Compilation will define the timers.

  2. This should be placed in a `onEvent Start [[ ... ]]` block insdie a
     `# PROGRAM EVENT` pragma so that the timer setup code is run once,
     but only after the simulation starts.

     If this were placed in `# PROGRAM DEFINE` or `# PROGRAM INIT` the
     timers would start upon compile, way before the simulation starts.

  3. We subscribe to `NET:HACK_SIM_STOP` to reset the timers.
     Otherwise upon the next run, the old timers will keep running and
     new timers would be defined running in parallel with the old ones

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
const PR = UR.PrefixUtil('onEvery');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class onEvery extends Keyword {
  // base properties defined in KeywordDef
  subscribers: any[];

  constructor() {
    super('onEvery');
    this.args = ['period:number', 'consq:TMethod'];

    this.runProgs = this.runProgs.bind(this);
    this.stopProgs = this.stopProgs.bind(this);

    this.subscribers = [];

    UR.HandleMessage('NET:HACK_SIM_START', this.runProgs);
    UR.HandleMessage('NET:HACK_SIM_STOP', this.stopProgs);
  }

  runProgs() {
    if (DBG) console.log(...PR('run progs'));
  }

  stopProgs() {
    if (DBG) console.log(...PR('stopping timers'));
    this.subscribers.forEach(s => {
      s.unsubscribe();
    });
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    let [kw, period, consq] = unit;
    if (DBG) console.log('compile onEvery', kw, period, consq);

    const prog = [];
    prog.push((agent, state) => {
      const TIMER = interval(period * 1000); // new timer for each agent
      const TIMER_SUB = TIMER.subscribe(count => {
        if (DBG) console.log(...PR('count is', count));
        // timers start after sim is run
        agent.exec(consq);
      });
      this.subscribers.push(TIMER_SUB);
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
        onEvery {`'${period}'`} run {consq.length} ops
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(onEvery);
