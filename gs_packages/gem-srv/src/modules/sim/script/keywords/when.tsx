/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

  Discuss with @BEN: the way that arguments are added to tests means that
  we have to be more careful about determining the form of the when clause,


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as SIMCOND from 'modules/datacore/dc-sim-conditions';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class when extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('when');
    this.args = [
      ['Agent:blueprint', 'testName:test', 'testArgs:{...}', 'consequent:block'],
      [
        'AgentA:blueprint',
        'AgentB:blueprint',
        'testName:test',
        'testArgs:{...}',
        'consequent:block'
      ]
    ];
  }

  compile(unit: TScriptUnit): TOpcode[] {
    const prog = [];
    if (unit.length < 4 || unit.length > 5) {
      prog.push(this.errLine('when: invalid number of args', idx));
      console.warn('error parsing when units <4 >5', unit);
    } else if (unit.length === 4) {
      /** SINGLE AGENT WHEN TEST *********************************************/
      const [kw, A, testName, ...args] = unit;
      const consq = args.pop();
      const key = SIMCOND.RegisterSingleInteraction([A, testName, ...args]);
      // return a function that will do all the things
      prog.push((agent, state) => {
        const passed = SIMCOND.GetInteractionResults(key);
        passed.forEach(subject => {
          const ctx = { [A as string]: subject };
          agent.exec(consq, ctx);
        });
      });
    } else if (unit.length === 5) {
      /** PAIRED AGENTS WHEN TEST ********************************************/
      const [kw, A, testName, B, ...args] = unit;
      const consq = args.pop();
      const key = SIMCOND.RegisterPairInteraction([A, testName, B, ...args]);
      prog.push((agent, state) => {
        const passed = SIMCOND.GetInteractionResults(key);
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

          const ctx = { [A as string]: aa, [B as string]: bb };
          agent.exec(consq, ctx);
        }); // foreach
      });
    }
    return prog;
  }

  symbolize(unit: TScriptUnit, line?: number): TSymbolData {
    if (line === undefined) throw Error('when.symbolize() requires arg2 line');

    // when A test [block]
    if (unit.length === 4) {
      const [, a] = unit;
      return { context: { [line]: [a as string] } };
    }
    // when A test B ..[block]
    if (unit.length === 5) {
      const [, a, , b, ...args] = unit;
      args.pop(); // last arg is consequent
      return { context: { [line]: [a as string, b as string] } };
    }
    // failed match (note that the length test sucks for detecting
    // case where there are argument parameters
    return {};
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
SIMDATA.RegisterKeyword(when);
