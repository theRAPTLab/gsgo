/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featProp" keyword object

  The featProp keyword is used for referencing an agent instance property
  that is controlled by a GFeature. There are two forms:

  FORM 1: featProp Costume.pose methodName args
  FORM 2: featProp agent.Costume.pose methodName args
          featProp Bee.Costume.pose methodName args

  In addition, it renders three views:

  1. Static Minimized View -- Just text.

        energyLevel: 5

  2. Instance Editor View -- A simplified view that only allows setting a
     parameter value via an input field.

        energyLevel [ 5 ] [ delete ]

  3. Script Wizard View -- A full edit view that allows different property
     selection as well as different method and value selection.

        featProp AgentWidget [ energyLevel ] [ setTo ] [ 5 ]


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class featProp extends Keyword {
  // base featProperties defined in KeywordDef

  constructor() {
    super('featProp');
    this.args = ['featPropName:objref', 'methodName:method', 'methodArgs:{...}'];
  }

  /** create smc blueprint code objects */
  compile(dtoks: TKWArguments): TOpcode[] {
    const [kw, refArg, featPropName, methodName, ...args] = dtoks;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = (refArg as IToken).objref || [refArg];
    const len = ref.length;

    // create a function that will be used to callReferences the objref
    // into an actual call
    let callRef;

    // Show useful debug output if GetFeatProp fails
    function GetFeatPropWithDebug(agent, featName, pName, mName, prms) {
      try {
        return agent.getFeatProp(featName as string, pName)[mName](...prms);
      } catch (err) {
        console.error(
          `featProp Error in line: "${kw} ${featName} ${pName} ${mName} ${prms}"`
        );
      }
    }
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
        const featName = ref[0];
        return GetFeatPropWithDebug(agent, featName, pName, mName, prms);
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
        const featName = ref[1];
        const bpName = ref[0];
        const c = context[bpName as string]; // SM_Agent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return GetFeatPropWithDebug(c, featName, pName, mName, prms);
      };
    } else if (len === 3) {
      /** NEW EXTENDED REF REQUIRED ******************************************/
      /// e.g. blueprint.feature.prop
      callRef = (agent: IAgent, context: any, mName: string, ...prms) => {
        const bpName = ref[0];
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
      callRef = () => {};
    }
    if (len === 3) {
      // Different call parameters if len===3
      const [, objRef, mName, ...mArgs] = dtoks;
      return [
        (agent: IAgent, state: IState) => {
          return callRef(agent, state.ctx, mName, ...mArgs);
        }
      ];
    }
    return [
      (agent: IAgent, state: IState) => {
        return callRef(agent, state.ctx, featPropName, methodName, ...args);
      }
    ];
  }

  /** custom validation, overriding the generic validation() method of the
   *  base Keyword class  */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const vtoks = []; // validation token array
    const [kwTok, featObjRefTok, methodTok, ...argToks] = unit; // get arg pattern
    // returns symbols for each dtok position excepting the keyword
    vtoks.push(this.shelper.anyKeyword(kwTok));
    // debugging: Also check ObjRefSelector's insertion of validation tokens
    vtoks.push(this.shelper.featObjRef(featObjRefTok)); // featName.propName, agent.featName.propName, Blueprint.featName.propName
    vtoks.push(this.shelper.methodName(methodTok));
    vtoks.push(...this.shelper.argsList(argToks));
    const log = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: log };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featProp);
