/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Vision Class

  Adds a `canSee` map to agents, a lookup table for target agent ids
  that the agent can see within a projected vision cone based on the orientation
  of the agent.

  Dependencies:
  * feat-movement
  * feat-costume

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString, GVarBoolean } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { GetAgentById, GetAgentsByType } from 'modules/datacore/dc-agents';
import {
  Register,
  DistanceTo,
  ProjectPoint,
  GetAgentBoundingRect
} from 'modules/datacore/dc-features';
import { intersect } from 'lib/vendor/js-intersect';
import { ANGLES } from 'lib/vendor/angles';

ANGLES.SCALE = Math.PI * 2;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Vision';
const PR = UR.PrefixUtil(FEATID);
const DBG = false;

const VISION_AGENTS = new Map();

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * WIDGET_AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  if (!a) VISION_AGENTS.delete(agentId);
  return a;
}

// REVIEW: Consider using https://github.com/davidfig/pixi-intersects
function m_IsTargetWithinVisionCone(agent, target): boolean {
  // Newly minted agents will not have x and y set until VIS_UPDATE
  if (
    agent.x === undefined ||
    agent.y === undefined ||
    target === undefined ||
    target.x === undefined ||
    target.y === undefined ||
    agent.prop.Movement._orientation === undefined // orientation isn't set until agent moves
  )
    return false;

  const distance = agent.prop.Vision._viewDistance;
  const orientation = -agent.prop.Movement._orientation; // flip y
  const viewAngleLeft = ANGLES.normalizeHalf(
    orientation - agent.prop.Vision._viewAngle
  );
  const viewAngleRight = ANGLES.normalizeHalf(
    orientation + agent.prop.Vision._viewAngle
  );
  // We project the middle point too, so that upon first detection, a pivot
  // towards the agent will not result in the target moving out of the vision cone
  const viewPointLeft = ProjectPoint(agent, viewAngleLeft, distance);
  const viewPointMiddle = ProjectPoint(agent, orientation, distance);
  const viewPointRight = ProjectPoint(agent, viewAngleRight, distance);
  const visionPoly = [
    { x: agent.x, y: agent.y },
    { x: viewPointLeft.x, y: viewPointLeft.y },
    { x: viewPointMiddle.x, y: viewPointMiddle.y },
    { x: viewPointRight.x, y: viewPointRight.y }
  ];

  // debug
  const visionPath = [
    agent.x,
    agent.y,
    viewPointLeft.x,
    viewPointLeft.y,
    viewPointMiddle.x,
    viewPointMiddle.y,
    viewPointRight.x,
    viewPointRight.y
  ];
  agent.debug = visionPath;

  const targetPoly = GetAgentBoundingRect(target);
  // Returns array of intersecting objects, or [] if no intersects
  const result = intersect(visionPoly, targetPoly);
  return result.length > 0;
}

/// PHYSICS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Vision Update Loop -- Runs once per gameloop
 */
function m_update(frame) {
  const agentIds = Array.from(VISION_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;

    const targets = GetAgentsByType(VISION_AGENTS.get(agentId));
    targets.forEach(t => {
      if (agent.id === t.id) return; // skip self
      const canSee = m_IsTargetWithinVisionCone(agent, t);
      if (!agent.canSee) agent.canSee = new Map();
      agent.canSee.set(t.id, canSee);
    });
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class VisionPack extends GFeature {
  //
  constructor(name) {
    super(name);
    this.featAddMethod('monitor', this.monitor);
    this.featAddMethod('canSee', this.canSee);
    UR.HookPhase('SIM/AGENTS_UPDATE', m_update);
    // use AGENTS_UPDATE so the vision calculations are in place for use during
    // movmeent's FEATURES_UPDATE
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'text', new GVarString(agent.name)); // default to agent name

    agent.prop.Vision._viewDistance = 250;
    agent.prop.Vision._viewAngle = (45 * Math.PI) / 180; // in radians
    // 45 degrees to the left and right of center for a total 90 degree
    // field of vision = 0.785398
  }

  /// VISION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  monitor(agent: IAgent, targetBlueprintName: string) {
    VISION_AGENTS.set(agent.id, targetBlueprintName);
  }
  canSee(agent: IAgent, target: IAgent) {
    return m_IsTargetWithinVisionCone(agent, target);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new VisionPack(FEATID);
Register(INSTANCE);
