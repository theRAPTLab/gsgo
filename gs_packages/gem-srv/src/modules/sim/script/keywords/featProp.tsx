/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featProp" keyword object

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
export class featProp extends Keyword {
  // base featProperties defined in KeywordDef

  constructor() {
    super('featProp');
    this.args = ['refArg:object', 'methodName:string', '...args'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, methodName, ...args] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = refArg.objref || [refArg];
    const len = ref.length;

    // create a function that will be used to dereferences the objref
    // into an actual call
    let deref;
    if (len === 2) {
      deref = (agent: IAgent, context: any) => {
        const p = agent.getFeatProp(ref[0], ref[1]);
        if (p === undefined)
          throw Error(`agent missing featProp '${ref[0]}.${ref[1]}`);
        return p;
      };
    } else if (len === 3) {
      deref = (agent: IAgent, context: any) => {
        const c = context[ref[0]];
        if (c === undefined) throw Error(`context missing key '${ref[0]}'`);
        const p = c.getFeatProp(ref[1], ref[2]);
        if (p === undefined) throw Error(`context missing '${ref[1]}.${ref[2]}'`);
        return p;
      };
    } else {
      console.warn('error parse ref', ref);
      deref = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        const p = deref(agent, state.ctx);
        p[methodName](...args);
      }
    ];
  }

  /** return a state object that turn react state back into source */
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
