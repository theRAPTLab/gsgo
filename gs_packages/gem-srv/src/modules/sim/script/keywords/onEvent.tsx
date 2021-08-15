/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "onEvent" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
import SM_Message from 'lib/class-sm-message';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { CompilerState } from 'modules/datacore/dc-script-bundle';
import {
  RegisterKeyword,
  UtilDerefArg,
  SubscribeToScriptEvent
} from 'modules/datacore/dc-script-engine';
import { ScriptToJSX } from 'modules/sim/script/tools/script-to-jsx';

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
    SubscribeToScriptEvent(String(eventName), bundleName, consq);
    // this runs in global context inside sim-conditions
    return []; // subscriptions don't need to return any compiled code
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { event, consq } = state;
    return [this.keyword, event, consq];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, options: any, children?: any[]): any {
    const [kw, event, consq] = unit;
    const blockIndex = 2;
    if (options.parentLineIndices !== undefined) {
      // nested parentIndices!
      options.parentLineIndices = [
        ...options.parentLineIndices,
        {
          index,
          blockIndex
        }
      ];
    } else {
      options.parentLineIndices = [
        {
          index,
          blockIndex
        }
      ]; // for nested lines
    }
    const cc = ScriptToJSX(consq, options);

    const isEditable = options ? options.isEditable : false;
    const isInstanceEditor = options ? options.isInstanceEditor : false;

    if (!isInstanceEditor || isEditable) {
      return super.jsx(
        index,
        unit,
        <>
          onEvent {`'${event}'`} {cc}
        </>
      );
    }
    return super.jsxMin(
      index,
      unit,
      <>
        onEvent {`'${event}'`} (+{consq.length} lines)
      </>
    );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(onEvent);
