/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "propPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefProp } from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class propPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('propPush');
    this.args = ['propName:objref'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, refArg, optMethod, ...optArgs] = unit;
    const deref = K_DerefProp(refArg);
    const progout = [];
    progout.push((agent, state) => {
      const p = deref(agent, state.ctx);
      if (optMethod === undefined) state.push(p.value);
      else state.push(p[optMethod as string](...optArgs));
    });
    return progout;
  }

  /** custom validation, overriding the generic validation() method of the
   *  base Keyword class  */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, objrefTok, ...argToks] = unit; // get arg pattern
    // returns symbols for each dtok position excepting the keyword

    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.agentObjRef(objrefTok)); // agent.propName, propName, Blueprint.propName
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(propPush);
