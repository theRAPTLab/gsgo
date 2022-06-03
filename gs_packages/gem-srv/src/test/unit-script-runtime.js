/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test script runtime - text to script, script to program, execute in loop
  this is tested through import in Compiler.jsx

  *** NEEDS UPDATING ***

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIM from 'modules/sim/api-sim';
import * as TRANSPILER from 'script/transpiler-v2';
import {
  DefineInstance,
  GetAllInstances,
  GetAllAgents,
  GetAgentsByType
} from 'modules/datacore/dc-sim-agents';
import SyncMap from 'lib/class-syncmap';
import DisplayObject from 'lib/class-display-object';
import * as RENDERER from 'modules/render/api-render';
import {
  FishAgent,
  PadAgent,
  BeeAgent,
  WorldAgent
} from './jsdata/script-runtime';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('KWTEST', 'TagTest');
const TT = [];
const TESTNUM = undefined; // undefined for all tests
const log = console.log;

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
  dbgOut Fish.x Fish.y "simple keyword test"
  `;

  // compile text
  program = TRANSPILER.CompileText(text);
  log(`program is ${program.length} functions long`);
  // execute program under our own agent instance
  const ctx = { Fish: fishes[0], Pad: pads[0] };
  World.exec(program, ctx, 'arg', 999); // this executes with agent=World
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function MakeInstances() {
  let bundle = TRANSPILER.BundleBlueprint(TRANSPILER.TextToScript(FishAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.BundleBlueprint(TRANSPILER.TextToScript(PadAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.BundleBlueprint(TRANSPILER.TextToScript(BeeAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  bundle = TRANSPILER.BundleBlueprint(TRANSPILER.TextToScript(WorldAgent));
  TRANSPILER.RegisterBlueprint(bundle);
  for (let i = 0; i < 1; i++) {
    // DefineInstance({
    //   blueprint: 'Fish',
    //   name: `fish${i}`,
    //   init: []
    // });
    // DefineInstance({
    //   blueprint: 'Pad',
    //   name: `pad${i}`,
    //   init: []
    // });
    DefineInstance({
      blueprint: 'Bee',
      name: `bee${i}`,
      init: []
    });
  }
  let instances = GetAllInstances();
  log(...PR('creating', instances.length, 'instances'));
  instances.forEach(i => TRANSPILER.MakeAgent(i));
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCondition(frameTime) {
  // log('condition');
}
function TestUpdate(frameTime) {
  // log('update');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestThink(frameTime) {
  // log('think');
}
function TestExec(frameTime) {
  // log('exec');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// if this test is imported into Compiler.jsx, SIM doesn't start until
/// SAVE BLUEPRINT is clicked. Force SIM START here
UR.HookPhase('SIM/READY', () => {
  log(...PR('ready'));
  SIM.Start();
  // TestKeywords();
});
UR.HookPhase('SIM/PROGRAM', () => {
  log(...PR('program'));
  MakeInstances();
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// if this test is imported into Compiler.jdx, sim-* modules are running
/// after SIM.Start has been fired
UR.HookPhase('SIM/CONDITIONS_UPDATE', TestCondition);
UR.HookPhase('SIM/AGENTS_UPDATE', TestUpdate);
UR.HookPhase('SIM/AGENTS_THINK', TestThink);
UR.HookPhase('SIM/AGENTS_EXEC', TestExec);
