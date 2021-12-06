/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "AddProp" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import Keyword from 'lib/class-keyword';
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
    const propCtor = GetVarCtor(propType as string);
    const progout = [];
    progout.push(addProp(propName as string, propCtor, initValue));
    return progout;
  }

  /** return rendered component representation */
  jsx(index: number, unit: TScriptUnit, children?: any[]): any {
    const [kw, propName, propType, initValue] = unit;
    const isEditable = children ? (children as any).isEditable : false;
    const isInstanceEditor = children
      ? (children as any).isInstanceEditor
      : false;
    if (!isInstanceEditor || isEditable) {
      return super.jsx(
        index,
        unit,
        <>
          addProp {propName} = {initValue} :{propType}
        </>
      );
    }
    return super.jsxMin(
      index,
      unit,
      <>
        {propName}: {initValue}
      </>
    );
  }
} // end of DefProp

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
