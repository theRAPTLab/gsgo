/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test compiler

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  ExtractifyBlocks,
  ScriptifyText,
  CompileScript
} from 'script/transpiler-2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('T-COMPILER', 'TagDkOrange');
const TT = [];

/// FUNCTIONS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCompiler(index?: number) {
  if (index) console.log(...PR('running test #', index));
  else console.log(...PR('running', TT.length, 'tests'));
  TT.forEach((test, idx) => {
    if (!index || index === idx) {
      const [desc, text, verify] = test;
      const { nodes, script } = ExtractifyBlocks(text);
      const key = nodes.join('|NL|');
      const match = key === verify;
      const groupLabel = match ? desc : `*** FAILED *** ${desc}`;
      if (index) console.group(...PR(idx, groupLabel));
      else console.groupCollapsed(...PR(idx, groupLabel));
      console.log(`TEXT:\n${text}`);
      console.log('---\nBLOCKS:');
      nodes.forEach(block => console.log(block));
      console.log(`---\nKEY:\n"${key}"`);
      if (!match) console.log(`"${verify}"`);
      console.log('---\nSCRIPT (array of unit arrays):\n', script);
      console.groupEnd();
    }
  });
}

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'blueprint definition',
  `defBlueprint AgentA Agent
`.trim(),
  'defBlueprint AgentA Agent'
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'property definition and assignment',
  `
  defBlueprint Bee
    addProp time Number 10
    prop skin setTo 'happy.png'
`.trim(),
  "defBlueprint Bee|NL|addProp time Number 10|NL|prop skin setTo 'happy.png'"
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'built-in property set to expression w/ agent context',
  `
  defBlueprint Cat
    prop x setTo {{ agent.x + 1 }}
`.trim(),
  'defBlueprint Cat|NL|prop x setTo {{ agent.x + 1 }}'
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
`.trim(),
  'defBlueprint Dog|NL|A B C|NL|ifExpr {{ D }} [[|NL|E F|NL|G H|NL|]]|NL|EOB'
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
`.trim(),
  'defBlueprint Elephant|NL|A|NL|ifExpr {{ B }} [[|NL|C|NL|D|NL|]] [[|NL|E|NL|F|NL|]]|NL|EOB'
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
`.trim(),
  'defBlueprint Falcon|NL|A|NL|ifExpr {{ B }} [[|NL|C|NL|D|NL|]] [[|NL|E|NL|F|NL|]]|NL|EOB|NL|ifExpr {{ G }} [[|NL|H|NL|I|NL|]] [[|NL|J|NL|K|NL|]]|NL|EOB'
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
`.trim(),
  'defBlueprint Giraffe|NL|A|NL|ifExpr {{ B }} [[|NL|C|NL|if {{ D }} [[|NL|E|NL|]]|NL|EOB|NL|]]|NL|EOB|NL|endBlueprint'
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [inline] [inline]',
  `
  defBlueprint HorseNuts1
    ifTest [[ A ]] [[ B ]] [[ C ]]
`.trim(),
  'defBlueprint HorseNuts1|NL|ifTest [[ A ]] [[ B ]] [[ C ]]'
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
`.trim(),
  'defBlueprint HorseNuts2|NL|ifTest [[ A ]] [[ B ]] [[|NL|C {{ D }}|NL|E|NL|]]|NL|EOB'
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
`.trim(),
  'defBlueprint HorseNuts3|NL|ifTest [[ A ]] [[|NL|B|NL|C|NL|]] [[ D ]]'
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [inline] [inline]',
  `
  defBlueprint HorseNuts4
    ifTest [[
      A
    ]] [[ B ]] [[ C ]]
`.trim(),
  'defBlueprint HorseNuts4|NL|ifTest [[|NL|A|NL|]] [[ B ]] [[ C ]]'
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
`.trim(),
  "defBlueprint HorseNuts5|NL|ifTest [[|NL|prop y greaterThan 100|NL|]] [[|NL|prop skin setTo 'ok.png'|NL|]] [[ prop skin setTo 'boo.png' ]]"
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
`.trim(),
  "defBlueprint HorseNuts6|NL|ifTest [[|NL|prop y greaterThan 100|NL|]] [[|NL|prop skin setTo 'boo.png'|NL|]]|NL|EOB"
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
`.trim(),
  "defBlueprint HorseNuts7|NL|addProp altitude Number 10000|NL|ifTest [[ prop y greaterThan 100 ]] [[|NL|prop y setTo 100|NL|prop altitude setTo 10000|NL|prop skin setTo 'bonk.png'|NL|]] [[|NL|prop altitude setTo {{ agent.prop('y') * 1000 }}|NL|prop skin setTo 'flap.png'|NL|]]|NL|EOB"
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
`.trim(),
  "defBlueprint HorseNuts8|NL|addProp altitude Number 10000|NL|ifTest [[|NL|prop y greaterThan 100|NL|]] [[|NL|prop y setTo 100|NL|prop altitude setTo 10000|NL|prop skin setTo 'bonk.png'|NL|]] [[|NL|prop altitude setTo {{ agent.prop('y') * 1000 }}|NL|prop skin setTo 'flap.png'|NL|]]|NL|EOB"
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  '[block]',
  `
  defBlueprint Icicle1
    [[
      A
    ]]
`.trim(),
  'defBlueprint Icicle1|NL|[[|NL|A|NL|]]|NL|EOB'
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
`.trim(),
  'defBlueprint Icicle2|NL|[[|NL|A|NL|]]|NL|EOB|NL|[[|NL|B|NL|]]|NL|EOB'
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
  'global agent with timer',
  `
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
TestCompiler();
