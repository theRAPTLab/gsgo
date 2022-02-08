/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Implementation of keyword "call", which invokes a method on an objref.
  The syntax is the same as "prop"; this might be just an alias for it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
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
    this.args = ['prop:objref', 'methodName:string', '?:args...'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit, idx: number): TOpcode[] {
    const [kw, refArg, methodName, ...args] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = refArg.objref || [refArg];
    const len = ref.length;

    // create a function that will be used to callReferences the objref
    // into an actual call
    let callRef;

    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      callRef = (agent: IAgent, context: any, mName: string, ...prms) => {
        return agent.callFeatMethod(ref[0] as string, mName, ...prms);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      callRef = (agent: IAgent, context: any, mName: string, ...prms) => {
        const c = context[ref[0] as string]; // GAgent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.callFeatMethod(ref[1], mName, ...prms);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        return callRef(agent, state.ctx, methodName, ...args);
      }
    ];
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(callKeyword);
