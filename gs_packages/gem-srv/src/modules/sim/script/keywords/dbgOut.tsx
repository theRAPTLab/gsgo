/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "dbgOut" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Keyword, { K_EvalRuntimeUnitArgs } from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';
import { TokenToString } from 'script/tools/script-tokenizer';

/// KEYWORD STATIC DECLARATIONS ///////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let MAX_OUT = 1000;
let COUNTER = MAX_OUT;
UR.HandleMessage('ALL_AGENTS_PROGRAM', () => {
  console.log('DBGOUT RESET OUTPUT COUNTER to', MAX_OUT);
  COUNTER = MAX_OUT;
});
UR.HandleMessage('AGENT_PROGRAM', () => {
  console.log('DBGOUT RESET OUTPUT COUNTER to', MAX_OUT);
  COUNTER = MAX_OUT;
});
const PR = UR.PrefixUtil('DBGOUT', 'TagGreen');

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class dbgOut extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('dbgOut');
    this.args = ['*:{...}'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const progout = [];

    progout.push((agent, state) => {
      if (COUNTER-- > 0) {
        console.log(
          ...PR(...K_EvalRuntimeUnitArgs(unit.slice(1), { agent, ...state.ctx }))
        );
      }
      if (COUNTER === 0) console.log('dbgOut limiter at', MAX_OUT, 'statements');
    });
    return progout;
  }

  /** return symbol structure for this keyword */
  symbolize(unit: TScriptUnit): TSymbolData {
    const [kwTok, msgTok] = unit;
    const message = TokenToString(msgTok);
    return { unitText: message };
  }

  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok, msgTok] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.anyString(msgTok));
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(dbgOut);
