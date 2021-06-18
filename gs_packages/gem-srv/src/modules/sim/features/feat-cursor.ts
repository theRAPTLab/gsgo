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
import { InjectBlueprint } from '../../../app/pages/elements/project-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
    whenscripts += `when Cursor centerFirstTouchesCenter ${bpName} [[
  ifExpr {{ !Cursor.prop.isInhabitingTarget.value && ${bpName}.cursor === undefined }} [[
    exprPush {{ ${bpName}.id }}
    featPropPop Cursor.Cursor cursorTargetId
    featCall Cursor.Cursor bindCursor
    prop Cursor.isInhabitingTarget setTo true
  ]]
]]
`;
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

# PROGRAM UPDATE
${whenscripts}
`
  };

  console.error(CURSOR_SCRIPT);
  InjectBlueprint(CURSOR_SCRIPT);
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CursorPack extends GFeature {
  constructor(name) {
    super(name);
    UR.HandleMessage('COMPILE_CURSORS', m_CompileCursors);
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

  // 1. First set `cursorTargetId`
  //    We need to do it this way because we can't pass an agent or agent.id
  //    as parameter values.
  // 2. Then call `bindCursor`
  bindCursor(agent: IAgent) {
    const targetAgent = GetAgentById(agent.prop.Cursor.cursorTargetId.value);
    targetAgent.cursor = agent;
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CursorPack('Cursor');
Register(INSTANCE);
