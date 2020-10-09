/*
    Operations Definitions
    
    Used to populate menus.
    
*/

let OP = {
  agent: [
    {
      id: "touches",
      label: "touches",
      targetType: "agent",
      opType: "comparison",
    },
    {
      id: "isnear",
      label: "is near",
      targetType: "agent",
      opType: "comparison",
    },
  ],
  number: [
    {
      id: "add",
      label: "+",
      targetType: "number",
      opType: "artihmetic",
    },
    {
      id: "sub",
      label: "-",
      targetType: "number",
      opType: "artihmetic",
    },
    {
      id: "div",
      label: "/",
      targetType: "number",
      opType: "artihmetic",
    },
    {
      id: "mul",
      label: "x",
      targetType: "number",
      opType: "artihmetic",
    },
    {
      id: "eq",
      label: "=",
      targetType: "number",
      opType: "comparison",
    },
    {
      id: "gt",
      label: ">",
      targetType: "number",
      opType: "comparison",
    },
    {
      id: "lt",
      label: "<",
      targetType: "number",
      opType: "comparison",
    },
    {
      id: "gte",
      label: ">=",
      targetType: "number",
      opType: "comparison",
    },
    {
      id: "lte",
      label: "<=",
      targetType: "number",
      opType: "comparison",
    },
  ],
  string: [
    { id: "eq", label: "matches", targetType: "string", opType: "comparison" },
    {
      id: "notEq",
      label: "does not match",
      targetType: "string",
      opType: "comparison",
    },
  ],
  actions: [
    {
      id: "setTo",
      label: "setTo",
      sourceTypes: ["string", "number"],
      targetType: "*",
    },
    {
      id: "call",
      label: "call",
      sourceTypes: ["agent"],
      targetType: "*",
    },
    {
      id: "sendMessage",
      label: "sendMessage",
      sourceTypes: ["agent"],
      targetType: "*",
    },
    {
      id: "add", // implicit setTo
      label: "add",
      sourceTypes: ["string", "number"],
      targetType: "*",
    },
    {
      id: "sub",
      label: "subtract",
      sourceTypes: ["string", "number"],
      targetType: "*",
    },
    {
      id: "spawn",
      label: "spawn",
      sourceTypes: ["agent"],
      targetType: "agent",
    },
    {
      id: "clone",
      label: "clone",
      sourceTypes: ["agent"],
      targetType: "agent",
    },
  ],
  features: [
    {
      type: "movement",
      commands: {
        setMovement: {
          label: "setMovement",
          ui: "Menu",
          options: [
            {
              id: "script",
              label: "script-controlled",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "usePTrack",
              label: "usePTrack",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "useFakeTrack",
              label: "useFakeTrack",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "usePOZYX",
              label: "usePOZYX",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
          ],
        },
      },
      // this defines the options that need to be set in the ui
      settings: [
        {
          command: "setMovement",
          defaultValue: "useFakeTrack",
        },
      ],
      actions: [],
      runtime: ["setMovement"],
    },
    {
      type: "costume",
      commands: {
        setCostume: {
          label: "setCostume",
          ui: "FilesList",
          optionsSourceCommand: "showCostume", // costumes are saved with "showCostume" by the custom feature code
          options: [{ id: 0, label: "Blob", path: "images/blob.png" }],
        },
        showCostume: {
          label: "showCostume",
          ui: "Menu",
          options: [],
        },
      },
      settings: [
        {
          command: "showCostume",
          type: "Menu",
          defaultValue: undefined,
        },
        {
          command: "setCostume",
          type: "FilesList",
          defaultValue: undefined,
        },
      ],
      actions: [
        {
          command: "showCostume", // demo: to make it scriptable
          sourceTypes: ["agent"],
          targetType: undefined,
        },
      ],
      runtime: ["showCostume"],
    },
    {
      type: "effect",
      commands: {
        useEffect: {
          label: "useEffect",
          ui: "Menu",
          options: [
            {
              id: "none",
              label: "noEffect",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "emitSparkles",
              label: "emitSparkles",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "emitCloud",
              label: "emitCloud",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "emitTrail",
              label: "emitTrail",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
            {
              id: "emitSticker",
              label: "emitSticker",
              sourceTypes: ["agent"],
              targetType: undefined,
            },
          ],
        },
      },
      settings: [
        {
          command: "useEffect",
          defaultValue: undefined,
        },
      ],
      actions: [
        {
          command: "useEffect", // demo: to make it scriptable
          sourceTypes: ["agent"],
          targetType: undefined,
        },
      ],
      runtime: ["useEffect"],
    },
    {
      type: "Target", // track another entity, e.g. "closest"
    },
    {
      type: "Screen", // request screen effect
    },
    {
      type: "StateMeter", // agent share data with StateMeter
      properties: ["property"], // select which agent property to show?
      actions: ["showMeter", "hideMeter"],
    },
    {
      type: "HTMLChart",
    },
  ],
};

export default OP;
