/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore/dc-script-engine';
import {
  RegisterSingleInteraction,
  RegisterPairInteraction,
  GetInteractionResults
} from 'modules/datacore/dc-interactions';

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
      const [kw, A, testName, ...args] = unit;
      const consq = args.pop();
      const key = RegisterSingleInteraction([A, testName, ...args]);
      // return a function that will do all the things
      prog.push((agent, state) => {
        const passed = GetInteractionResults(key);
        passed.forEach(subject => {
          const ctx = { [A]: subject };
          agent.exec(consq, ctx);
        });
      });
    } else if (unit.length === 5) {
      /** PAIRED AGENTS WHEN TEST ********************************************/
      const [kw, A, testName, B, ...args] = unit;
      const consq = args.pop();
      const key = RegisterPairInteraction([A, testName, B, ...args]);
      prog.push((agent, state) => {
        const passed = GetInteractionResults(key);
        passed.forEach(pairs => {
          const [aa, bb] = pairs;
          const ctx = { [A]: aa, [B]: bb };
          agent.exec(consq, ctx);
        }); // foreach
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
