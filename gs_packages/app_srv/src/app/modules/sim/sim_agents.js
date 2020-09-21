/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Lifecycle

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  TestAgentReset,
  TestAgentSelect,
  TestAgentProgram,
  TestAgentUpdate,
  TestAgentThink,
  TestAgentExec
} from '../tests/test-agents';

// import UR from '@gemstep/ursys/client';
const PR = UR.PrefixUtil('SIM_AGENTS');

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {
  TestAgentSelect();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  TestAgentProgram();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frameTime) {
  TestAgentUpdate(frameTime);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentThink(frameTime) {
  TestAgentThink(frameTime);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentExec(frameTime) {
  TestAgentExec(frameTime);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentReset(frameTime) {
  TestAgentReset(frameTime);
}

/// PHASE MACHINE INTERFACE ///////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM', 'RESET', AgentReset);
UR.SystemHook('SIM', 'SETMODE', AgentSelect);
UR.SystemHook('SIM', 'PROGRAM', AgentProgram);
UR.SystemHook('SIM', 'AGENTS_UPDATE', AgentUpdate);
UR.SystemHook('SIM', 'AGENTS_THINK', AgentThink);
UR.SystemHook('SIM', 'AGENTS_EXEC', AgentExec);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {};
