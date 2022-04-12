/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featPropPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefFeatureProp } from 'lib/class-keyword';
import { IAgent, TOpcode, IScriptUpdate, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featPropPush extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('featPropPush');
    this.args = ['featPropName:objref'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, featPropName, optMethod] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = refArg.objref || [refArg];
    const len = ref.length;

    // create a function that will be used to callReferences the objref
    // into an actual call
    let callRef;
    if (len === 1) {
      callRef = (agent: IAgent, context: any, pName: string, mName: string) => {
        // console.log('trying to get featProp', ref[0], pName, mName);
        return agent.getFeatProp(ref[0] as string, pName)[mName];
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      callRef = (agent: IAgent, context: any, pName: string, mName: string) => {
        const c = context[ref[0] as string]; // GAgent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName)[mName];
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    const progout = [];
    progout.push((agent, state) => {
      // console.log('callRef', callRef, agent, state.ctx, featPropName, optMethod);
      const methodName = optMethod !== undefined ? optMethod : 'value';

      state.push(callRef(agent, state.ctx, featPropName, methodName));
    });
    return progout;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featPropPush);
