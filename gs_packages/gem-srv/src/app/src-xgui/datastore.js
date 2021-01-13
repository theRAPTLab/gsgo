/*
    A bare-bones emulation of a database
    
    This is just a bunch of JSON objects.
*/

const DB = {};

///////////////////////////////////////////////////////////////////////////////
DB.MODELS = [
  {
    id: "m1",
    label: "BeeSim",
    creationDate: 1,
    modifiedDate: 2,
  },
  {
    id: "m2",
    label: "Decomposition",
    creationDate: 1,
    modifiedDate: 2,
  },
  {
    id: "m3",
    label: "Particles",
    creationDate: 1,
    modifiedDate: 2,
    type: "shared",
  },
];

///////////////////////////////////////////////////////////////////////////////
DB.AGENTS = [
  {
    id: "a1",
    modelId: "m1",
    label: "Bee",
    properties: [
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "5", label: "energyLevel", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", label: "Movement", type: "movement", value: "useFakeTrack" },
      {
        id: "2",
        label: "Costume",
        type: "costume",
        value: 1,
        commands: {
          showCostume: {
            options: [
              { id: 0, label: "Flying Bee", path: "images/beefly.png" },
              { id: 1, label: "Resting Bee", path: "images/beerest.png" },
            ],
          },
        },
      },
      { id: "3", label: "Effect", type: "effect", value: undefined },
    ],
  },
  {
    id: "a2",
    modelId: "m1",
    label: "Flower",
    properties: [{ id: "4", type: "number", label: "nectarCount", value: 0 }],
    features: [
      {
        id: "5",
        label: "Costume",
        type: "costume",
        value: 1,
        commands: {
          showCostume: {
            options: [
              { id: 0, label: "Daisy", path: "images/daisy.png" },
              { id: 1, label: "Daffodil", path: "images/daffodil.png" },
              { id: 2, label: "Dandelion", path: "images/dandelion.png" },
            ],
          },
        },
      },
      { id: "3", label: "Effect", type: "effect", value: undefined },
    ],
  },
  {
    id: "a3",
    modelId: "m1",
    label: "Hive",
    properties: [{ id: "4", type: "number", label: "nectarCount", value: 0 }],
    features: [
      {
        id: "6",
        label: "Costume",
        type: "costume",
        value: 1,
        commands: {
          showCostume: {
            options: [{ id: 0, label: "Hive", path: "images/hive.png" }],
          },
        },
      },
      { id: "3", label: "Effect", type: "effect", value: undefined },
    ],
  },
  {
    id: "a4",
    modelId: "m2",
    label: "Model 2 Bee",
    properties: [{ id: "4", type: "number", label: "nectarCount", value: 0 }],
    features: [
      { id: "2", label: "Costume", type: "costume", value: "hive" },
      { id: "3", label: "Effect", type: "effect", value: undefined },
    ],
  },
  {
    id: "a5",
    modelId: "m2",
    label: "Model 2 Flower",
    properties: [{ id: "4", type: "number", label: "nectarCount", value: 0 }],
    features: [
      { id: "2", label: "Costume", type: "costume", value: "hive" },
      { id: "3", label: "Effect", type: "effect", value: undefined },
    ],
  },
  {
    id: "a6",
    modelId: "m1",
    label: "World",
    type: "world",
    properties: [],
    features: [],
  },
  {
    id: "a7",
    modelId: "m1",
    label: "World Timer",
    type: "timer",
    properties: [],
    features: [],
  },
  {
    id: "a8",
    modelId: "m1",
    label: "Sticker",
    properties: [],
    features: [
      { id: "3", label: "Effect", type: "effect", value: "emitSticker" },
    ],
  },
];

DB.INSTANCES = [
  {
    id: "i1",
    agentId: "a1",
    modelId: "m1",
    label: "Bee1", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Bee1" },
      { id: "2", label: "x", type: "number", value: 200 },
      { id: "3", label: "y", type: "number", value: 10 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "5", label: "energyLevel", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "useFakeTrack" },
      { id: "2", type: "costume", value: 1 },
    ],
  },
  {
    id: "i2",
    agentId: "a1",
    modelId: "m1",
    label: "Bee2", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Bee2" },
      { id: "2", label: "x", type: "number", value: 250 },
      { id: "3", label: "y", type: "number", value: 125 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "5", label: "energyLevel", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "useFakeTrack" },
      { id: "2", type: "costume", value: 2 },
    ],
  },
  {
    id: "i3",
    agentId: "a1",
    modelId: "m1",
    label: "Bee3", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Bee3" },
      { id: "2", label: "x", type: "number", value: 60 },
      { id: "3", label: "y", type: "number", value: 200 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "5", label: "energyLevel", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "useFakeTrack" },
      { id: "2", type: "costume", value: 1 },
    ],
  },
  {
    id: "i4",
    agentId: "a2",
    modelId: "m1",
    label: "Daisy1", // change this to "name"
    properties: [
      { id: "0", label: "self", type: "agent", value: "self" },
      { id: "1", label: "label", type: "string", value: "Daisy1" },
      { id: "2", label: "x", type: "number", value: 50 },
      { id: "3", label: "y", type: "number", value: 0 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "script" },
      { id: "2", type: "costume", value: 1 },
    ],
  },
  {
    id: "i5",
    agentId: "a2",
    modelId: "m1",
    label: "Daisy2", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Daisy2" },
      { id: "2", label: "x", type: "number", value: 275 },
      { id: "3", label: "y", type: "number", value: 5 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "script" },
      { id: "2", type: "costume", value: 2 },
    ],
  },
  {
    id: "i6",
    agentId: "a2",
    modelId: "m1",
    label: "Daisy3", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Daisy3" },
      { id: "2", label: "x", type: "number", value: 375 },
      { id: "3", label: "y", type: "number", value: 225 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
      { id: "6", label: "pollenCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "script" },
      { id: "2", type: "costume", value: 0 },
    ],
  },
  {
    id: "i7",
    agentId: "a3",
    modelId: "m1",
    label: "Hive1", // change this to "name"
    properties: [
      { id: "1", label: "label", type: "string", value: "Hive1" },
      { id: "2", label: "x", type: "number", value: 450 },
      { id: "3", label: "y", type: "number", value: 5 },
      { id: "4", label: "nectarCount", type: "number", value: 0 },
    ],
    features: [
      { id: "1", type: "movement", value: "script" },
      { id: "2", type: "costume", value: 0 },
    ],
  },
  {
    id: "i8",
    agentId: "a8",
    modelId: "m1",
    properties: [
      { id: "1", label: "label", type: "string", value: "JoshuaSticker" },
      { id: "2", label: "x", type: "number", value: 325 },
      { id: "3", label: "y", type: "number", value: 175 },
    ],
    features: [{ id: "3", type: "effect", value: "useSticker" }],
  },
];

///////////////////////////////////////////////////////////////////////////////
DB.EVENTS = [
  {
    id: "e1",
    agentId: "a1",
    label: "When bee touches flower",
    filters: ["f1", "f2", "f3"],
    actions: ["act1", "act2"],
  },
  {
    id: "e2",
    agentId: "a1",
    label: "When bee touches hive",
    filters: [], // ["f4"],
    actions: [], // ["act3"],
  },
];

///////////////////////////////////////////////////////////////////////////////

DB.EXPRESSIONS = [
  {
    id: "f1",
    sourceId: "s1", // bee
    opId: "touches",
    targetId: "t1", // flower
  },
  {
    id: "t1",
    sourceId: "s2", // flower
    opId: undefined,
    targetId: undefined,
  },
  {
    id: "f2",
    sourceId: "s3", // bee
    opId: "gt",
    targetId: "t2", // value 10
  },
  {
    id: "t2",
    sourceId: "s4", // bee
    opId: undefined,
    targetId: undefined,
  },
  {
    id: "f3",
    sourceId: "s5", // bee
    opId: "gt",
    targetId: "t3", // flower
  },
  {
    id: "t3",
    sourceId: "s6", // bee
    opId: "add",
    targetId: "t4",
  },
  {
    id: "t4",
    sourceId: "s7", // bee
    opId: "add",
    targetId: "t5",
  },
  {
    id: "t5",
    sourceId: "s8", // value + 5
    opId: undefined,
    targetId: undefined,
  },
  {
    id: "act1",
    sourceId: "as1", // bee nectar
    opId: "add",
    targetId: "at1", // value + 1
  },
  {
    id: "at1",
    sourceId: "ats1", // value + 1
    opId: undefined,
    targetId: undefined,
  },
  {
    id: "act2",
    sourceId: "as2", // flower nectar
    opId: "sub",
    targetId: "at2", // value + 1
  },
  {
    id: "at2",
    sourceId: "ats2", // value + 1
    opId: undefined,
    targetId: undefined,
  },
];

DB.SOURCES = [
  {
    id: "s1",
    vmtype: "agent",
    value: {
      agentId: "a1", // bee
      propertyId: undefined,
      inputValue: undefined,
    },
  },
  {
    id: "s2",
    vmtype: "agent",
    value: {
      agentId: "a2", // flower
      propertyId: undefined,
      inputValue: undefined,
    },
  },
  {
    id: "s3",
    vmtype: "agentProperty",
    value: {
      agentId: "a1", // bee
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "s4",
    vmtype: "value",
    value: {
      agentId: undefined,
      propertyId: undefined,
      inputValue: "10",
    },
  },
  {
    id: "s5",
    vmtype: "agentProperty",
    value: {
      agentId: "a1", // bee
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "s6",
    vmtype: "agentProperty",
    value: {
      agentId: "a2", // flower
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "s7",
    vmtype: "agentProperty",
    value: {
      agentId: "a3", // hiave
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "s8",
    vmtype: "value",
    value: {
      agentId: undefined,
      propertyId: undefined,
      inputValue: "20",
    },
  },
  {
    id: "as1",
    vmtype: "agentProperty",
    value: {
      agentId: "a1", // bee
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "ats1",
    vmtype: "value",
    value: {
      agentId: undefined,
      propertyId: undefined,
      inputValue: "1",
    },
  },
  {
    id: "as2",
    vmtype: "agentProperty",
    value: {
      agentId: "a2", // flower
      propertyId: "4", // nectar count
      inputValue: undefined,
    },
  },
  {
    id: "ats2",
    vmtype: "value",
    value: {
      agentId: undefined,
      propertyId: undefined,
      inputValue: "1",
    },
  },
];

///////////////////////////////////////////////////////////////////////////////
export default DB;
