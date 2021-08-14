/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "every" command object

  This should be used in an UPDATE loop, e.g. in `# PROGRAM UPDATE` or `when`.
  (It will not run in a `# PROGRAM EVENT` block.)

  The code block will run every n seconds according to the period.

  If you pass the `runAtStart` option, the agent code will execute
  immediately instead of waiting until after the first period.

  You can use floating point seconds.
  It will not fire more frequently than the sim update loop cycle (33ms)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore/dc-script-engine';
import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('every');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class every extends Keyword {
  // base properties defined in KeywordDef
  EVERY_STATEMENT_ID: number;
  COUNTERS: any;
  LAST_FIRED: any;

  constructor() {
    super('every');
    this.args = ['period:number', ',,,args'];

    this.EVERY_STATEMENT_ID = 0;
    this.COUNTERS = new Map();
    this.LAST_FIRED = new Map();
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    let [kw, period, ...args] = unit;
    let runAtStart = '';
    let consq;
    if (args.length > 1) {
      runAtStart = String(args[0]);
      consq = args[1];
    } else {
      consq = args[0];
    }
    if (DBG) console.log(...PR('compile every', kw, period, runAtStart, consq));

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
    const frames = Number(period) * 30;
    const prog = [];
    const uid = this.EVERY_STATEMENT_ID;
    prog.push((agent, state) => {
      // AS OF 5/27/21 WHEN HAS A PROPOSED FIX THAT ADDRESSES THIS
      //    The program should only run if the conditional is passed
      //
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
      const counter = this.COUNTERS.get(key) || 0;
      const firstFire = this.LAST_FIRED.get(key) === undefined;
      const lastFired = this.LAST_FIRED.get(key) || 0;
      const elapsed = counter - lastFired;
      if (elapsed > frames || (runAtStart === 'runAtStart' && firstFire)) {
        agent.exec(consq, state.ctx);
        this.LAST_FIRED.set(key, counter);
      }
      this.COUNTERS.set(key, counter + 1);
    });
    return prog;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { event, period, ...args } = state;
    let runAtStart = '';
    let consq;
    if (args.length > 1) {
      runAtStart = String(args[0]);
      consq = args[1];
    } else {
      consq = args[0];
    }
    return [this.keyword, period, runAtStart, consq];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, options: any, children?: any[]): any {
    const [kw, period, ...args] = unit;
    let runAtStart = '';
    let consq;
    let blockIndex;
    if (args.length > 1) {
      runAtStart = String(args[0]);
      consq = args[1];
      blockIndex = 3; // the position in the unit array to replace <ifExpr> <expr> <conseq>
    } else {
      consq = args[0];
      blockIndex = 2;
    }
    if (options.parentLineIndices !== undefined) {
      // nested parentIndices!
      options.parentLineIndices = [
        ...options.parentLineIndices,
        {
          index,
          blockIndex
        }
      ];
    } else {
      options.parentLineIndices = [
        {
          index,
          blockIndex
        }
      ]; // for nested lines
    }
    const cc = ScriptToJSX(consq, options);
    const isEditable = options ? options.isEditable : false;
    const isInstanceEditor = options ? options.isInstanceEditor : false;

    const jsx = (
      <>
        every {`'${period}'`} {runAtStart} {cc} &ensp;
      </>
    );

    if (!isInstanceEditor || isEditable) {
      return super.jsx(index, unit, jsx);
    }
    return jsx;
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(every);
