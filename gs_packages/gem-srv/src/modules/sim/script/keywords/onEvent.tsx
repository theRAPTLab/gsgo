/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "onEvent" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import SM_Message from 'lib/class-sm-message';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { CompilerState } from 'modules/datacore/dc-script-bundle';
import {
  RegisterKeyword,
  UtilDerefArg,
  SubscribeToScriptEvent
} from 'modules/datacore/dc-script';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class onEvent extends Keyword {
  // base properties defined in KeywordDef

  constructor() {
    super('onEvent');
    this.args = ['event:string', 'consq:smcprogram'];
  }

  compile(unit: TScriptUnit, idx?: number): TOpcode[] {
    let [kw, event, consq] = unit;
    consq = UtilDerefArg(consq);
    const { bundleName } = CompilerState();
    SubscribeToScriptEvent(event, bundleName, consq);
    // this runs in global context
    return [];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { event, consq } = state;
    return [this.keyword, event, consq];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, event, consq] = unit;
    return super.jsx(
      index,
      unit,
      <>
        onEvent {`'${event}'`} run {consq.length} ops
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(onEvent);
