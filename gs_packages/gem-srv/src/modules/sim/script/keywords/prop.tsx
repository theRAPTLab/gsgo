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
import Keyword, { DerefProp, JSXFieldsFromUnit } from 'lib/class-keyword';
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
    // create a function that will be used to dereferences the objref
    // into an actual call
    const deref = DerefProp(refArg);
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
    const expUnit = JSXFieldsFromUnit(unit);
    const [kw, ref, methodName, ...arg] = expUnit;
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
