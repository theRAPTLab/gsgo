/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FEATURES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import { IFeature } from 'lib/t-script.d';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATURES: Map<string, IFeature> = new Map();

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Retrieve a feature module by name (as defined in the feature class)
 *  and return its instance
 */
export function GetFeature(fName) {
  return FEATURES.get(fName);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** retrieve a method from a feature instance
 */
export function GetFeatureMethod(fName: string, mName: string) {
  return GetFeature(fName)[mName];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Register a feature module by name (as defined in the feature class)
 */
export function Register(fpack) {
  FEATURES.set(fpack.name, fpack);
}

/// COMMON UTILITIES //////////////////////////////////////////////////////////
///
/// REVIEW: Move these to a general vector math module?

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// project a point out in space based on angle and distance
export function ProjectPoint(agent, angle, distance) {
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  return { x, y };
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Returns the SCALED bounding rect of the agent
export function GetAgentBoundingRect(agent) {
  // Based on costume
  if (!agent.hasFeature('Costume'))
    throw new Error(
      `GetAgentBoundingRect: Tried to use vision on an agent with no costume ${agent.id}`
    );
  const { w, h } = agent.callFeatMethod('Costume', 'getScaledBounds');
  const halfw = w / 2;
  const halfh = h / 2;
  return [
    { x: agent.x - halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y + halfh },
    { x: agent.x - halfw, y: agent.y + halfh }
  ];
}
