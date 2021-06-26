/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Cursor allows PTRACK and POZYX inputs to act as cursors that can
  inhabit agents.

  This injects a "Cursor" blueprint into the model

  REQUIREMENTS:
  * Movement -- position copying is done in Movement.m_FeaturesThink

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
import { IAgent } from 'lib/t-script';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import { GetAgentById, GetAgentsByType } from 'modules/datacore/dc-agents';
import { GetGlobalAgent } from 'lib/class-gagent';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// blueprint types that can be inhabited by a cursor
const CURSOR_BLUEPRINTS = new Map(); // key = agent id, value = agent id

/// UPDATE LOOPS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// We compile cursors ONCE during SimPlaces
/// AFTER the other agent instances have been defined
/// so we know which blueprints have registered to use cursors
function m_CompileCursors() {
  let touchscripts = '';
  let whenscripts = '';
  const bpNames = Array.from(CURSOR_BLUEPRINTS.keys());
  bpNames.forEach(bpName => {
    touchscripts += `featCall Touches monitor ${bpName} c2c\n`;
    // m_UpdateInhabitAgent now handles what this 'when' script used to handle
    // Using m_UpdateInhabitAgent allows us to tie inhabiting to
    // a specific phase, eliminating the need for a 'when' script
    // that would only run for some loops and not others.
    //
    //     whenscripts += `when Cursor centerFirstTouchesCenter ${bpName} [[
    //   ifExpr {{ !Cursor.prop.isInhabitingTarget.value && ${bpName}.cursor === undefined }} [[
    //     exprPush {{ ${bpName}.id }}
    //     featPropPop Cursor.Cursor cursorTargetId
    //     featCall Cursor.Cursor bindCursor
    //     prop Cursor.isInhabitingTarget setTo true
    //   ]]
    // ]]
    // `;
  });

  const CURSOR_SCRIPT = {
    id: 'Cursor',
    label: 'Cursor',
    isCharControllable: true,
    isPozyxControllable: true,
    script: `# BLUEPRINT Cursor
# PROGRAM DEFINE
useFeature Costume
featCall Costume setCostume 'circle.json' 0
featCall Costume setColorizeHSV 1 1 1
featCall Costume randomizeColorHSV 1 0 0

useFeature Physics
featProp Physics scale setTo 0.05

useFeature Movement

useFeature Cursor

useFeature Touches
${touchscripts}

useFeature AgentWidgets
`
    // No longer used.  See not above
    // # PROGRAM UPDATE
    // ${whenscripts}
    // `
  };

  UR.RaiseMessage('INJECT_BLUEPRINT', { script: CURSOR_SCRIPT });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// This replaces the `when` script
function m_UpdateInhabitAgent(frametime) {
  // Handle the inhabiting programmatically
  const cursors = GetAgentsByType('Cursor');
  cursors.find(c => {
    if (c.prop.isInhabitingTarget.value) return false; // cursor already mapped
    // see if we're touching anyone's center
    if (c.isTouching) {
      const targetIds = [...c.isTouching.keys()];
      const targetId = targetIds.find(id => {
        // find a target that is touching...
        if (!c.isTouching.get(id).c2c) return false;
        // ... AND is not already inhabited
        const target = GetAgentById(id);
        if (target.cursor) return false; // already inhabited
        return true;
      });
      if (!targetId) return false;
      const target = GetAgentById(targetId);
      target.cursor = c;
      c.prop.isInhabitingTarget.setTo(true);
      return true;
    }
    return false;
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CursorPack extends GFeature {
  constructor(name) {
    super(name);
    this.featAddMethod('bindCursor', this.bindCursor);
    this.featAddMethod('releaseCursor', this.releaseCursor);
    UR.HandleMessage('COMPILE_CURSORS', m_CompileCursors);

    UR.HookPhase('SIM/INPUTS_EXEC', m_UpdateInhabitAgent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // /** This runs once to initialize the feature for all agents */
  // initialize(simloop) {
  //   super.initialize(simloop);
  //   simloop.hook('INPUT', frame => console.log(frame));
  // }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'cursorTargetId', new GVarString());

    CURSOR_BLUEPRINTS.set(agent.blueprint.name, agent.blueprint.name);
  }

  // `agent` in this case is usually the `Cursor` agent.
  //
  // This method is generally only used by the Cursor Feature class itself.
  // Students should not need to use this method.
  //
  // 1. First set `cursorTargetId`
  //    We need to do it this way because we can't pass an agent or agent.id
  //    as parameter values.
  // 2. Then call `bindCursor`
  bindCursor(agent: IAgent) {
    const targetAgent = GetAgentById(agent.prop.Cursor.cursorTargetId.value);
    targetAgent.cursor = agent;
  }

  // `agent` in this case is the character being bound to, rather than
  // the Cursor agent. e.g. to release a Moth, you would call
  // `featCall Moth.Cursor releaseCursor`
  releaseCursor(agent: IAgent) {
    // clear the cursor state
    if (agent.cursor) {
      agent.cursor.prop.Cursor.cursorTargetId.setTo(undefined);
      agent.cursor.prop.isInhabitingTarget.setTo(false);
      agent.cursor = undefined;
    }
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CursorPack('Cursor');
Register(INSTANCE);
