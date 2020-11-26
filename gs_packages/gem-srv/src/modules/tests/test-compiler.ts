/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test compiler

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { ScriptifyText, CompileScript } from 'script/transpiler';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('T-COMPILER', 'TagDkOrange');
const TT = [];
const TESTNUM = undefined;

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler(index?: number) {
  const singleTest = typeof index === 'number';
  if (singleTest) console.log(...PR('running test #', index));
  else console.log(...PR('running', TT.length, 'tests'));
  TT.forEach((test, idx) => {
    if (!singleTest || index === idx) {
      const [desc, text] = test;
      const { script } = ScriptifyText(text);
      const bundle = CompileScript(script);
      const lead = `${idx}`.padStart(2, '0');
      if (singleTest) console.group('test', lead, '-', desc);
      else console.groupCollapsed('test', lead, '-', desc);
      console.log(`TEXT:\n${text}`);
      console.log('---\nSCRIPT:');
      script.forEach((unit, unitLine) =>
        console.log(`${unitLine}`.padStart(3, '0'), JSON.stringify(unit))
      );
      console.log('---\nBUNDLE:', bundle);
      console.groupEnd();
    }
  });
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'define Blueprint',
  `defBlueprint AgentA Agent
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'property definition and assignment',
  `
  defBlueprint Bee
  # bundle default
    addProp time Number 10
    prop skin setTo 'happy.png'
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'built-in property set to expression w/ agent context',
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
    A B C
    ifExpr {{ D }} [[
      E F
      G H
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then/else blocks',
  `
  defBlueprint Elephant
    A
    ifExpr {{ B }} [[
      C
      D
    ]] [[
      E
      F
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'two if expression then/else blocks',
  `
  defBlueprint Falcon
    A
    ifExpr {{ B }} [[
      C
      D
    ]] [[
      E
      F
    ]]
    ifExpr {{ G }} [[
      H
      I
    ]] [[
      J
      K
    ]]
`.trim()
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then w/ nested if block',
  `
  defBlueprint Giraffe
    A
    ifExpr {{ B }} [[
      C
      if {{ D }} [[
        E
      ]]
    ]]
  endBlueprint
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [inline] [inline]',
  `
  defBlueprint HorseNuts1
    ifTest [[ A ]] [[ B ]] [[ C ]]
`.trim()
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [inline] [block]',
  `
  defBlueprint HorseNuts2
    ifTest [[ A ]] [[ B ]] [[
      C {{ D }}
      E
    ]]
`.trim()
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [block] [inline]',
  `
  defBlueprint HorseNuts3
    ifTest [[ A ]] [[
      B
      C
    ]] [[ D ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [inline] [inline]',
  `
  defBlueprint HorseNuts4
    ifTest [[
      A
    ]] [[ B ]] [[ C ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [block] [inline]',
  `
  defBlueprint HorseNuts5
    ifTest [[
      prop y greaterThan 100
    ]] [[
      prop skin setTo 'ok.png'
    ]] [[ prop skin setTo 'boo.png' ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [inline] [block]',
  `
  defBlueprint HorseNuts6
    ifTest [[
      prop y greaterThan 100
    ]] [[ prop skin setTo 'ok.png' ]] [[
      prop skin setTo 'boo.png'
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [block] [block]',
  `
  defBlueprint HorseNuts7
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
  'if [block] [block] [block]',
  `
  defBlueprint HorseNuts8
    addProp altitude Number 10000
    ifTest [[
      prop y greaterThan 100
    ]] [[
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
  '[block]',
  `
  defBlueprint Icicle1
    [[
      A
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  '[block] [block]',
  `
  defBlueprint Icicle2
    [[
      A
    ]]
    [[
      B
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'aquatic example',
  `
defBlueprint JackFish
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
  when Interval 1000 [[
    prop foodLevel increment
    defCondition "memo:dead" [[
      {{ prop foodLevel < 1 }}
      prop isActive false
      prop skin setTo "dead.png"
      featureProp inputType setTo 'static'
    ]]
    defCondition "memo:worldtimer" [[
      globalAgentProp World daytime
      {{ globalAgentProp World daytime === true}}
      prop skin setTo "happy.png"
    ]]
  ]]
  endBlueprint
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'global agent with timer',
  `
  defBlueprint Klugelhorn
  defGlobalAgent Klugelhorn
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
TestCompiler(TESTNUM);
