const TT = [];

/// TESTS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TT.push([
//   'onEvent Tick then block w/ nested if',
//   `
//   # BLUEPRINT Dog2
//   # PROGRAM EVENT
//   onEvent Tick [[
//     ifExpr {{ agent.getProp('name').value==='bun0' }} [[
//       dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
//     ]]
//     setProp 'x'  0
//     setProp 'y'  0
//   ]]  `.trim()
// ]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'onEvent Tick then block w/ nested if',
  `
  # BLUEPRINT Bee AgentAAA
  # PROGRAM DEFINE
  addProp frame Number 3
  useFeature Movement
  # PROGRAM UPDATE
  prop skin setTo "bunny.json"
  featCall agent.Movement jitterPos -5 5
  # PROGRAM EVENT
  onEvent Tick [[
    ifExpr {{ agent.getProp('name').value==='bun0' }} [[
      dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
    ]]
    prop agent.x setTo  0
    prop agent.y setTo 0
  ]]
  # PROGRAM CONDITION
  when Bee sometest [[
    // dbgOut SingleTest
  ]]
  when Bee sometest Bee [[
    // dbgOut PairTest
  ]]
  `.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'define Blueprint',
  `
  # BLUEPRINT AgentA Agent
  // my comment is here
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'property definition and assignment',
  `
  # BLUEPRINT Bee
  # PROGRAM DEFINE
    addProp time Number 10
    prop skin setTo "happy.png"
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'built-in property set to expression w/ agent context',
  `
  # BLUEPRINT Cat
    prop x setTo {{ agent.x + 1 }}
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if expression then block',
  `
  # BLUEPRINT Dog
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
  # BLUEPRINT Elephant
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
  # BLUEPRINT Falcon
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
  # BLUEPRINT Giraffe
    A
    ifExpr {{ B }} [[
      C
      if {{ D }} [[
        E
      ]]
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [inline] [inline]',
  `
  # BLUEPRINT HorseNuts1
    if [[ A ]] [[ B ]] [[ C ]]
`.trim()
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [inline] [block]',
  `
  # BLUEPRINT HorseNuts2
    if [[ A ]] [[ B ]] [[
      C {{ D }}
      E
    ]]
`.trim()
]);

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [inline] [block] [inline]',
  `
  # BLUEPRINT HorseNuts3
    if [[ A ]] [[
      B
      C
    ]] [[ D ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [inline] [inline]',
  `
  # BLUEPRINT HorseNuts4
    if [[
      A
    ]] [[ B ]] [[ C ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [block] [inline]',
  `
  # BLUEPRINT HorseNuts5
    if [[
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
  # BLUEPRINT HorseNuts6
    if [[
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
  # BLUEPRINT HorseNuts7
    addProp altitude Number 10000
    if [[ prop y greaterThan 100 ]] [[
      setProp y 100
      setProp altitude 10000
      setProp skin 'bonk.png'
    ]] [[
      setProp altitude {{ agent.getProp('y') * 1000 }}
      setProp skin 'flap.png'
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  'if [block] [block] [block]',
  `
  # BLUEPRINT HorseNuts8
    addProp altitude Number 10000
    if [[
      prop y greaterThan 100
    ]] [[
      setProp y 100
      setProp altitude 10000
      setProp skin 'bonk.png'
    ]] [[
      setProp altitude {{ agent.getProp('y') * 1000 }}
      setProp skin 'flap.png'
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  '[block]',
  `
  # BLUEPRINT Icicle1
  if {{ true }} [[
      A
    ]]
`.trim()
]);
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TT.push([
  '[block] [block]',
  `
  # BLUEPRINT Icicle2
  if {{ true }} [[
      A
  ]] [[
      B
  ]]
`.trim()
]);

export default TT;
