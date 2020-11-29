/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import SM_Message from 'lib/class-sm-message';

import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import {
  RegisterKeyword,
  SingleAgentFilter,
  PairAgentFilter
} from 'modules/runtime-datacore';
import { SingleAgentConditional } from 'script/conditions';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class when extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('when');
    this.args = [
      ['Agent:string', 'testName:string', 'consequent:TSMCProgram'],
      [
        'AgentA:string',
        'AgentB:string',
        'testName:string',
        'consequent:TSMCProgram'
      ]
    ];
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    const prog = [];
    if (unit.length < 4 || unit.length > 5) {
      prog.push(this.errLine('when: invalid number of args', idx));
    } else if (unit.length === 4) {
      const [kw, A, testName, consq] = unit;
      // return a function that will do all the things
      prog.push((agent, state) => {
        const [passed] = SingleAgentFilter(A, testName);
        passed.forEach(sub =>
          sub.queueUpdateMessage(new SM_Message('QUEUE', { actions: consq }))
        );
        // console.log(`single test '${testName}' passed '${A}'`);
      });
    } else if (unit.length === 5) {
      // PAIR TYPE
      const [kw, A, testName, B, consq] = unit;
      prog.push((agent, state) => {
        const [passed] = PairAgentFilter(A, B, testName);
        passed.forEach(pairs => {
          const [aa, bb] = pairs;
          aa.queueUpdateMessage(
            new SM_Message('QUEUE', { actions: consq, context: bb })
          );
          bb.queueUpdateMessage(
            new SM_Message('QUEUE', { actions: consq, context: aa })
          );
        }); // foreach
        // console.log(`pair test ${testName} passed '${A}', '${B}'`);
      });
    }
    return prog;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { min, max, floor } = state;
    return [this.keyword, min, max, floor];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const testName = unit[1];
    const conseq = unit[2];
    const alter = unit[3];
    return super.jsx(
      index,
      unit,
      <>
        on {testName} TRUE {conseq}, ELSE {alter}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(when);
