/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Blueprint class holds an instance of a particular script and associated
  blueprint program for an Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// load bases
import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import Blueprint from 'lib/class-blueprint';
import {
  SaveAgent,
  DeleteAllAgents,
  GetAgentsByType,
  SaveBlueprint,
  GetBlueprint
} from 'modules/runtime-datacore';
import { TScriptUnit, ISMCBundle } from 'lib/t-script';
import { TSMCProgram } from 'lib/t-script';
/// load all keywords for blueprint use
import 'script/keywords/keyword-imports';
import * as KeywordFactory from 'script/keyword-factory';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AG-FAC');

/// BLUEPRINT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function MakeBlueprint(units: TScriptUnit[]): ISMCBundle {
  const bp = KeywordFactory.CompileSource(units);
  SaveBlueprint(bp);
  return bp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeAgent(agentName: string, options?: { blueprint: string }) {
  const { blueprint } = options || {};
  const agent = new Agent(agentName);
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (blueprint !== undefined) {
    const bp = GetBlueprint(blueprint);
    if (!bp) throw Error(`agent blueprint for '${blueprint}' not defined`);

    console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bp);
    console.groupEnd();
  }
  return SaveAgent(agent);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AgentFactory = {
  MakeBlueprint,
  GetBlueprint,
  MakeAgent,
  GetAgentsByType,
  DeleteAllAgents
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AgentFactory, KeywordFactory };
