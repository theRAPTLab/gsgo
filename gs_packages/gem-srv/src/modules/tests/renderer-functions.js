/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AGENT TESTS

  WORKING EXPRESSIONS

  * setting/getting properties inside an agent context
  * possibly setting/getting properties from a global context
  * writing a method as a function (agent, param)
    ..that manipulates properties and participates in the lifecycle (features)
  * writing a condition as a function that returns truthy/falsey valies
    - writing a condition as a function that returns a ValueRange
      with truthy/falsey interpretation
    - defining types with built-in conditional checks
    - chained conditions
  * accesssing a collection of agents
  * filtering a collection of agents using a condition
  * executing a method conditionally

  NEXT EXPRESSIONS

  what is an event / trigger / observable / pipe
  how do conditions relate to events and triggers

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TEST RENDER');

/// RENDERING TESTS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestRenderParameters(dobj, vobj) {
  // HACK: this should be a dobj.parm 'angle'
  vobj.turnAngle(vobj.refId % 2 ? 2 : -2);
  // HACK: this should be a dobj.parm 'scale'
  let { x } = vobj.getScale();
  x += (Math.random() - 0.5) * 0.05;
  if (x > 0.75) x = 0.5;
  if (x < 0.1) x = 0.1;
  vobj.setScale(x, x);
  // HACK: this should be part of dobj.parm 'state'
  vobj.setAlpha(0.5);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// UR.OnPhase('SIM/RESET', AgentReset);
// UR.OnPhase('SIM/SETMODE', AgentSelect);
// UR.OnPhase('SIM/PROGRAM', AgentProgram);
// UR.OnPhase('SIM/AGENTS_UPDATE', AgentUpdate);
// UR.OnPhase('SIM/AGENTS_THINK', AgentThink);
// UR.OnPhase('SIM/AGENTS_EXEC', AgentExec);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { TestRenderParameters };
