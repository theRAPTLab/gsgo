/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featProp" keyword object

  The featProp keyword is used for referencing an agent instance property
  that is controlled by a GFeature. There are two forms:

  FORM 1: featProp Costume.pose methodName args
  FORM 2: featProp agent.Costume.pose methodName args
          featProp Bee.Costume.pose methodName args

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword, { DerefFeatureProp } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featProp extends Keyword {
  // base featProperties defined in KeywordDef

  constructor() {
    super('featProp');
    this.args = ['refArg:object', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, featPropName, methodName, ...args] = unit;
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
      callRef = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        return agent.getFeatProp(ref[0], pName)[mName](...prms);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      callRef = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        const c = context[ref[0]]; // GAgent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName)[mName](...prms);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        // console.log('callRef', callRef);
        return callRef(agent, state.ctx, featPropName, methodName, ...args);
      }
    ];

    // OLD broken method
    // const [kw, refArg, methodName, ...args] = unit;
    // const deref = DerefFeatureProp(refArg);
    // return [
    //   (agent: IAgent, state: IState) => {
    //     const p = deref(agent, state.ctx);
    //     console.error('p', p);
    //     p[methodName](...args);
    //   }
    // ];
  }

  /** return a state object that turn react state back into source */
  // REVIEW: probalby ned to pull out featPropName separately
  serialize(state: any): TScriptUnit {
    const { featPropName, methodName, ...args } = state;
    return [this.keyword, featPropName, ...args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, ref, methodName, ...arg] = unit;
    return super.jsx(
      index,
      unit,
      <>
        featProp {ref}.{methodName}({arg.join(' ')})
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featProp);
