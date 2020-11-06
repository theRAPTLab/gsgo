/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AgentTemplate class holds an instance of a particular script and associated
  template program

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// load bases
import { ScriptUnit } from 'lib/t-script';
import { TProgram } from 'lib/t-smc';
/// load all keywords for template use
import 'script/keywords/keyword-imports';
import * as KeywordFactory from 'script/keyword-factory';

export class AgentTemplate {
  script: ScriptUnit[];
  program: TProgram;
  constructor() {
    this.script = []; // array of ScriptUnits
  }
  //
}

const AgentFactory = {};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AgentFactory, KeywordFactory };
