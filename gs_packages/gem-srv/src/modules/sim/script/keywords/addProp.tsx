/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of "addProp" keyword command object

  addProp propertyName propertyType initialValue

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { RegisterKeyword, GetPropTypeCtor } from 'modules/datacore';
import { TokenToString } from 'script/tools/script-tokenizer';
import * as BUNDLER from 'script/tools/script-bundler';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addProp');
    this.args = ['propName:{string}', 'type:propType', 'initValue:{value}'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [, propName, propType, initValue] = unit;
    const propCtor = GetPropTypeCtor(propType as TSLit);
    const define = [
      (agent: IAgent) =>
        agent.addProp(propName as string, new propCtor(initValue))
    ];
    BUNDLER.AddToProgramOut(define, 'define');
    return [];
  }

  /** return symbol structure for this keyword */
  symbolize(unit: TScriptUnit): TSymbolData {
    const [kwTok, pnTok, typeTok, ivalTok] = unit;
    if (pnTok === undefined) return {};
    if (typeTok === undefined) return {};
    const propName = TokenToString(pnTok);
    const propType = TokenToString(typeTok) as TSLit;
    const propClass = GetPropTypeCtor(propType);
    if (propClass === undefined) {
      console.warn('addProp unrecognized propType', propType);
      return {};
    }
    const propClassSymbols = propClass.Symbols;
    if (propClassSymbols === undefined) {
      console.warn('addProp symbolize missing symbols', propClass);
      return {};
    }
    return { props: { [propName as string]: propClassSymbols } };
  }

  /** custom keyword validator */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    // addProp propName number appropriateValue
    const [kwTok, pnTok, typeTok, ivalTok, ...argToks] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.simplePropName(pnTok));
    vtoks.push(this.shelper.anyPropType(typeTok));
    vtoks.push(this.shelper.propTypeInitialValue(ivalTok));
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddProp);
