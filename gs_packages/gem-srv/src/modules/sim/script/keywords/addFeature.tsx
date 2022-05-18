/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "addFeature" command object

  addFeature featureName

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword from 'lib/class-keyword';
import { addFeature } from 'script/ops/agent-ops';
import { GetFeature } from 'modules/datacore/dc-sim-data';
import { RegisterKeyword } from 'modules/datacore';

/// CLASS DEFINITION 1 ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class AddFeature extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('addFeature');
    this.args = ['featureName:feature'];
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit, idx: number): (TOpcode | TOpcodeErr)[] {
    const [, featureName] = unit;
    const feat = GetFeature(featureName);
    if (feat === undefined) return [[`no feature '${featureName}'`, idx]];
    const progout = [];
    progout.push(addFeature(featureName as string));
    return progout;
  }

  symbolize(unit: TScriptUnit): TSymbolData {
    const [, featureName] = unit;
    const feat = GetFeature(featureName);
    if (feat === undefined) {
      console.warn(`no feature named ${featureName}`);
      return undefined;
    }
    return { features: { [featureName as string]: feat.symbolize() } };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(AddFeature);
RegisterKeyword(AddFeature, 'useFeature'); // compatibility
