/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of "addProp" keyword command object

  addProp propertyName propertyType initialValue

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword, GetPropTypeCtor } from 'modules/datacore';
import { TokenToString } from 'script/tools/script-tokenizer';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName:prop', 'propType:gvar', 'initValue:{value}'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [, propName, propType, initValue] = unit;
    const propCtor = GetPropTypeCtor(propType as string);
    return [
      (agent: IAgent) =>
        agent.addProp(propName as string, new propCtor(initValue))
    ];
  }

  /** return symbol structure for this keyword */
  symbolize(unit: TScriptUnit): TSymbolData {
    const propName = TokenToString(unit[1]);
    const propType = TokenToString(unit[2]);
    const propCtor = GetPropTypeCtor(propType as string);
    return { props: { [propName as string]: propCtor.Symbols } };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
