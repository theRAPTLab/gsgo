/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featCall" keyword object

  The featCall keyword is used for invoking a method that is defined as
  one of an agent's GFeatures (e.g. Costume).

  FORM 1: prop x methodName args
  FORM 2: prop agent.x methodName args
          prop Bee.x methodName args

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featCall extends Keyword {
  // base featCallerties defined in KeywordDef

  constructor() {
    super('featCall');
    this.args = ['refArg:object', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
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
        return agent.callFeatMethod(ref[0], mName, ...prms);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      callRef = (agent: IAgent, context: any, mName: string, ...prms) => {
        const c = context[ref[0]];
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return agent.callFeatMethod(ref[0], mName, ...prms);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        callRef(agent, state.ctx, methodName, ...args);
      }
    ];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { featCallName, methodName, ...args } = state;
    return [this.keyword, featCallName, ...args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, ref, methodName, ...arg] = unit;
    return super.jsx(
      index,
      unit,
      <>
        featCall {ref}.{methodName}({arg.join(' ')})
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featCall);
