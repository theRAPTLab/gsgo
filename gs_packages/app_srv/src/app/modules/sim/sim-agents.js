/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Agents Phase Machine Interface

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import SyncMap from 'lib/class-syncmap';
import DisplayObject from 'lib/class-display-object';
import { AGENTS_GetArrayAll } from 'modules/runtime-datacore';
import * as RENDERER from 'modules/render/api-render';
import { MakeDraggable } from 'lib/vis/draggable';
import {
  TestAgentReset,
  TestAgentSelect,
  TestAgentProgram,
  TestAgentUpdate,
  TestAgentThink,
  TestAgentExec
} from 'modules/tests/agent-functions';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('SIM_AGENTS');

const DOBJ_SYNC_AGENT = new SyncMap('AgentToDOBJ', {
  Constructor: DisplayObject,
  autoGrow: true
});

DOBJ_SYNC_AGENT.setMapFunctions({
  onAdd: (agent, dobj) => {
    dobj.x = agent.x();
    dobj.y = agent.y();
    dobj.skin = agent.skin();
    dobj.frame = agent.prop('frame').value;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
  },
  onUpdate: (agent, dobj) => {
    dobj.x = agent.x();
    dobj.y = agent.y();
    dobj.skin = agent.skin();
    dobj.frame = agent.prop('frame').value;
    dobj.mode = agent.mode();
    dobj.dragging = agent.isCaptive;
  }
});

/// CONSOLE-LEFT STATUS FAKERY ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// CONSOLE
const HCON = UR.HTMLConsoleUtil('console-left');
const FCON = UR.HTMLConsoleUtil('console-bottom');
let X = 0;
let INC = 1;
const ZIP = '=@=';
const ZIP_BLNK = ''.padEnd(ZIP.length, ' ');
UR.SystemHook('SIM', 'VIS_UPDATE', frameCount => {
  HCON.plot(`framecount: ${frameCount}`, 1);
  if (frameCount % 6) return;
  HCON.plot(ZIP_BLNK, 3, X);
  X += INC;
  HCON.plot(ZIP, 3, X);
  const XS = `${X}`.padStart(3, ' ');
  HCON.plot(`X: ${XS}`, 5);
  if (X < 1) INC = 1;
  if (X > 24) INC = -1;
  if (Math.random() > 0.5) {
    HCON.gotoRow(6);
    HCON.print(`dummy datalog: ${Math.random().toFixed(2)}`);
  }
  if (Math.random() > 0.95) HCON.clear(6);
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
  DOBJ_SYNC_AGENT.syncFromArray(agents);
  DOBJ_SYNC_AGENT.mapObjects();
  const dobjs = DOBJ_SYNC_AGENT.getMappedObjects();
  RENDERER.UpdateDisplayList(dobjs);
  FCON.plot(`GENERATOR created ${dobjs.length} DOBJs from Agents`, 0);
  FCON.plot(`NET:DISPLAY_LIST message sent ${dobjs.length} DOBJs`, 3);
  UR.SendMessage('NET:DISPLAY_LIST', dobjs);
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
