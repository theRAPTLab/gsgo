/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implementation of keyword "call", which invokes a method on an objref.
  The syntax is the same as "prop"; this might be just an alias for it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefProp } from 'lib/class-keyword';
import {
  IAgent,
  IState,
  TOpcode,
  TScriptUnit,
  TValidatedScriptUnit
} from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class callKeyword extends Keyword {
  // base featCallerties defined in KeywordDef

  constructor() {
    super('call');
    this.args = ['prop:objref', 'method:method', 'methodArgs:{...}'];
  }

  /** create smc blueprint code objects */
  compile(dtoks: TScriptUnit): TOpcode[] {
    const [kw, refArg, methodName, ...args] = dtoks;
    // create a function that will be used to dereferences the objref
    // into an actual call
    const deref = K_DerefProp(refArg);
    return [
      (agent: IAgent, state: IState) => {
        const p = deref(agent, state.ctx);
        p[methodName as string](...args);
      }
    ];
  }

  // Demo Validation
  // validate(unit: TScriptUnit): TValidatedScriptUnit {
  //   // super.validate(unit); // do basic sanity checks
  //   const vtoks = []; // validation token array
  //   const [kwTok, methodTok, ...argToks] = unit; // get arg pattern
  //   // returns symbols for each dtok position excepting the keyword
  //   vtoks.push(this.shelper.allKeywords(kwTok));
  //   vtoks.push(this.shelper.methodName(methodTok));
  //   vtoks.push(...this.shelper.argsList(argToks));
  //   const log = this._dbgValidationLog(vtoks);
  //   return { validationTokens: vtoks, validationLog: log };
  // }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(callKeyword);
