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
import { IAgent, IState, TOpcode, TArguments, IToken } from 'lib/t-script';
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
    this.args = ['featPropName:objref', 'methodName:method', 'methodArgs:{args}'];
  }

  /** create smc blueprint code objects */
  compile(dtoks: TArguments): TOpcode[] {
    const [kw, refArg, featPropName, methodName, ...args] = dtoks;
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
      callRef = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        return agent.getFeatProp(ref[0] as string, pName)[mName](...prms);
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
        const c = context[ref[0] as string]; // GAgent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName)[mName](...prms);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        return callRef(agent, state.ctx, featPropName, methodName, ...args);
      }
    ];
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featProp);
