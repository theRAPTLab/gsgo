/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addFeature" command object

  addFeature featureName

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { addFeature } from 'script/ops/agent-ops';
import { GetFeature } from 'modules/datacore/dc-sim-data';
import { RegisterKeyword, GetFeatureSymbolsFor } from 'modules/datacore';
import { TokenToString } from 'script/tools/script-tokenizer';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddFeature extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addFeature');
    this.args = ['featureName:feature'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const progout = [];
    const [, featureName] = unit;
    const feat = GetFeature(featureName as string);
    if (feat !== undefined) progout.push(addFeature(featureName as string));
    return progout;
  }

  symbolize(unit: TScriptUnit): TSymbolData {
    const featureName = TokenToString(unit[1]);
    const feat = GetFeature(featureName);
    if (feat === undefined) {
      console.warn(`no feature named ${featureName}`);
      return undefined;
    }
    return { features: { [featureName as string]: feat.symbolize() } };
  }

  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok, fnTok] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.anyFeature(fnTok));
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddFeature);
RegisterKeyword(AddFeature, 'useFeature'); // compatibility
