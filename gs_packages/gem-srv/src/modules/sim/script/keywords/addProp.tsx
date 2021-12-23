/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "AddProp" command object

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { TOpcode, TScriptUnit, TSymbolData, TSymbolArgType } from 'lib/t-script';
import { addProp } from 'script/ops/agent-ops';
import { RegisterKeyword, GetVarCtor } from 'modules/datacore';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName:string', 'propType:string', 'initValue:any'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [, propName, propType, initValue] = unit;
    const propCtor = GetVarCtor(propType as string);
    const progout = [];
    progout.push(addProp(propName as string, propCtor, initValue));
    return progout;
  }

  symbolize(unit: TScriptUnit): TSymbolData {
    const [, propName, propType] = unit;
    const propCtor = GetVarCtor(propType as string);
    return { props: { [propName as string]: propCtor } };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
