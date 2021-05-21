/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Movement Class!

  Always use m_Random to generate random values.

  Direction
    0  = right
    90 = up

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import { GVarBoolean, GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import {
  DeleteAgent,
  GetAgentsByType,
  GetAllAgents,
  DefineInstance,
  GetAgentById
} from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';
import { GetBounds, Wraps } from 'modules/datacore/dc-project';
import { intersect } from 'lib/vendor/js-intersect';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Movement';
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

const MOVEWINDOW = 10; // A move will leave `isMoved` active for this number of frames
const MOVEDISTANCE = 5; // Minimum distance moved before `isMoved` is registered
// This is necessary to account for input jitter

/// Movement Agent Manager
const TRACKED_AGENTS = new Map();
const SEEK_AGENTS = new Map();

/// MOVING_AGENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_random(min = 0, max = 1, round = false) {
  const n = RNG() * (max - min) + min;
  if (round) return Math.round(n);
  return n;
}
function m_DegreesToRadians(degree) {
  return (degree * Math.PI) / 180;
}
function m_RadiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}
// Distance between centers for now
function m_DistanceTo(agent, target) {
  return Math.hypot(target.x - agent.x, target.y - agent.y);
}
function m_AngleBetween(agent, target) {
  const dy = target.y - agent.y;
  const dx = target.x - agent.x;
  return Math.atan2(dy, dx);
}
function m_ProjectPoint(agent, angle, distance) {
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  return { x, y };
}
function m_setDirection(agent, degrees) {
  agent.prop.Movement.direction.value = degrees;
}
function m_GetAgentBoundingRect(agent) {
  // Based on costume
  if (!agent.hasFeature('Costume'))
    throw new Error(
      ...PR('tried to use vision on an agent with no costume', agent)
    ); // no costume
  const { w, h } = agent.callFeatMethod('Costume', 'getBounds');
  const halfw = w / 2;
  const halfh = h / 2;
  return [
    { x: agent.x - halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y - halfh },
    { x: agent.x + halfw, y: agent.y + halfh },
    { x: agent.x - halfw, y: agent.y + halfh }
  ];
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Processes position request
/// * Checks bounds
/// * Applies bounce
/// But does not actually set the agent x/y until FEATURES_EXEC phase
function m_QueuePosition(agent, x, y) {
  const bounds = GetBounds();
  const pad = 5;
  let hwidth = pad; // half width -- default to some padding
  let hheight = pad;
  // If agent uses physics, we can get height/width, otherwise default
  // to small padding.
  if (agent.hasFeature('Physics')) {
    hwidth = agent.callFeatMethod('Physics', 'getWidth') / 2;
    hheight = agent.callFeatMethod('Physics', 'getHeight') / 2;
  }
  let xx = x;
  let yy = y;
  if (Wraps('left')) {
    // This lets the agent poke its nose out before wrapping
    // to the other side.  Otherwise, the agent will suddenly
    // pop to other side.
    xx = x <= bounds.left ? bounds.right - pad : xx;
  } else if (x - hwidth < bounds.left) {
    // wall
    xx = bounds.left + hwidth + pad;
    if (bounds.bounce) m_setDirection(agent, m_random(-89, 89));
  }
  if (Wraps('right')) {
    xx = x >= bounds.right ? bounds.left + pad : xx;
  } else if (x + hwidth >= bounds.right) {
    xx = bounds.right - hwidth - pad;
    if (bounds.bounce) m_setDirection(agent, m_random(91, 269));
  }
  if (Wraps('top')) {
    yy = y <= bounds.top ? bounds.bottom - pad : yy;
  } else if (y - hheight <= bounds.top) {
    yy = bounds.top + hheight + pad;
    if (bounds.bounce) m_setDirection(agent, m_random(181, 359));
  }
  if (Wraps('bottom')) {
    yy = y >= bounds.bottom ? bounds.top + pad : yy;
  } else if (y + hheight > bounds.bottom) {
    yy = bounds.bottom - hheight - pad;
    if (bounds.bounce) m_setDirection(agent, m_random(1, 179));
  }

  agent.prop.Movement._x = xx;
  agent.prop.Movement._y = yy;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Calculate derived properties
function m_ProcessPosition(agent, frame) {
  const x = agent.prop.Movement._x;
  const y = agent.prop.Movement._y;

  if (!x || !y) return; // Movement not set, so ignore

  // is Moving?
  // inputs come in at a 15fps frame rate, so we need to use hysteresis
  let didMove = false;
  if (
    Math.abs(agent.x - x) > MOVEDISTANCE ||
    Math.abs(agent.y - y) > MOVEDISTANCE
  ) {
    agent.prop.Movement._lastMove = frame;
    didMove = true;
  } else if (frame - agent.prop.Movement._lastMove < MOVEWINDOW) {
    didMove = true;
  }
  agent.prop.Movement.isMoving.setTo(didMove);

  // Direction
  const orientation = m_AngleBetween(agent, {
    x: agent.prop.Movement._x,
    y: agent.prop.Movement._y
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_SetPosition(agent, frame) {
  const x = agent.prop.Movement._x;
  const y = agent.prop.Movement._y;
  if (!x || !y) return; // Movement not set, so ignore
  agent.prop.x.value = x;
  agent.prop.y.value = y;
}

/// MOVEMENT TYPES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// JITTER
function moveJitter(
  agent: IAgent,
  min: number = -5,
  max: number = 5,
  round: boolean = true,
  frame: number
) {
  const x = m_random(min, max, round);
  const y = m_random(min, max, round);
  m_QueuePosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// WANDER
function moveWander(agent: IAgent, frame: number) {
  // Mostly go in the same direction
  // but really change direction once in a while
  const distance = agent.prop.Movement.distance.value;
  let direction = agent.prop.Movement.direction.value;
  if (m_random() > 0.98) {
    direction += m_random(-90, 90);
    agent.prop.Movement.direction.value = direction;
  }
  const angle = m_DegreesToRadians(direction);
  const { x, y } = m_ProjectPoint(agent, angle, distance);
  m_QueuePosition(agent, x, y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EDGE to EDGE (of the entire tank / system)
// Go in the same direction most of the way across the space, then turn back and do similar
function moveEdgeToEdge(agent: IAgent, frame: number) {
  const bounds = GetBounds();
  const pad = 5;
  let hwidth = pad; // half width -- default to some padding
  let hheight = pad;

  // If agent uses physics, we can get height/width, otherwise default
  // to small padding.
  if (agent.hasFeature('Physics')) {
    hwidth = agent.callFeatMethod('Physics', 'getWidth') / 2;
    hheight = agent.callFeatMethod('Physics', 'getHeight') / 2;
  }

  let direction = agent.prop.Movement.direction.value;

  // if we are near the edge, reverse direction
  if (
    agent.prop.x.value >= bounds.right - hwidth ||
    agent.prop.y.value <= bounds.top + hheight
  ) {
    direction += agent.prop.Movement.bounceAngle.value;
  } else if (
    agent.prop.x.value <= bounds.left + hwidth ||
    agent.prop.y.value >= bounds.bottom - hheight
  ) {
    direction -= agent.prop.Movement.bounceAngle.value;
  }

  // now move with the current direction and distance
  agent.prop.Movement.direction.value = direction;
  const distance = agent.prop.Movement.distance.value;

  const angle = m_DegreesToRadians(direction);
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;

  // we handled our own bounce, so set x and y directly
  agent.prop.Movement._x = x;
  agent.prop.Movement._y = y;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FLOAT
function moveFloat(agent, y: number = -300) {
  // Move to some designated vertical position
  agent.prop.y.value = Math.max(y, agent.prop.y.value - 2);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Seek
function seek(agent: IAgent, target: { x; y }, frame: number) {
  const distance = agent.prop.Movement.distance.value;
  let angle = -m_AngleBetween(agent, target); // flip y
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  m_QueuePosition(agent, x, y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// SeekAgent
function seekAgent(agent: IAgent, frame: number) {
  const targetId = agent.prop.Movement._targetId;
  if (!targetId) return; // no target, just idle
  const target = GetAgentById(targetId);
  seek(agent, target, frame);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// seekAgentOrWander
function seekAgentOrWander(agent: IAgent, frame: number) {
  const targetId = agent.prop.Movement._targetId;
  if (!targetId) {
    moveWander(agent, frame); // no target, wander instead
    return;
  }
  const target = GetAgentById(targetId);
  seek(agent, target, frame);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Movement Function Library
const MOVEMENT_FUNCTIONS = new Map([
  ['static', undefined],
  ['wander', moveWander],
  ['edgeToEdge', moveEdgeToEdge],
  ['jitter', moveJitter],
  ['float', moveFloat],
  ['seekAgent', seekAgent],
  ['seekAgentOrWander', seekAgentOrWander]
]);

/// SEEK ALGORITHMS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_FindNearestAgent(agent, targetType) {
  let shortestDistance: number = Infinity;
  let nearestAgent;
  const targetAgents = GetAllAgents();
  targetAgents.forEach(t => {
    if (t.blueprint.name !== targetType) return; // skip if wrong blueprint type
    if (t.id === agent.id) return; // skip self
    const d = m_DistanceTo(agent, t);
    if (d < shortestDistance) {
      shortestDistance = d;
      nearestAgent = t;
    }
  });
  return nearestAgent;
}

// HACK
// Check distance between center of target and vision end point
//
// This works, but is quite hacky.
// The distance between the target center and the visionPoint
// might vary widely depending on the position of the target.
//
// // 1. Project a point some distance ahead of the current direction
// // 2. Calculate the distance between that visionPoint and the
// //    nearestAgent candidate's center.
// // 3. If the
// // If the distance between the direcitonal vision distance
// // point and the center of the target object is greater than
// // n, then we can't see it.
// const VISIBILITY_DISTANCE = 50;
// const direction = agent.prop.Movement._orientation;
// const angle = m_DegreesToRadians(direction);
// const visionPoint = m_Projection(agent, angle, VISIBILITY_DISTANCE);
// const isWithinVisionCone =
//   shortestDistance < VISIBILITY_DISTANCE
//     ? // if the target is CLOSER than visibility distance, use agent
//       m_DistanceTo(nearestAgent, agent) < VISIBILITY_ANGLE
//     : m_DistanceTo(nearestAgent, visionPoint) < VISIBILITY_ANGLE;
function m_IsTargetWithinViewDistance() {}

// HACK
// Check angle between direction and angle to target center
//
// This works, but does not account for the target's size.
// This is also problematic in that there could be a slightly
// further away agent that IS within the cone of vision.
// Advantage: It's a relatively cheap calculation.
// `direction` generally goes from -PI to +PI
// `angleToTarget` also is -PI to +PI.
//  So the wrap happens at PI.
function m_IsTargetWithinViewAngle(agent, target) {
  const angleToTarget = m_AngleBetween(agent, target);
  const direction = agent.prop.Movement._orientation;
  // normallize the angles so we can safely do math
  // on angles without worrying about negative numbers
  // and wrapping.  Since we're just looking at differences
  // anyway, it doesn't matter that all the angles
  // are rotated by 90 degrees.
  const normalizedDir = direction + Math.PI;
  const normalizedAngle = angleToTarget + Math.PI;
  const maxViewAngle = normalizedDir + agent.prop.Movement._viewAngle;
  const minViewAngle = normalizedDir - agent.prop.Movement._viewAngle;
  return normalizedAngle < maxViewAngle && normalizedAngle > minViewAngle;
}

// REVIEW: Consider using https://github.com/davidfig/pixi-intersects
function m_IsTargetWithinVisionCone(agent, target): boolean {
  const distance = agent.prop.Movement._viewDistance;
  const orientation = agent.prop.Movement._orientation; // orientation isn't set until agent moves
  const viewAngleLeft = orientation - agent.prop.Movement._viewAngle;
  const viewAngleRight = orientation + agent.prop.Movement._viewAngle;
  const viewPointLeft = m_ProjectPoint(agent, viewAngleLeft, distance);
  const viewPointRight = m_ProjectPoint(agent, viewAngleRight, distance);
  // console.log(
  //   'viewPOint',
  //   distance,
  //   orientation,
  //   agent.prop.Movement._viewAngle,
  //   viewPointLeft,
  //   viewPointRight
  // );
  const visionPoly = [
    { x: agent.x, y: agent.y },
    { x: viewPointLeft.x, y: viewPointLeft.y },
    { x: viewPointRight.x, y: viewPointRight.y }
  ];
  const targetPoly = m_GetAgentBoundingRect(target);
  // console.error('targetPoly', targetPoly, visionPoly);
  return intersect(visionPoly, targetPoly);
}

/// UPDATES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_FeaturesUpdate(frame) {
  // 1. Find target Agent
  SEEK_AGENTS.forEach((options, id) => {
    // REVIEW: Distance calculation should ideally only happen once and be cached

    // REVIEW: We should be finding all agents within the visibility distance
    // not just the nearest one.

    const agent = GetAgentById(id);

    // Find nearest agent
    let nearestAgent = m_FindNearestAgent(agent, options.targetType);

    // Check if agent is within view angle
    // const isWithinVisionCone = m_IsTargetWithinViewAngle(agent, nearestAgent);
    // if (isWithinVisionCone) console.log('within CONE!', isWithinVisionCone);

    // Check if agent is within view cone
    const isWithinVisionCone = nearestAgent
      ? m_IsTargetWithinVisionCone(agent, nearestAgent)
      : false;

    if (
      nearestAgent &&
      options.useVisionCone &&
      (m_DistanceTo(agent, nearestAgent) > agent.prop.Movement._viewDistance ||
        !isWithinVisionCone)
    ) {
      nearestAgent = undefined;
    }
    agent.prop.Movement._targetId = nearestAgent ? nearestAgent.id : undefined;
  });
}

function m_FeaturesThink(frame) {
  // 2. Process Movement
  const agents = [...TRACKED_AGENTS.values()];
  agents.forEach(agent => {
    // ignore AI movement if input agent
    if (agent.isModePuppet()) return;
    // handle movement
    const moveFn = MOVEMENT_FUNCTIONS.get(agent.prop.Movement.movementType.value);
    if (moveFn) moveFn(agent, frame);
  });
}

function m_FeaturesExec(frame) {
  // 3. Calculate derived properties (e.g. isMoving)
  const agents = [...TRACKED_AGENTS.values()];
  agents.forEach(agent => {
    m_ProcessPosition(agent, frame);
  });
}

function m_ApplyMovement(frame) {
  // 4. Apply Positions
  const agents = [...TRACKED_AGENTS.values()];
  agents.forEach(agent => {
    m_SetPosition(agent, frame);
  });
}

/// HOOKS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

UR.HookPhase('SIM/FEATURES_UPDATE', m_FeaturesUpdate);
UR.HookPhase('SIM/FEATURES_THINK', m_FeaturesThink);
UR.HookPhase('SIM/FEATURES_EXEC', m_FeaturesExec);
UR.HookPhase('SIM/VIS_UPDATE', m_ApplyMovement);
// using VIS_UPDATE instead of FEATURES_EXEC here because
// we need to update input agents during PRE_RUN, otherwise, input controls
// will not show up until you run the sim

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MovementPack extends GFeature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
    this.handleInput = this.handleInput.bind(this);
    this.featAddMethod('setController', this.setController);
    this.featAddMethod('queuePosition', this.queuePosition);
    this.featAddMethod('setMovementType', this.setMovementType);
    this.featAddMethod('setDirection', this.setDirection);
    this.featAddMethod('setRandomDirection', this.setRandomDirection);
    this.featAddMethod('setRandomPosition', this.setRandomPosition);
    this.featAddMethod('setRandomPositionX', this.setRandomPositionX);
    this.featAddMethod('setRandomPositionY', this.setRandomPositionY);
    this.featAddMethod('setRandomStart', this.setRandomStart);
    this.featAddMethod('jitterPos', this.jitterPos);
    this.featAddMethod('seekNearest', this.seekNearest);
    this.featAddMethod('seekNearestVisible', this.seekNearestVisible);
  }

  /** This runs once to initialize the feature for all agents */
  initialize(pm) {
    super.initialize(pm);
    pm.hook('INPUT', this.handleInput);
  }

  decorate(agent) {
    super.decorate(agent);
    TRACKED_AGENTS.set(agent.name, agent);
    this.featAddProp(agent, 'movementType', new GVarString('static'));
    this.featAddProp(agent, 'controller', new GVarString());
    let prop = new GVarNumber(0);
    prop.setMax(Math.PI * 2);
    prop.setMin(0);
    prop.setWrap();
    this.featAddProp(agent, 'direction', prop); // degrees
    this.featAddProp(agent, 'distance', new GVarNumber(0.5));
    this.featAddProp(agent, 'bounceAngle', new GVarNumber(180));
    this.featAddProp(agent, 'isMoving', new GVarBoolean());

    // Initialize internal properties
    agent.prop.Movement._lastMove = 0;
    agent.prop.Movement._orientation = 0;
    agent.prop.Movement._viewDistance = 150;
    agent.prop.Movement._viewAngle = (45 * Math.PI) / 180; // in radians
    // 45 degrees to the left and right of center for a total 90 degree
    // field of vision = 0.785398

    // Internal Properties
    // agent.prop.Movement._x
    // agent.prop.Movement._y
    // agent.prop.Movement._orientation // in radians. not `direction` which is externally set
    // agent.prop.Movement._currentSpeed
    // agent.prop.Movmeent._lastMove
    // agent.prop.Movement._targetId
    // agent.prop.Movement._viewDistance
  }

  handleInput() {
    // hook into INPUT phase and do what needs doing for
    // the feature as a whole
  }

  setController(agent, x) {
    if (DBG) console.log(...PR(`setting control to ${x}`));
    agent.getProp('controller').value = x;
  }

  queuePosition(agent, x, y) {
    m_QueuePosition(agent, x, y);
  }

  // TYPES
  setMovementType(agent: IAgent, type: string, ...params) {
    agent.getFeatProp(FEATID, 'movementType').value = type;
    if (params.length > 0) {
      switch (type) {
        case 'wander':
          // first param is distance
          agent.getFeatProp(FEATID, 'distance').value = params[0];
          break;
        case 'edgeToEdge':
          agent.getFeatProp(FEATID, 'distance').value = params[0];
          agent.getFeatProp(FEATID, 'direction').value = params[1];

          if (params.length > 2) {
            agent.getFeatProp(FEATID, 'bounceAngle').value = params[2];
            if (params[3] === 'rand')
              agent.getFeatProp(FEATID, 'direction').value = m_random(0, 180);
          }
          break;
        case 'jitter':
          // min max
          break;
        case 'seekAgent':
          break;
        default:
      }
    }
  }

  setDirection(agent: IAgent, direction: number) {
    console.log('setting direction to', direction);
    m_setDirection(agent, direction);
  }

  setRandomDirection(agent: IAgent) {
    m_setDirection(agent, m_random(0, 360));
  }

  setRandomPosition(agent: IAgent) {
    const bounds = GetBounds();
    const x = m_random(bounds.left, bounds.right);
    const y = m_random(bounds.top, bounds.bottom);
    m_QueuePosition(agent, x, y);
  }

  setRandomPositionX(agent: IAgent) {
    const bounds = GetBounds();
    const x = m_random(bounds.left, bounds.right);
    m_QueuePosition(agent, x, agent.prop.y.value);
  }

  setRandomPositionY(agent: IAgent) {
    const bounds = GetBounds();
    const y = m_random(bounds.top, bounds.bottom);
    m_QueuePosition(agent, agent.prop.x.value, y);
  }

  setRandomStart(agent: IAgent) {
    this.setRandomDirection(agent);
    this.setRandomPosition(agent);
  }

  jitterPos(agent, min: number = -5, max: number = 5, round: boolean = true) {
    const x = m_random(min, max, round);
    const y = m_random(min, max, round);
    m_QueuePosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
  }

  seekNearest(agent: IAgent, targetType: string) {
    SEEK_AGENTS.set(agent.id, { targetType, useVisionCone: false });
    this.setMovementType(agent, 'seekAgent');
  }

  seekNearestVisible(agent: IAgent, targetType: string) {
    SEEK_AGENTS.set(agent.id, { targetType, useVisionCone: true });
    this.setMovementType(agent, 'seekAgentOrWander');
  }
} // end of feature class

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack(FEATID);
Register(INSTANCE);
