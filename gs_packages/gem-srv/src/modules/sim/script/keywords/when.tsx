/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "when" command object

  Discuss with @BEN: the way that arguments are added to tests means that
  we have to be more careful about determining the form of the when clause,


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as SIMCOND from 'modules/datacore/dc-sim-conditions';
import { ERROR } from 'modules/error/api-error';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class when extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('when');
    this.args = [
      'AgentA:blueprint',
      'testName:test',
      'AgentB:blueprint',
      'testArgs:{...}',
      'consequent:block'
    ];
  }

  compile(kwArgs: TKWArguments): TOpcode[] {
    const prog = [];
    /** PAIRED AGENTS WHEN TEST ********************************************/
    const [kw, A, testName, B, ...args] = kwArgs;
    // assume the last argument is the block
    if (!Array.isArray(args) || args.length === 0)
      ERROR('compiler', { info: 'arg underflow', kwArgs });
    const consq: TSM_Method = args.pop() as TSM_Method; // this is compiled code
    // everything looks good otherwise
    const key = SIMCOND.RegisterPairInteraction([A, testName, B, ...args]);
    prog.push((agent: IAgent, state: IState) => {
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
    return prog;
  }

  symbolize(unit: TScriptUnit): TSymbolData {
    // when A test B ...args {block}
    if (unit.length === 5) {
      const [, a, , b, ...args] = unit;
      args.pop(); // last arg is consequent
      return { globals: { [a as string]: a, [b as string]: b } };
    }
    // failed match (note that the length test sucks for detecting
    // case where there are argument parameters
    return {};
  }

  /** custom validation, overriding the generic validation() method of the
   *  base Keyword class */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [
      kwTok, // anyKeyword
      aTok, // anyBlueprintName
      testTok, // anyTestName
      bTok, // anyBlueprintName
      ...argToks // test args, followed by consequent
    ] = unit; // get arg pattern
    argToks.pop(); // remove the consequent; we don't use it for validating
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.anyBlueprintName(aTok));
    vtoks.push(this.shelper.anyBlueprintName(bTok));
    vtoks.push(this.shelper.anyWhenTest(testTok)); // note that this is out of order
    // vtoks.push(this.shelper.argsList(argToks); // GS1.0 doesn't use args for tests
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
SIMDATA.RegisterKeyword(when);
