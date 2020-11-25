/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/quotes */
// SCRIPT UNIT DIRECT PROGRAMMING

// convert into script units manually

/*
// single agent "Fish"
// define/default program
defBlueprint Fish
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
*/

const fb = []; // fish blueprint program array

const s01 = ['defBlueprint', 'Fish'];
const s02 = ['addProp', 'foodLevel', 'Number', 50];
const s03 = ['prop', 'foodLevel', 'setMin', 0];
const s04 = ['prop', 'foodLevel', 'setMax', 100];
const s05 = ['prop', 'skin', 'setTo', 'alive.png'];
const s06 = ['useFeature', 'Movement'];
const s07 = ['featureProp', 'inputType', 'setTo', 'runtime'];
const s08 = ['featureCall', 'Movement', 'randomWalk', 15, 2];

/*
// every second decrement foodlevel
when Interval 1000
  prop foodLevel increment
  ifExpr {{ prop foodLevel < 1 }}
    [[ prop isActive false
      prop skin setTo "dead.png"
      featureProp inputType setTo 'static'
    ]]
    [[ prop isActive true
      prop skin setTo "alive.png"
      featureProp inputType setTo 'runtime
    ]]
  ifExpr {{ globalAgentProp World daytime === true}}
    prop skin setTo "happy.png"
*/

/*
const s09 = [ 'when', 'Interval', 1000,
  [ // this is a program start
    ["prop", "foodLevel", "increment"],
    ["ifExpr", "{{ prop foodLevel < 1 }}",
      [
        ["prop", "isActive", "setTo", "false"],
        ["prop", "skin", "setTo", "dead.png"],
        ["featureProp", "inputType", "setTo", "static"]
      ],
      [
        ["prop", "isActive", "setTo", "true"],
        ["prop", "skin", "setTo", "alive.png"],
        ["featureProp", "inputType", "setTo", "runtime"]
      ]
    ], // end of ifExpr
    ["ifExpr", "{{ globalAgentProp World daytime === true}}",
      [
        ["prop", "skin", "setTo", "happy.png"]
      ]
    ] // end of second ifExpr
  ] // end of consequent
]; // end of s09
*/
