/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test script runtime - text to script, script to program, execute in loop
  this is tested through import in Compiler.jsx

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIM from 'modules/sim/api-sim';
import * as TRANSPILER from 'script/transpiler';
import {
  DefineInstance,
  GetAllInstances,
  GetAllAgents,
  GetAgentsByType
} from 'modules/datacore/dc-agents';
import SyncMap from 'lib/class-syncmap';
import DisplayObject from 'lib/class-display-object';
import * as RENDERER from 'modules/render/api-render';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWTEST', 'TagDkOrange');
const TT = [];
const TESTNUM = undefined; // undefined for all tests

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestKeywords() {
  let text;
  let program;

  // make an agent instance for exec
  const World = TRANSPILER.MakeAgent({
    blueprint: 'World',
    name: 'global',
    init: []
  });
  // get arrays of all the pre-defined agents
  const fishes = GetAgentsByType('Fish');
  const pads = GetAgentsByType('Pad');
  const bees = GetAgentsByType('Bee');

  // test keywords
  text = `
  dbgOut Fish.x Fish.y
  `;

  // compile text
  program = TRANSPILER.CompileText(text);
  console.log(`program is ${program.length} functions long`);
  // execute program under our own agent instance
  const ctx = { Fish: fishes[0], Pad: pads[0] };
  World.exec(program, ctx, 'arg', 999); // this executes with agent=World
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeInstances() {
  let bundle = TRANSPILER.CompileBlueprint(TRANSPILER.ScriptifyText(FishAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.CompileBlueprint(TRANSPILER.ScriptifyText(PadAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.CompileBlueprint(TRANSPILER.ScriptifyText(BeeAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.CompileBlueprint(TRANSPILER.ScriptifyText(WorldAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  for (let i = 0; i < 10; i++) {
    DefineInstance({
      blueprint: 'Fish',
      name: `fish${i}`,
      init: []
    });
    DefineInstance({
      blueprint: 'Pad',
      name: `pad${i}`,
      init: []
    });
    DefineInstance({
      blueprint: 'Bee',
      name: `bee${i}`,
      init: []
    });
  }
  let instances = GetAllInstances();
  console.log(...PR('creating', instances.length, 'instances'));
  instances.forEach(i => TRANSPILER.MakeAgent(i));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FishAgent = `
# BLUEPRINT Fish
# PROGRAM DEFINE
addProp energyLevel Number 0
useFeature Costume
useFeature Movement
prop x setTo -10
prop y setTo -10
featCall Costume setCostume 'bunny.json' 1
# PROGRAM UPDATE
setProp skin 'bunny.json'
featCall Movement jitterPos -5 5
when Fish touches Algae [[
  prop Algae.foodEnergy setTo 0
  dbgOut 'fish'
]]
`;

const PadAgent = `
# BLUEPRINT Pad
# PROGRAM DEFINE
addProp foodEnergy Number 10
useFeature Costume
useFeature Movement
prop x setTo 10
prop y setTo 10
featCall Costume setCostume 'bunny.json' 2
# PROGRAM UPDATE
setProp skin 'bunny.json'
featCall Movement jitterPos -5 5
when Fish touches Algae [[
  prop agent.foodEnergy sub 10
  dbgOut 'fish' Fish.id
]]
`;

const BeeAgent = `
# BLUEPRINT Bee
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featureCall Costume setCostume 'bunny.json' 3
# PROGRAM UPDATE
setProp skin 'bunny.json'
featCall Movement jitterPos -5 5
`;

const WorldAgent = `
# BLUEPRINT World
# PROGRAM DEFINE
useFeature Costume
addProp ticker Number 0
# PROGRAM UPDATE
prop ticker add 1
`;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCondition(frameTime) {
  // console.log('condition');
}
function TestUpdate(frameTime) {
  // console.log('update');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestThink(frameTime) {
  // console.log('think');
}
function TestExec(frameTime) {
  // console.log('exec');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// if this test is imported into Compiler.jsx, SIM doesn't start until
/// SAVE BLUEPRINT is clicked. Force SIM START here
UR.SystemHook('SIM/READY', () => {
  console.log(...PR('ready'));
  SIM.Start();
  TestKeywords();
});
UR.SystemHook('SIM/PROGRAM', () => {
  console.log(...PR('program'));
  MakeInstances();
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// if this test is imported into Compiler.jdx, sim-* modules are running
/// after SIM.Start has been fired
UR.SystemHook('SIM/CONDITIONS_UPDATE', TestCondition);
UR.SystemHook('SIM/AGENTS_UPDATE', TestUpdate);
UR.SystemHook('SIM/AGENTS_THINK', TestThink);
UR.SystemHook('SIM/AGENTS_EXEC', TestExec);
