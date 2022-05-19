/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Cursor allows PTRACK and POZYX inputs to act as cursors that can
  inhabit agents.

  This injects a "Cursor" blueprint into the model

  REQUIREMENTS:
  * Movement -- position copying is done in Movement.m_FeaturesThink

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import { GVarString } from 'script/vars/_all_vars';
import * as DCAGENTS from 'modules/datacore/dc-sim-agents';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatCursor');

// blueprint types that can be inhabited by a cursor
const CURSOR_BLUEPRINTS = new Map(); // key = agent id, value = agent id

/// UPDATE LOOPS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// We compile cursors ONCE during SimPlaces
/// AFTER the other agent instances have been defined
/// so we know which blueprints have registered to use cursors
function m_CompileCursors() {
  let touchscripts = '';
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

  const CURSOR_BLUEPRINT = {
    name: 'Cursor',
    scriptText: `# BLUEPRINT Cursor
# TAG isCharControllable true
# TAG isPozyxControllable true

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

// always on top
prop zIndex setTo 1000
`
  };

  UR.RaiseMessage('INJECT_BLUEPRINT', { blueprint: CURSOR_BLUEPRINT });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * On every SIM/INPUTS_EXEC
 * for every Cursor agent, if it hasn't picked up a target already,
 * and it's touching an agent, then pick it up.
 */
function m_UpdateInhabitAgent(frametime) {
  // Handle the inhabiting programmatically
  const cursors = DCAGENTS.GetAgentsByType('Cursor');
  cursors.find(c => {
    // Make sure the target still exists, if it doesn't allow pickup
    if (
      c.prop.isInhabitingTarget.value &&
      DCAGENTS.GetAgentById(c.prop.Cursor.cursorTargetId.value)
    )
      return false; // cursor already mapped

    // isTouching is not set yet
    if (!c.isTouching) return false;

    // who might we be touching?
    const targetIds = [...c.isTouching.keys()];

    // find a target that cursor is touching...
    const targetId = targetIds.find(id => {
      const isTouching = c.isTouching.get(id);
      if (isTouching && !isTouching.c2c) return false; // not touching this target

      // is touching target
      const target = DCAGENTS.GetAgentById(id);

      // if target is missing then it was probably removed even though it's still touching
      if (!target) return false;

      // if target is a cursor, ignore -- don't pick up other cursors
      if (target.blueprint.name === 'Cursor') return false;

      // if target already has cursor, it's already inhabited, so skip it
      if (target.cursor) return false;

      // found eligible target!
      return true;
    });

    // not touching anything
    if (!targetId) return false;
    // found target, set target as inhabitingTarget
    const target = DCAGENTS.GetAgentById(targetId);

    if (!target) {
      console.error(
        'Cursor: Missing target agent from uncleared isTouching condition.  This should not happen!'
      );
      return false; // probably a removed surviving moth
    }

    target.cursor = c;
    c.prop.isInhabitingTarget.setTo(true);
    c.prop.AgentWidgets.text.setTo(''); // clear label
    c.prop.statusValue.setTo(undefined); // clear meter
    c.prop.AgentWidgets.meter.setTo(undefined);
    c.prop.AgentWidgets.meterProp.setTo(undefined);
    c.prop.Cursor.cursorTargetId.setTo(targetId);
    return true;
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CursorPack extends GFeature {
  constructor(name) {
    super(name);
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

    // Make sure it has the Movement feature
    if (!agent.hasFeature('Movement')) {
      // eslint-disable-next-line no-alert
      alert(
        `Cursor control of ${agent.blueprint.name} requires the Movement feature!  Add 'useFeature Movement' to ${agent.blueprint.name} script BEFORE 'useFeature Cursor'!`
      );
    }
  }

  // `agent` in this case is the character being bound to, rather than
  // the Cursor agent. e.g. to release a Moth, you would call
  //   `featCall Moth.Cursor releaseCursor`
  // NOTE: dc-sim-agents.DeleteAgent will explicitly release the cursor when
  // an agent is deleted.
  releaseCursor(agent: IAgent) {
    // clear the cursor state
    if (agent.cursor) {
      agent.cursor.prop.Cursor.cursorTargetId.setTo(undefined);
      agent.cursor.prop.isInhabitingTarget.setTo(false);
      // restore cursor name
      agent.cursor.prop.AgentWidgets.text.setTo(agent.cursor.id);
      agent.cursor = undefined;
    }
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CursorPack('Cursor');
RegisterFeature(INSTANCE);
