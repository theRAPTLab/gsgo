/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Blueprint class holds an instance of a particular script and associated
  blueprint program for an Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// load bases
import { ScriptUnit } from 'lib/t-script';
import { TProgram } from 'lib/t-smc';
/// load all keywords for blueprint use
import 'script/keywords/keyword-imports';
import * as KeywordFactory from 'script/keyword-factory';

export class Blueprint {
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
