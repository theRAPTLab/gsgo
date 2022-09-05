/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featPropPush" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
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
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, refArg, featPropName, optMethod] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = (refArg as IToken).objref || [refArg];
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
        const c = context[ref[0] as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName)[mName];
      };
    } else if (len === 3) {
      /** NEW EXTENDED REF REQUIRED ******************************************/
      /// e.g. blueprint.feature.prop
      callRef = (agent: IAgent, context: any, mName: string) => {
        const bpName = ref[0];
        const featName = ref[1];
        const propName = ref[2];
        const c = context[bpName as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        // ref[0] = blueprint, ref[1] = feature, ref[2] = prop
        // we use our own decoded propname rather than looking for the passed version
        return c.getFeatProp(featName, propName)[mName];
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    const progout = [];
    if (len === 3) {
      const [, objRef, mArgs] = unit;
      progout.push((agent, state) => {
        const methodName = optMethod !== undefined ? optMethod : 'value';
        state.push(callRef(agent, state.ctx, methodName));
      });
    } else {
      progout.push((agent, state) => {
        // console.log('callRef', callRef, agent, state.ctx, featPropName, optMethod);
        const methodName = optMethod !== undefined ? optMethod : 'value';
        state.push(callRef(agent, state.ctx, featPropName, methodName));
      });
    }
    return progout;
  }

  /** custom validation, overriding the generic validation() method of the
   *  base Keyword class  */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, fPropfTok, ...argToks] = unit; // get arg pattern
    // returns symbols for each dtok position excepting the keyword
    vtoks.push(this.shelper.anyKeyword(kwTok));
    // debugging: Also check ObjRefSelector's insertion of validation tokens
    vtoks.push(this.shelper.featObjRef(fPropfTok)); // featName.propName, agent.featName.propName, Blueprint.featName.propName
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featPropPush);
