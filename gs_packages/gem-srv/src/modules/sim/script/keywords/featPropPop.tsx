/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featPropPop" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';
import SM_Agent from 'lib/class-sm-agent';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featPropPop extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('featPropPop');
    this.args = ['featureName:feature', 'featureProp:prop'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, refArg, featPropName] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = (refArg as IToken).objref || [refArg];
    const len = ref.length;

    // create a function that will be used to callReferences the objref
    // into an actual call
    let callRef;

    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      callRef = (agent: IAgent, context: any, pName: string, arg) => {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        let prop;
        if (ref[0] === 'Global') {
          prop = SM_Agent.GetGlobalAgent().getProp(pName);
        } else {
          prop = agent.getFeatProp(ref[0] as string, pName);
        }
        return prop.setTo(arg);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'character.Costume' or 'agent.Costume' or 'Bee.Costume'
      /// 2023-08 UPDATE: team requested use of `character.Costume` instead of
      ///                 `agent.Costume`, so we map `character` to `agent`
      ///                 during compile time.
      callRef = (agent: IAgent, context: any, pName: string, arg) => {
        // if script refers to `character` in wizard, replace the 'character'
        // reference with `agent` during compile.  See #762
        const bpRef = ref[0] === 'character' ? 'agent' : ref[0];
        const c = context[bpRef as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName).setTo(arg);
      };
    } else if (len === 3) {
      /** NEW EXTENDED REF REQUIRED ******************************************/
      /// e.g. blueprint.feature.prop
      callRef = (agent: IAgent, context: any, arg) => {
        // if script refers to `character` in wizard, replace the 'character'
        // reference with `agent` during compile.  See #762
        const bpName = ref[0] === 'character' ? 'agent' : ref[0];
        // const bpName = ref[0];
        const featName = ref[1];
        const propName = ref[2];
        const c = context[bpName as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        // ref[0] = blueprint, ref[1] = feature, ref[2] = prop
        // we use our own decoded propname rather than looking for the passed version
        return c.getFeatProp(featName, propName).setTo(arg);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    if (len === 3) {
      const [, objRef, mArgs] = unit;
      return [
        (agent: IAgent, state: IState) => {
          return callRef(agent, state.ctx, state.pop());
        }
      ];
    }
    return [
      (agent: IAgent, state: IState) => {
        // console.log('callRef', callRef);
        return callRef(agent, state.ctx, featPropName, state.pop());
      }
    ];
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
RegisterKeyword(featPropPop);
