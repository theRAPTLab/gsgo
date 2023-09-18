/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "constantPush" command object
  Pushes a constant's value onto the stack

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefConstant } from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class constantPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('constantPush');
    this.args = ['propName:objref'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    // from exprPush
    const [kw, constantKey] = unit;
    const code = [];
    code.push((agent, state) => {
      // const vals = agent.exec(expr, state.ctx);
      console.error('constnatPush', agent, agent.getConstant[constantKey]);

      // const constants = agent.constant;
      // let vals = 'not found';
      // if (constants && constants[constantKey])
      //   vals = constants[constantKey].value;
      const constant = agent.getConstant(constantKey);
      const vals = constant ? constant.value : undefined;
      if (vals) state.push(vals);
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
    // agent.propName, propName, Blueprint.propName
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(constantPush);
