/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

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
import { AGENTS_GetArrayAll } from './runtime-datacore';
import SyncMap from './lib/class-syncmap';
import { UpdateModelList } from './display/renderer';
import DisplayObject from './lib/class-display-object';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_AGENTS');

const AGENT_TO_DOBJ = new SyncMap('SAGT', {
  Constructor: DisplayObject,
  autoGrow: true
});

AGENT_TO_DOBJ.setObjectHandlers({
  onAdd: (agent, dobj) => {
    dobj.x = agent.x();
    dobj.y = agent.y();
    dobj.skin = agent.skin();
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x();
    dobj.y = agent.y();
    dobj.skin = agent.skin();
  }
});

/// PROGRAMMING INTERFACE /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentSelect() {
  console.log(...PR('should inspect mode and change agent settings'));
  TestAgentSelect();
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentProgram() {
  console.group(...PR('Programming Test Agents'));
  TestAgentProgram();
  console.groupEnd();
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frameTime) {
  // execute agent programs
  TestAgentUpdate(frameTime);
  // cheap testing override
  const agents = AGENTS_GetArrayAll();
  // move the agents around manually by random jiggle
  agents.forEach(agent => {
    const rx = Math.round(5 - Math.random() * 10);
    const ry = Math.round(5 - Math.random() * 10);
    const x = agent.x() + rx;
    const y = agent.y() + ry;
    agent.prop('x').value = x;
    agent.prop('y').value = y;
  });
  AGENT_TO_DOBJ.syncFromArray(agents);
  AGENT_TO_DOBJ.processSyncedObjects();
  UpdateModelList(AGENT_TO_DOBJ.getSyncedObjects());
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
  console.log(...PR('should reset all agents'));
  TestAgentReset(frameTime);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
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
