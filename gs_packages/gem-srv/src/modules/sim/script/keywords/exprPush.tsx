/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "exprPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class exprPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('exprPush');
    this.args = ['expression:expr'];
  }

  /** create smc blueprint code objects
   *  NOTE: when compile is called, all arguments have already been expanded
   *  from {{ }} to a ParseTree
   */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, expr] = unit;
    const code = [];
    code.push((agent, state) => {
      const vals = agent.exec(expr, state.ctx);
      state.push(vals);
    });
    return code;
  }
  /** custom validation, overriding the generic validation() method of the
   *  base Keyword class  */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, exprTok, ...argToks] = unit; // get arg pattern
    // returns symbols for each dtok position excepting the keyword

    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.anyExpr(exprTok));
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definiition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(exprPush);
