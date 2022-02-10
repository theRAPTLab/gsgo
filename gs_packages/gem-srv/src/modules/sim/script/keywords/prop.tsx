/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "prop" keyword object

  The prop keyword is used for referencing an agent instance's property
  in either short format or context format. Both forms invoke a named
  method followed by variable arguments.

  prop [objref] [method] ...args

  * args is a variable number of arguments, which depends on the method
    being called which is defined by the type of property it is.

  * an objref has several forms
      propName
      agent.propName
      Blueprint.propName
      Feature.propName
      agent.Feature.propName
      Blueprint.propName
      Blueprint.Feature.propName

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefProp } from 'lib/class-keyword';
import {
  IAgent,
  IState,
  TOpcode,
  TScriptUnit,
  TSymbolData,
  TSymbolRefs,
  TArguments,
  TValidationToken
} from 'lib/t-script';
import { VMToken } from 'lib/t-ui';
import { RegisterKeyword, GetVarCtor } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class prop extends Keyword {
  constructor() {
    super('prop');
    this.args = ['prop:objref', 'method:method', '?:args...'];
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

  /** validate prop! note: the script tokens have been annotated through
   *  keyword.annotate() which does not need overiding in subclassers.
   *  returns array of { error?:{code,info}, symbols:TSymbolData }
   *
   *  IMPORTANT: make sure keyword.setReferences({bundle,global}) was
   *  called before validate()
   */
  validate(dtoks: TScriptUnit): TValidationToken[] | void {
    super.validate(dtoks); // do basic sanity checks
    const vtoks = []; // validation token array
    const [kw, arg_objref, arg_method, ...args] = dtoks; // get arg pattern
    // returns symbols for each dtok position excepting the keyword
    this.shelper.WIP_scopeBundle(); // initialize shelper scope
    vtoks.push(this.shelper.WIP_scopeKeywords());
    vtoks.push(this.shelper.scopeObjRef(arg_objref));
    vtoks.push(this.shelper.scopeMethod(arg_method));
    vtoks.push(...this.shelper.scopeArgs(args));

    return vtoks;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
