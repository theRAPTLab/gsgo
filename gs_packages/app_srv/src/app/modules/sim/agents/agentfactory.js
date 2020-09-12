/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Factory!

  we have an agent template that is an object with props and methods defined.
  however, we want to make agent instances from this object, so how is
  that done?

  1. the template must have instructions in it for creating a new object,
     probably stored inside a function that returns an object.
  2. the template must be look-upable by name.
  3. derived agents must be able to decorate the template object by
     retrieving the base agent and composing it together with new methods,
     properties, and feature references.
  4. features need to initialize their storage inside the function in (1)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import Agent from '../lib/class-agent';
import { AGENTS_Save, AGENTS_Typeof, TEMPLATES } from '../runtime-core';
import { WORLD } from './global';

const PR = UR.PrefixUtil('AgentFactory');

/// FACTORY UTILITIES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Templates are factory functions that are stored by name in the
 *  TEMPLATES map. The factory function accepts an agentName that
 *  is used to create the base agent.
 *  When calling this function, provide the templateName and a function
 *  that will be used to add additional properties, features, and methods
 *  to the agent. Use the AgentFactory methods
 *  modify.
 */
function AddTemplate(name, f_Decorate) {
  if (TEMPLATES.has(name)) throw Error(`state template '${name}' already exists`);
  const factoryFunc = agentName => {
    const agent = new Agent(agentName);
    f_Decorate(agent);
    agent.meta.type = name;
    return agent;
  };
  console.log(`storing template: '${name}`);
  TEMPLATES.set(name, factoryFunc);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Factory method to return a new Agent
 *  @param {string} agentName - name of this instance
 *  @param {string} template - name of the template to use (default 'Agent')
 */
function MakeAgent(agentName, options = {}) {
  const { type } = options;
  let agent;
  if (type === undefined) {
    agent = new Agent(agentName);
  } else {
    const factoryFunc = TEMPLATES.get(type);
    if (!factoryFunc) throw Error(`agent template for '${type}' not defined`);
    // return the created agent from template
    agent = factoryFunc(agentName);
  }
  return AGENTS_Save(agent);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API:
 *  Convert an agent to a serializable object format
 */
function ExportAgent(agent) {
  // this is our serialization data structure
  const obj = {
    meta: [],
    props: {
      var: [],
      bool: [],
      num: [],
      str: []
    },
    features: []
  };

  // serialize low level agent properties
  const agentKeys = Object.entries(agent.meta);
  agentKeys.forEach(entry => obj.meta.push(entry));
  // serialize all properties by name, value, and addition parameters
  const propKeys = [...agent.props.keys()];
  propKeys.forEach(key => {
    const prop = agent.props.get(key);
    const serialized = prop.serialize();
    obj.props[prop.type].push([key, ...serialized]);
  });
  // collect features by name
  const featKeys = [...agent.features.keys()];
  featKeys.forEach(key => obj.features.push(key));

  // return serialized agent
  return obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an array of agents by type */
function GetAgentsByType(type) {
  return [...AGENTS_Typeof(type)];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the WORLD agent */
function GetWorldAgent() {
  return WORLD;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  MakeAgent, // create an agent instance from template
  AddTemplate, // add template function by name
  ExportAgent, // return serializable object representing an agent instance
  GetAgentsByType, // return a list of agents by type
  GetWorldAgent // return world agent
};
