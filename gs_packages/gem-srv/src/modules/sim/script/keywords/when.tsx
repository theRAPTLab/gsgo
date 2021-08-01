/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore/dc-script-engine';
import {
  RegisterSingleInteraction,
  RegisterPairInteraction,
  GetInteractionResults
} from 'modules/datacore/dc-interactions';
import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

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
      console.warn('error parsing when units <4 >5', unit);
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

          // PROPOSED FIX
          // Extra Test: Only run if the passed agents [aa, bb] includes the
          // current agent.  The when conditional will pass as true if ANY
          // agent passes.  So even though the current agent may not pass the
          // test, code is still run for the current agent, using the context
          // of the pair that DID patch the test.
          if (aa.id !== agent.id && bb.id !== agent.id) {
            return;
          }

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
  jsx(index: number, unit: TScriptUnit, options: any, children?: any[]): any {
    let out;
    let cc = '';
    if (unit.length < 4 || unit.length > 5) {
      const [kw] = unit;
      out = `${kw} invalid number of arguments`;
    } else if (unit.length === 4) {
      const [kw, A, testName, consq] = unit;
      if (consq && Array.isArray(consq)) {
        const blockIndex = 3; // the position in the unit array to replace <when> <agent> <testName> <conseq>
        // already nested?
        if (options.parentLineIndices !== undefined) {
          // nested parentIndices!
          options.parentLineIndices = [
            ...options.parentLineIndices,
            { index, blockIndex }
          ];
        } else {
          options.parentLineIndices = [{ index, blockIndex }]; // for nested lines
        }
        cc = ScriptToJSX(consq, options);
      }
      out = `${kw} ${A} ${testName}`;
    } else if (unit.length === 5) {
      const [kw, A, testName, B, consq] = unit;
      if (consq && Array.isArray(consq)) {
        const blockIndex = 4; // the position in the unit array to replace <when> <agent> <testName> <conseq>
        // already nested?
        if (options.parentLineIndices !== undefined) {
          // nested parentIndices!
          options.parentLineIndices = [
            ...options.parentLineIndices,
            { index, blockIndex }
          ];
        } else {
          options.parentLineIndices = [{ index, blockIndex }]; // for nested lines
        }
        cc = ScriptToJSX(consq, options);
      }
      out = `${kw} ${A} ${testName} ${B}`;
    }
    return super.jsx(
      index,
      unit,
      <>
        {out} {cc}
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(when);
