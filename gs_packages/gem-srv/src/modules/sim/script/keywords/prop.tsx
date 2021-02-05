/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "prop" keyword object

  The prop keyword is used for referencing an agent instance's property
  in either short format or context format. Both forms invoke a named
  method followed by variable arguments.

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
export class prop extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('prop');
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

    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'x' is assumed to be 'agent.x'
      deref = (agent: IAgent, context: any) => {
        const p = agent.getProp(ref[0]);
        if (p === undefined) {
          console.log('agent', agent);
          throw Error(`agent missing prop '${ref[0]}'`);
        }
        return p;
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.x' or 'Bee.x'
      deref = (agent: IAgent, context: any) => {
        const c = ref[0] === 'agent' ? agent : context[ref[0]];
        if (c === undefined) throw Error(`context missing '${ref[0]}' key`);
        const p = c.getProp(ref[1]);
        if (p === undefined) throw Error(`missing prop '${ref[1]}'`);
        return p;
      };
    } else {
      console.warn('error parse ref', ref);
      deref = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        const p = deref(agent, state.ctx, methodName, ...args);
        p[methodName](...args);
      }
    ];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { propName, methodName, ...args } = state;
    return [this.keyword, propName, ...args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, ref, methodName, ...arg] = unit;
    return super.jsx(
      index,
      unit,
      <>
        prop {ref}.{methodName}({arg.join(' ')})
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
