/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test converter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');
const CMDS = new Map();

/// COMMAND DEFINITIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a template */
CMDS.set('endTemplate', {
  args: [],
  compile: parms => ({
    agent_definition: [],
    agent_defaults: [],
    agent_conditions: []
  }),
  render: (parms, children) => '</Template>',
  // this is the required scope (_EMPTY_ is special value)
  req_scope: { _EMPTY_: true },
  // these commands are allowed immediately following this scope
  cmd_scope: { defProp: true }
});

CMDS.set('defTemplate', {
  // arguments are in order, this is used as a template to determine how to parse
  // the actual defTemplate line
  // --
  // built in types string, number, boolean, object, any
  // prop types as GSString, GSNumber, GSBoolean, etc
  args: ['templateName string', 'baseTemplate string'],
  // this is the generator for the line
  compile: (parms, children) => {
    // defTemplate.compile knows what to expect incl types
    // the args type array is for the GUI to know how to render a component
    const templateName = parms.shift();
    const baseTemplate = parms.shift() || '';
    const progout = [];
    progout.push(
      `smc_defTemplate( ${templateName}, ${baseTemplate || 'Agent'} )`
    );
    return {
      agent_definition: progout,
      agent_defaults: [],
      agent_conditions: []
    };
  },
  // this is the renderer for the line
  render: (parms, children) => {
    const templateName = parms.shift();
    const baseTemplate = parms.shift() || 'Agent';
    return `<Template label='${templateName}' extends='${baseTemplate}'>`;
  },
  // this is the required scope (_EMPTY_ is special value)
  req_scope: { _EMPTY_: true },
  // these commands are allowed immediately following this scope
  cmd_scope: { defProp: true }
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a property */
CMDS.set('defProp', {
  // arguments are in order
  args: ['propName string', 'propType string', 'initValue any'],
  compile: parms => {
    // defProp.compile knows what to expect incl types
    // the args type array is for the GUI to know how to render a component
    const propName = parms.shift();
    const propType = parms.shift();
    const initValue = parms.shift();
    const progout = [];
    progout.push(
      `smc_defProp( ${propName}, ${propType}, ${initValue || '<defaultVal>'} )`
    );
    return {
      agent_definition: progout,
      agent_defaults: [],
      agent_conditions: []
    };
  },
  // this is the renderer for the line
  render: (parms, children) => {
    const propName = parms.shift();
    const propType = parms.shift();
    const initValue = parms.shift();
    return `<PropEditor label='${propName}' type='${propType}' value={${initValue}}/>`;
  },
  req_scope: { defTemplate: true },
  cmd_scope: {}
});
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a feature */
CMDS.set('useFeature', {
  args: ['featureName string'],
  compile: parms => {
    const featureName = parms.shift();
    const progout = [];
    progout.push(`smc_useFeature( ${featureName} )`);
    return {
      agent_definition: progout,
      agent_defaults: [],
      agent_conditions: []
    };
  },
  // this is the renderer for the line
  render: (parms, children) => {
    const featureName = parms.shift();
    return `<UseFeature label='${featureName}'><PropList/><MethodList/></UseFeature>`;
  },
  req_scope: { defTemplate: true },
  cmd_scope: {}
});

/// COMPILER FUNCTIONS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** receives an actual line of code like 'defTemplate Bee' */
function m_CompileLine(line) {
  const bits = line.split(' '); // tokenize
  // what is the command?
  let cmdName = bits.shift();
  // how do we compile it?
  const cmdObj = CMDS.get(cmdName);
  if (!cmdObj)
    return [
      `smc_error( 'ERR: unknown command:"${cmdName}" parms:"${bits.join(' ')}" )`
    ];
  return cmdObj.compile(bits); // bits is the subsequent parameters
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** compile an array of lines of code */
function m_CompileSourceLines(source) {
  const output = {
    agent_definition: [],
    agent_defaults: [],
    agent_conditions: []
  };
  //  source.forEach(line => output.push(...m_CompileLine(line)));
  // this has to look through the output to determine what to compiler
  source.forEach(line => {
    const programs = m_CompileLine(line);
    output.agent_definition.push(...programs.agent_definition);
    output.agent_defaults.push(...programs.agent_defaults);
    output.agent_conditions.push(...programs.agent_conditions);
    return output;
  });
  console.log(...PR('program output (definition, defaults, conditions)'));
  output.agent_definition.forEach(statement =>
    console.log('definition:', statement)
  );
  output.agent_defaults.forEach(statement =>
    console.log('defaults:  ', statement)
  );
  output.agent_conditions.forEach(statement =>
    console.log('conditions:', statement)
  );
}
/// RENDER FUNCTIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render an actual line of code like 'defTemplate Bee' */
function m_RenderLine(line) {
  const bits = line.split(' '); // tokenize
  // what is the command?
  let cmdName = bits.shift();
  // how do we compile it?
  const cmdObj = CMDS.get(cmdName);
  if (!cmdObj)
    return [
      `smc_error( 'ERR: unknown command:"${cmdName}" parms:"${bits.join(' ')}" )`
    ];
  return cmdObj.render(bits); // bits is the subsequent parameters
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** render a source array into react components or whatever */
function m_RenderSourceLines(source) {
  const react = [];
  source.forEach(line => {
    const jsx = m_RenderLine(line);
    react.push(jsx);
  });
  console.log(...PR('JSX output (would require correct order in source)'));
  react.forEach(component => console.log(component));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SOURCE = [
  'defTemplate Bee',
  'defProp nectarAmount GSNumber 0',
  'useFeature FishCounter',
  'useFeature BeanCounter',
  'useFeature Movement',
  'endTemplate',
  'defTemplate HoneyBee Bee',
  'defProp honeySacks GSNumber 0',
  'endTemplate'
];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(window as any).listSource = (source = SOURCE) => {
  console.log(...PR('source lines (made by GUI, saved/loaded from db)'));
  source.forEach((line, index) => {
    console.log(index, line);
  });
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(window as any).sourceToProgram = (source = SOURCE) => {
  // the idea is to create a data structure we can generate and then parse
  console.log(...PR('line compiler test'));
  m_CompileSourceLines(source);
  return 'end test';
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(window as any).sourceToReact = (source = SOURCE) => {
  // the idea is to parse data structure into react
  console.log(...PR('line renderer test'));
  m_RenderSourceLines(source);
};
