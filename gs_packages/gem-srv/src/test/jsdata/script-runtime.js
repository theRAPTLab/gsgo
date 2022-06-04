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
prop agent.skin setTo 'bunny.json'
featCall Movement jitterPos -5 5
when Fish touches Algae [[
  prop Algae.foodEnergy setTo 0
  dbgOut 'fish'
]]
`.trim();

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
prop agent.skin setTo 'bunny.json'
featCall Movement jitterPos -5 5
when Fish touches Algae [[
  prop agent.foodEnergy sub 10
  dbgOut 'fish' Fish.id
]]
`.trim();

const BeeAgent = `
# BLUEPRINT Bee
# PROGRAM DEFINE
useFeature Costume
useFeature Movement
addProp foodLevel Number 50
featCall Costume setCostume 'bunny.json' 3
# PROGRAM UPDATE
prop agent.skin setTo 'bunny.json'
featCall Movement jitterPos -5 5
propPush agent.x
propPop agent.y
featPropPush agent.Costume.costumeName
featProp agent.Costume.costumeName setTo "aa"
dbgOut agent.Costume.costumeName
featPropPop agent.Costume.costumeName
dbgOut agent.Costume.costumeName
dbgStack
`.trim();

const WorldAgent = `
# BLUEPRINT World
# PROGRAM DEFINE
useFeature Costume
addProp ticker Number 0
# PROGRAM UPDATE
prop ticker add 1
`.trim();

export { FishAgent, PadAgent, BeeAgent, WorldAgent };
