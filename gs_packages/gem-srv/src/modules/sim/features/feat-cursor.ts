/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Cursor allows PTRACK and POZYX inputs to act as cursors that can
  inhabit agents.

  This injects a "Cursor" blueprint into the model

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
import { IAgent } from 'lib/t-script';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import { GetGlobalAgent } from 'lib/class-gagent';
import { InjectBlueprint } from '../../../app/pages/elements/project-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class CursorPack extends GFeature {
  constructor(name) {
    super(name);
    this.featAddMethod('allowControl', this.allowControl);
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
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// GLOBAL AGENT

  allowControl(agent: IAgent, bpName: string) {
    // REVIEW: How do we allow support of multiple agents?

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

useFeature Touches
featCall Touches monitor ${bpName} c2c

useFeature AgentWidgets

# PROGRAM UPDATE
when Cursor centerFirstTouchesCenter ${bpName} [[
  ifExpr {{ !Cursor.prop.isInhabitingTarget.value }} [[
    exprPush {{ ${bpName}.id }}
    featPropPop Cursor.Movement cursorTargetId
    featCall Cursor.Movement bindCursor
    prop Cursor.isInhabitingTarget setTo true
  ]]
]]
`
    };
    InjectBlueprint(CURSOR_SCRIPT);
  }
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new CursorPack('Cursor');
Register(INSTANCE);
