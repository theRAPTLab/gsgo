/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { GetFeature } from 'modules/datacore/dc-sim-data';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility: Add a property to an agent's prop map by property name */
function AddProp(agent: IAgent, pName: string, gvar: ISM_Object): ISM_Object {
  if (agent.prop[pName] !== undefined)
    throw Error(`prop '${pName}' already added`);
  agent.prop[pName] = gvar;
  return gvar;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility: add a method to an agent's method map by method name */
function AddMethod(agent: IAgent, mName: string, method: TSM_Method): IAgent {
  if (agent.method[mName]) throw Error(`method '${mName}' already added`);
  agent.method[mName] = method;
  return agent;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility: add a featurepack to an agent's feature map by feature name
 *  featurepacks store its own properties directly in agent.props
 *  featurepacks store method pointers in agent.methods, and all methods
 *  have the signature method(agentInstance, ...args)  */
function AddFeature(agent: IAgent, fName: string): IAgent {
  if (agent.featureMap[fName])
    throw Error(`feature '${fName}' already to blueprint`);
  const fpack = GetFeature(fName);
  if (!fpack) throw Error(`'${fName}' is not an available feature`);
  agent.featureMap[fName] = fpack;
  // this should return agent
  fpack.decorate(agent);
  return agent;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { AddProp, AddMethod, AddFeature };
