/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  test converter

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';
import {
  DefTemplate,
  EndTemplate
} from 'modules/sim/script/keywords/defTemplate';

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('CONVERTER', 'TagDkRed');
const CMDS = new Map();

function m_AddKeywordClass(Constructor) {
  const kobj = new Constructor();
  CMDS.set(kobj.keyword, kobj);
}

/// COMMAND DEFINITIONS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define a template */
m_AddKeywordClass(EndTemplate);
m_AddKeywordClass(DefTemplate);

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
      template_define: progout,
      template_defaults: [],
      template_conditions: []
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
      template_define: progout,
      template_defaults: [],
      template_conditions: []
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
    template_define: [],
    template_defaults: [],
    template_conditions: [],
    agent_init: []
  };
  //  source.forEach(line => output.push(...m_CompileLine(line)));
  // this has to look through the output to determine what to compiler
  source.forEach(line => {
    const programs = m_CompileLine(line);
    console.log(line, '->', programs);
    const {
      template_define: define,
      template_defaults: defaults,
      template_conditions: cond,
      agent_init: init
    } = programs;
    if (define && define.length) output.template_define.push(...define);
    if (defaults && defaults.length) output.template_defaults.push(...define);
    if (cond && cond.length) output.template_conditions.push(...define);
    if (init && init.length) output.agent_init.push(...define);
    return output;
  });
  console.log(...PR('program output (definition, defaults, conditions)'));
  output.template_define.forEach(statement =>
    console.log('definition:', statement)
  );
  output.template_defaults.forEach(statement =>
    console.log('defaults:  ', statement)
  );
  output.template_conditions.forEach(statement =>
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
