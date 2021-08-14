/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featCall" keyword object

  The featCall keyword is used for invoking a method that is defined as
  one of an agent's GFeatures (e.g. Costume).

  FORM 1: prop x methodName args
  FORM 2: prop agent.x methodName args
          prop Bee.x methodName args

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

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
        const c = context[ref[0]]; // GAgent context
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

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { featCallName, methodName, ...args } = state;
    return [this.keyword, featCallName, ...args];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, options: any, children?: any[]): any {
    const [kw, refArg, methodName, ...arg] = unit;

    // Dereference Ref ("Costume" or "Moth.Costume")
    const ref = refArg.objref || [refArg];
    const len = ref.length;
    let refDisplay = '';
    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      refDisplay = `${ref[0]}`;
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      refDisplay = `${ref[0]}.${ref[1]}`;
    }

    // look for blocks in arg
    // clean up args
    // The actual blockIndex will be argIndex + 3
    // since we have to count <kw> <refArg> <methodName>
    const SYNTAX_OFFSET = 3;
    const args = arg.map((a, argIndex) => {
      if (Array.isArray(a)) {
        const blockIndex = argIndex + SYNTAX_OFFSET; // the position in the unit array to replace <ifExpr> <expr> <conseq>
        // already nested?
        if (options.parentLineIndices !== undefined) {
          // nested parentIndices!
          options.parentLineIndices = [
            ...options.parentLineIndices,
            { index, blockIndex }
          ];
        } else {
          options.parentLineIndices = [{ index, blockIndex }]; // for nested lines
        }
        return <div key={blockIndex}>{ScriptToJSX(a, options)}</div>;
      }
      return a;
    });

    const isEditable = options ? options.isEditable : false;
    const isInstanceEditor = options ? options.isInstanceEditor : false;

    if (!isInstanceEditor || isEditable) {
      return super.jsx(
        index,
        unit,
        <>
          featCall {refDisplay}.{methodName} {[...args]}
        </>
      );
    }
    return super.jsxMin(
      index,
      unit,
      <>
        featCall {refDisplay}.{methodName} (+{args.length} lines)
      </>
    );

    // ORIG
    // return super.jsx(
    //   index,
    //   unit,
    //   <>
    //     featCall {ref}.{methodName}({args.join(' ')})
    //   </>
    // );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featCall);
