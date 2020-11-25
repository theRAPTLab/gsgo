/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test compiler

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { CompileScript, TextifyScript, ScriptifyText } from 'script/transpiler-2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('T-COMPILER', 'TagDkOrange');
const TT = [];

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler() {
  TT.forEach(test => {
    const [desc, text] = test;
    console.groupCollapsed(...PR(desc));
    console.log(`TEXT:\n${text}\n---\nPARSE:`);
    const script = ScriptifyText(text);
    console.log(`---\nSCRIPT:\n${script.join(',')}`);
    console.groupEnd();
  });
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'blueprint definition',
  `defBlueprint AgentA Agent
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'property definition and assignment',
  `
defBlueprint Bee
  addProp time Number 10
  prop skin setTo 'happy.png'
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'built-inproperty set to expression w/ agent context',
  `
defBlueprint Cat
  prop x setTo {{ agent.x + 1 }}
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then block',
  `
defBlueprint Dog
  addProp frame Number 0
  ifExpr {{ agent.x > 10 }} [[
    prop skin setTo 'happy.png'
    prop frame increment
  ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then/else blocks',
  `
defBlueprint Elephant
  addProp frame Number 0
  ifExpr {{ agent.x > 10 }} [[
    prop skin setTo 'running.png'
    prop frame increment
  ]] [[
    prop skin setTo 'sitting.png'
    prop frame decrement
  ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if test block then/else blocks',
  `
defBlueprint Falcon
  addProp altitude Number 10000
  ifTest [[ prop y greaterThan 100 ]] [[
    prop y setTo 100
    prop altitude setTo 10000
    prop skin setTo 'bonk.png'
  ]] [[
    prop altitude setTo {{ agent.prop('y') * 1000 }}
    prop skin setTo 'flap.png'
  ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then w/ nested if block',
  `
  defBlueprint Giraffe
    addProp age Number 10
    ifExpr {{ agent.name()==='Jerry' }} [[
      prop skin setTo 'jerry.png'
      if {{ agent.prop('age') > 10 }} [[
        prop skin setTo 'dead-jerry.png'
      ]]
    ]]
  endBlueprint
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'aquatic example',
  `
defBlueprint HorseFish
  addProp foodLevel Number 50
  prop foodLevel setMin 0
  prop foodLevel setMax 100
  prop skin setTo 'alive.png'
  useFeature Movement

  featureProp inputType setTo 'runtime'
  // runtime program (runs only for runtime mode?)
  featureCall Movement randomWalk 15 2

  // condition programs
  // every second decrement foodlevel
  when Interval 1000
    prop foodLevel increment
    defCondition "memo:dead"
      {{ prop foodLevel < 1 }}
      prop isActive false
      prop skin setTo "dead.png"
      featureProp inputType setTo 'static'
    defCondition "memo:worldtimer"
      globalAgentProp World daytime
      {{ globalAgentProp World daytime === true}}
      prop skin setTo "happy.png"
  endBlueprint
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  `
defGlobalAgent IglooWorld
  addProp time Number 10
  addProp daytime Boolean true
  // runtime
  // condition
  when Interval 1000
    prop time decrement
    defCondition "memo:switch"
    {{ prop time < 0 }}
    prop time setTo 10
    prop daytime invert
endBlueprint
`.trim()
]);

/// TEST CODE /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TestCompiler();
