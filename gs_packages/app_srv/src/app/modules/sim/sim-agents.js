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
  TestAgentExec,
  TestJitterAgents
} from '../tests/agent-functions';
import { AGENTS_GetArrayAll } from './runtime-datacore';
import SyncMap from './lib/class-syncmap';
import * as RENDERER from './display/renderer';
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
    dobj.frame = agent.prop('frame').value;
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x();
    dobj.y = agent.y();
    dobj.skin = agent.skin();
    dobj.frame = agent.prop('frame').value;
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
  console.groupCollapsed(...PR('Programming Test Agents'));
  TestAgentProgram();
  console.groupEnd();
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function AgentUpdate(frameTime) {
  // execute agent programs
  TestAgentUpdate(frameTime);

  // TEMP HACK: force the agents to move outside of programming
  // by diddling their properties directly
  // also see renderer.js for TestRenderParameters()
  //
  // TestJitterAgents(frameTime);

  // TEMP HACK: This should move to the DisplayListOut phase
  // force agent movement for display list testing
  //
  const agents = AGENTS_GetArrayAll();
  AGENT_TO_DOBJ.syncFromArray(agents);
  AGENT_TO_DOBJ.processSyncedObjects();
  RENDERER.UpdateModelList(AGENT_TO_DOBJ.getSyncedObjects());
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
