/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "AddProp" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { Keyword } from 'lib/class-keyword';
import { TOpcode, TScriptUnit } from 'lib/t-script';
import { addProp } from 'script/ops/_all';
import { RegisterKeyword, GetVarCtor } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName string', 'propType string', 'initValue any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, propName, propType, initValue] = unit;
    const propCtor = GetVarCtor(propType);
    const progout = [];
    progout.push(addProp(propName, propCtor, initValue));
    return progout;
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    const { propName, propType, initValue } = state;
    return [this.keyword, propName, propType, initValue];
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, propName, propType, initValue] = unit;
    return super.jsx(
      index,
      unit,
      <>
        addProp {propName} = {initValue} :{propType}
      </>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
