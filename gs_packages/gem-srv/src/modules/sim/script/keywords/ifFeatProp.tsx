/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifFeatProp" command object

  `ifFeatProp Fish.Movement.movementType eq 'stop' [[ ... ]]`
  `ifFeatProp Fish.Costume.scale lt 1 [[ ... ]]`

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifFeatProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifFeatProp');
    this.args = [
      'featPropName:objref',
      'method:method',
      'methodArgs:{...}',
      'consequent:block',
      'alternate:block'
    ];
  }
  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    // 1. Deref feat prop
    //    ref is an array of strings that are fields in dot addressing
    //    like agent.x
    const [kw, refArg, methodName, arg, consq, alter] = unit;
    const ref = (refArg as IToken).objref || [refArg];
    const len = ref.length;
    //    create a function that will be used to callReferences the objref
    //    into an actual call
    let deref: Function;
    // Show useful debug output if GetFeatProp fails
    function GetFeatPropWithDebug(agent, featName, pName, mName, prms) {
      try {
        return agent.getFeatProp(featName as string, pName)[mName](...prms);
      } catch (err) {
        console.error(
          `ifFeatProp Error in line: "${kw} ${featName} ${pName} ${mName} ${prms}"`
        );
      }
    }
    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      deref = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        const featName = ref[0];
        return GetFeatPropWithDebug(agent, featName, pName, mName, prms);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      deref = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        const featName = ref[1];
        // if script refers to `character` in wizard, replace the 'character'
        // reference with `agent` during compile.  See #762
        const bpName = ref[0] === 'character' ? 'agent' : ref[0];
        const c = context[bpName as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return GetFeatPropWithDebug(c, featName, pName, mName, prms);
      };
    } else if (len === 3) {
      /** NEW EXTENDED REF REQUIRED ******************************************/
      /// e.g. blueprint.feature.prop
      deref = (agent: IAgent, context: any, mName: string, ...prms) => {
        // if script refers to `character` in wizard, replace the 'character'
        // reference with `agent` during compile.  See #762
        const bpName = ref[0] === 'character' ? 'agent' : ref[0];
        const featName = ref[1];
        const pName = ref[2];
        const c = context[bpName as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        // ref[0] = blueprint, ref[1] = feature, ref[2] = prop
        // we use our own decoded propname rather than looking for the passed version
        return GetFeatPropWithDebug(c, featName, pName, mName, prms);
      };
    } else {
      console.warn('error parse ref', ref);
      deref = () => {};
    }

    // 2. Define the call to get the test value
    let callRef: Function;
    if (len === 3) {
      const [, objRef, mName, ...mArgs] = unit;
      callRef = (agent: IAgent, state: IState) => {
        return deref(agent, state.ctx, mName, ...mArgs);
      };
    } else {
      callRef = (agent: IAgent, state: IState) => {
        return deref(agent, state.ctx, refArg, methodName, arg);
      };
    }

    // 3. Run conditionTest, then exec consq or alter
    const code = [];
    code.push((agent, state) => {
      const conditionTest = () => {
        return callRef(agent, state);
      };
      const vals = conditionTest().value;
      const result = this.utilFirstValue(vals);

      if (result && consq) agent.exec(consq, state.ctx);
      if (!result && alter) agent.exec(alter, state.ctx);
    });
    return code;
  }

  /** custom keyword validator */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok, featObjRefTok, methodTok, argToks, cnsTok, altTok] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.featObjRef(featObjRefTok)); // featName.propName, agent.featName.propName, Blueprint.featName.propName
    vtoks.push(this.shelper.methodName(methodTok));
    vtoks.push(...this.shelper.argsList([argToks]));
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
SIMDATA.RegisterKeyword(ifFeatProp);
