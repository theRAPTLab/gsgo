/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FEATURE UTILITIES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import GSValue from './gsValue';
import GSString from './gsString';

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let LAST_ERR;

/// HELPERS METHODS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function hasProp(agent, prop) {
  const name = agent.name || '<unknown>';
  if (agent.props.has(prop)) {
    LAST_ERR = `prop '${prop}' already added to in agent '${name}'`;
  } else {
    LAST_ERR = '';
  }
  return LAST_ERR;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function hasFeature(agent, feature) {
  const name = agent.name || '<unknown>';
  if (agent.features.has(feature)) {
    LAST_ERR = `feature '${feature}' already added in agent '${name}'`;
  } else {
    LAST_ERR = '';
  }
  return LAST_ERR;
}

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function baseProps(agent) {
  if (hasProp(agent, 'x')) throw Error(LAST_ERR);
  if (hasProp(agent, 'y')) throw Error(LAST_ERR);
  if (hasProp(agent, 'skin')) throw Error(LAST_ERR);
  if (hasProp(agent, 'name')) throw Error(LAST_ERR);
  agent.x = new GSValue();
  agent.y = new GSValue();
  agent.name = new GSString();
  agent.skin = new GSString();
  return agent;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default {
  hasProp,
  hasFeature,
  baseProps
};
