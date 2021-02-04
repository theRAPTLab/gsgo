/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import SM_Message from 'lib/class-sm-message';

import { TOpcode, TScriptUnit } from 'lib/t-script';
import {
  RegisterKeyword,
  SingleAgentFilter,
  PairAgentFilter
} from 'modules/datacore';

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
      /** SINGLE AGENT WHEN TEST *********************************************/
      const [kw, A, testName, consq] = unit;
      // return a function that will do all the things
      prog.push((agent, state) => {
        const [passed] = SingleAgentFilter(A, testName);
        passed.forEach(subject => {
          // HACK: workaround queues not remembering context in messages
          // problem is that this executes during global condition,
          // not during AGENT_UPDATE
          // sub.queueUpdateMessage(new SM_Message('QUEUE', { actions: consq }))
          const ctx = { [A]: subject };
          subject.exec(consq, ctx);
        });
        // console.log(`single test '${testName}' passed '${A}'`);
      });
    } else if (unit.length === 5) {
      /** PAIRED AGENTS WHEN TEST ********************************************/
      const [kw, A, testName, B, consq] = unit;
      prog.push((agent, state) => {
        const [passed] = PairAgentFilter(A, B, testName);
        passed.forEach(pairs => {
          const [aa, bb] = pairs;
          // HACK: workaround queues not remembering context in messages
          // problem is that this executes during global condition,
          // not during AGENT_UPDATE
          // aa.queueUpdateMessage(
          //   new SM_Message('QUEUE', { actions: consq, context: bb })
          // );
          const ctx = { [A]: aa, [B]: bb };
          aa.exec(consq, ctx);
          bb.exec(consq, ctx);
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
    let out;
    if (unit.length < 4 || unit.length > 5) {
      const [kw] = unit;
      out = `${kw} invalid number of arguments`;
    } else if (unit.length === 4) {
      const [kw, A, testName, consq] = unit;
      out = `${kw} ${A} ${testName} run ${consq.length} ops`;
    } else if (unit.length === 5) {
      const [kw, A, B, testName, consq] = unit;
      out = `${kw} ${A} ${testName} ${B} run ${consq.length} ops`;
    }
    return super.jsx(index, unit, <>{out}</>);
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(when);
