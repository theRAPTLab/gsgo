/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addFeature" command object

  addFeature featureName

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { GetFeature } from 'modules/datacore/dc-sim-data';
import { RegisterKeyword } from 'modules/datacore';
import { TokenToString } from 'script/tools/script-tokenizer';
import * as BUNDLER from 'script/tools/script-bundler';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddFeature extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addFeature');
    this.args = ['featureName:feature'];
  }

  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [, featureName] = unit;
    const feat = GetFeature(featureName as string);
    if (feat !== undefined) {
      const define = [agent => agent.addFeature(featureName as string)];
      BUNDLER.AddToProgramOut(define, 'define');
    }
    return [];
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
    const [kwTok, featTok, ...argToks] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.agentFeatureList(featTok));
    vtoks.push(...this.shelper.extraArgsList(argToks)); // handle extra args in line
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddFeature);
RegisterKeyword(AddFeature, 'useFeature'); // compatibility
