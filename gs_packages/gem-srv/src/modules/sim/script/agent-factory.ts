/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Blueprint class holds an instance of a particular script and associated
  blueprint program for an Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// load bases
import UR from '@gemstep/ursys/client';
import Agent from 'lib/class-agent';
import Blueprint from 'lib/class-blueprint';
import {
  AGENTS_Save,
  AGENTS_Reset,
  AGENTS_GetTypeSet,
  BLUEPRINTS
} from 'modules/runtime-datacore';
import { ScriptUnit, ISMCBundle } from 'lib/t-script';
import { TProgram } from 'lib/t-smc';
/// load all keywords for blueprint use
import 'script/keywords/keyword-imports';
import * as KeywordFactory from 'script/keyword-factory';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AG-FAC');

/// BLUEPRINT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeBlueprint(units: ScriptUnit[]): ISMCBundle {
  const bp = KeywordFactory.CompileSource(units);
  const { name } = bp;
  if (BLUEPRINTS.has(name))
    console.log(...PR(`updating ${name} w/ ${units.length} lines`));
  else console.log(...PR(`new blueprint ${name} w/ ${units.length} lines`));
  BLUEPRINTS.set(name, bp);
  return bp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetBlueprint(name: string): ISMCBundle {
  name = name || 'default';
  const bdl = BLUEPRINTS.get(name);
  if (!bdl) console.warn(`blueprint '${name}' does not exist`);
  return bdl;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeAgent(agentName: string, options?: { blueprint: string }) {
  const { blueprint } = options || {};
  const agent = new Agent(agentName);
  // handle extension of base agent
  // TODO: doesn't handle recursive agent definitions
  if (blueprint !== undefined) {
    const bp = BLUEPRINTS.get(blueprint);
    if (!bp) throw Error(`agent blueprint for '${blueprint}' not defined`);

    console.log(...PR(`Making '${agentName}' w/ blueprint:'${blueprint}'`));
    agent.setBlueprint(bp);
    console.groupEnd();
  }
  return AGENTS_Save(agent);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetAgentsByType(blueprint: string) {
  return [...AGENTS_GetTypeSet(blueprint)];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ClearAllAgents() {
  AGENTS_Reset();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const AgentFactory = {
  MakeBlueprint,
  GetBlueprint,
  MakeAgent,
  GetAgentsByType,
  ClearAllAgents
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AgentFactory, KeywordFactory };
