/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "onEvent" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { TSMCProgram, TOpcode, TScriptUnit } from 'lib/t-script';
import { CompilerState } from 'modules/datacore/dc-script-bundle';
import {
  RegisterKeyword,
  UtilDerefArg,
  SubscribeToScriptEvent
} from 'modules/datacore/dc-script-engine';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class onEvent extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('onEvent');
    this.args = ['eventName:string', 'consq:smcprogram'];
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    let [kw, eventName, consq] = unit;
    consq = UtilDerefArg(consq); // a program name possibly?
    const { bundleName } = CompilerState();
    SubscribeToScriptEvent(String(eventName), bundleName, consq as TSMCProgram);
    // this runs in global context inside sim-conditions
    return []; // subscriptions don't need to return any compiled code
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(onEvent);
