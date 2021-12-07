/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "prop" keyword object

  The prop keyword is used for referencing an agent instance's property
  in either short format or context format. Both forms invoke a named
  method followed by variable arguments.

  FORM 1: prop x methodName args
  FORM 2: prop agent.x methodName args
          prop Bee.x methodName args

  In addition, it renders three views:

  1. Static Minimized View -- Just text.

        energyLevel: 5

  2. Instance Editor View -- A simplified view that only allows setting a
     parameter value via an input field.

        energyLevel [ 5 ] [ delete ]

  3. Script Wizard View -- A full edit view that allows different property
     selection as well as different method and value selection.

        prop [ energyLevel ] [ setTo ] [ 5 ]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import DeleteIcon from '@material-ui/icons/VisibilityOff';
import UR from '@gemstep/ursys/client';
import Keyword, {
  K_DerefProp,
  K_JSXFieldsFromUnit,
  K_TextifyScriptUnitValues
} from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit, TArguments } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/helpers/page-xui-styles';
import { TextToScript } from 'modules/sim/script/tools//text-to-script';
import GVarElement from '../components/GVarElement';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class prop extends Keyword {
  // base properties defined in KeywordDef
  type: string;

  constructor() {
    super('prop');
    this.args = ['refArg:object', 'methodName:string', '...optArgs:any'];
    this.type = '';
  }

  /** create smc blueprint code objects */
  compile(dtoks: TArguments): TOpcode[] {
    const [kw, refArg, methodName, ...args] = dtoks;
    // create a function that will be used to dereferences the objref
    // into an actual call
    const deref = K_DerefProp(refArg);
    return [
      (agent: IAgent, state: IState) => {
        const p = deref(agent, state.ctx);
        p[methodName as string](...args);
      }
    ];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any): any {
    const expUnit = K_JSXFieldsFromUnit(unit);
    const [keyword, refArg, methodName, ...args] = expUnit;
    return <>{keyword}</>;
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
