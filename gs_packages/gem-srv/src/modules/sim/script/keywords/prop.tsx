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
import { RegisterKeyword } from 'modules/datacore';

// use test project: aquatic-energy
const USE_NEW_DEREF = false;

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class prop extends Keyword {
  constructor() {
    super('prop');
    this.args = ['prop:objref', 'method:method', 'methodArgs:{...}'];
  }

  /** create smc blueprint code objects */
  compile(dtoks: TScriptUnit, refs: TSymbolRefs): TOpcode[] {
    const [kw, objref, methodName, ...args] = dtoks;
    /***
     * TESTING CODE
     * A "universal object reference"
     * This was an attempt to simplify GEMSCRIPT so that featCall, featProp,
     * call, and prop could all be called via a single keyword.
     * We were not quite able to get it working.
     * This will be a GEMSCRIPT 2.0 feature.
     */
    if (USE_NEW_DEREF) {
      let derefProp: Function;
      try {
        derefProp = this.derefProp(objref);
      } catch (e) {
        console.log(`%cerror: ${e.toString()}`, 'color:red;padding-left:8px');
      }
      return [
        (agent: IAgent, state: IState) => {
          const smobj = derefProp(agent, state.ctx);
          const method = smobj[methodName as string];
          if (method) method.call(agent, ...args);
        }
      ];
      /*** END of TESTING CODE ***/
    } else {
      const deref = K_DerefProp(objref);
      return [
        (agent: IAgent, state: IState) => {
          const p = deref(agent, state.ctx);
          if (p && p[methodName as string]) p[methodName as string](...args);
        }
      ];
    }
  }

  /** for GS1.0 release, we're requiring agentObjRef two-part dotted strings  */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, objrefTok, methodTok, ...argToks] = unit; // get arg pattern
    // returns symbols for each dtok position excepting the keyword
    vtoks.push(this.shelper.anyKeyword(kwTok));
    // debugging: Also check ObjRefSelector's insertion of validation tokens
    vtoks.push(this.shelper.agentObjRef(objrefTok)); // agent.propName, propName, Blueprint.propName
    vtoks.push(this.shelper.methodName(methodTok));
    vtoks.push(...this.shelper.argsList(argToks));
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
