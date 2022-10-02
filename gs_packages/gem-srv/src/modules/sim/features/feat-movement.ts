/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Movement Class!

  Always use m_Random to generate random values.

  Direction
    0  = right
    90 = up

  TODO: add methods for initialization management

  TODO: Rewrite most featCalls as reatProp calls

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import { SM_Boolean, SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Feature from 'lib/class-sm-feature';
import {
  DeleteAgent,
  GetCharactersByType,
  GetAllCharacters,
  DefineInstance,
  GetAgentById
} from 'modules/datacore/dc-sim-agents';
import { RegisterFeature } from 'modules/datacore/dc-sim-data';
import * as ACMetadata from 'modules/appcore/ac-metadata';
import { intersect } from 'lib/vendor/js-intersect';
import { ANGLES } from 'lib/vendor/angles';
import {
  AngleTo,
  Deg2Rad,
  DistanceTo,
  Lerp,
  ProjectPoint,
  Rotate
} from 'lib/util-vector';

ANGLES.SCALE = Math.PI * 2; // radians
ANGLES.DIRECTIONS = ['E', 'W'];

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Movement';
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

let BOUNDS = UR.ReadFlatStateGroups('metadata');

const MOVEWINDOW = 10; // A move will leave `isMoved` active for this number of frames
const MOVEDISTANCE = 3; // Minimum distance moved before `isMoved` is registered
// This is necessary to account for input jitter
// 1 is too quirky
// 5 seems too high for predator bees

/// Movement Agent Manager
const MOVEMENT_AGENTS = new Map();
const SEEKING_AGENTS = new Map(); // agents that are actively seeking something

/// MOVING_AGENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_random(min = 0, max = 1, round = false) {
  const n = RNG() * (max - min) + min;
  if (round) return Math.round(n);
  return n;
}
function m_setDirection(agent, degrees) {
  agent.prop.Movement.direction.value = degrees;
}

function urStateUpdated(stateObj, cb) {
  const { metadata } = stateObj;
  BOUNDS = { ...BOUNDS, ...metadata };

  if (typeof cb === 'function') cb();
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Processes position request
/// * Checks bounds
/// * Applies bounce
/// But does not actually set the agent x/y until FEATURES_EXEC phase
function m_QueuePosition(agent, x, y) {
  const bounds = BOUNDS;
  const pad = 1; // default 5, 10 was too big and too far, try one to get close to edge?
  let hwidth = pad; // half width -- default to some padding
  let hheight = pad;

  // Edge Testing
  // Don't bother with physics body because some conditions, e.g. isCenteredOn
  // requires a predator agent to have a center all the way to the edge
  // of the stage to match (and eat moths).  This means agents will
  // extend beyond the edge of the stage, but that's better than not being
  // able to reach an agent on the edge.
  //
  // // If agent uses physics, we can get height/width, otherwise default
  // // to small padding.
  // if (agent.hasFeature('Physics')) {
  //   hwidth = agent.callFeatMethod('Physics', 'getBodyWidth') / 2;
  //   hheight = agent.callFeatMethod('Physics', 'getBodyHeight') / 2;
  // }
  let xx = x;
  let yy = y;

  if (!agent.isCaptive) {
    // only bounds check if not being dragged
    if (ACMetadata.Wraps('left')) {
      // This lets the agent poke its nose out before wrapping
      // to the other side.  Otherwise, the agent will suddenly
      // pop to other side.
      xx = x <= bounds.left ? bounds.right - pad : xx;
    } else if (x - hwidth < bounds.left) {
      // wall
      xx = bounds.left + hwidth + pad;
      // REVIEW: Technically this is not a bounce.
      // The walls are "solid", so the agent changes direction.
      // It is not a real physics collision.
      if (bounds.bounce) {
        m_setDirection(agent, m_random(-89, 89));
        if (DBG) console.log('bounce left');
      }
    }
    if (ACMetadata.Wraps('right')) {
      xx = x >= bounds.right ? bounds.left + pad : xx;
    } else if (x + hwidth >= bounds.right) {
      xx = bounds.right - hwidth - pad;
      if (bounds.bounce) {
        m_setDirection(agent, m_random(91, 269));
        if (DBG) console.log('bounce right');
      }
    }
    if (ACMetadata.Wraps('top')) {
      yy = y <= bounds.top ? bounds.bottom - pad : yy;
    } else if (y - hheight <= bounds.top) {
      yy = bounds.top + hheight + pad;
      if (bounds.bounce) {
        m_setDirection(agent, m_random(181, 359));
        if (DBG) console.log('bounce top');
      }
    }
    if (ACMetadata.Wraps('bottom')) {
      yy = y >= bounds.bottom ? bounds.top + pad : yy;
    } else if (y + hheight > bounds.bottom) {
      yy = bounds.bottom - hheight - pad;
      if (bounds.bounce) {
        m_setDirection(agent, m_random(1, 179));
        if (DBG) console.log('bounce bottom');
      }
    }
  }

  agent.prop.Movement._x = xx;
  agent.prop.Movement._y = yy;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FEATURES_EXEC
/// Calculate derived properties
function m_ProcessPosition(agent, frame) {
  // REVIEW
  // If the agent uses Movement, then we MUST derive isMoving and set orientation
  // But if the agent has no movement methods defined AND/OR the agent position
  // was set directly, we still have to fall back to that position.  In other
  // words, we don't want to skip the update!

  let x = agent.prop.Movement._x;
  let y = agent.prop.Movement._y;

  // Fallback Code
  // Movement._x might not be defined if position was set directly
  // via setting agent.x/agent.y in an initScript.
  if (x === undefined || y === undefined) {
    // agent.prop.Movement._x/y was not defined, so fall back to default
    x = agent.x === undefined ? 0 : agent.x; // if agent.x is undefined, fall back to 0
    y = agent.y === undefined ? 0 : agent.y;
  }

  // 1. Is Moving?
  // inputs come in at a 15fps frame rate, so we need to use hysteresis
  let didMove = false;
  let didMoveWithinWindow = false;
  if (agent.isModePuppet()) {
    // agent is char control or pozyx agent so only set isMoving if moved a minimal MOVEDISTANCE
    if (
      Math.abs(agent.x - x) > MOVEDISTANCE ||
      Math.abs(agent.y - y) > MOVEDISTANCE
    ) {
      agent.prop.Movement._lastMove = frame;
      didMove = true;
    }
  } else if (Math.abs(agent.x - x) > 0 || Math.abs(agent.y - y) > 0) {
    // agent is AI so detect ANY movement
    agent.prop.Movement._lastMove = frame;
    didMove = true;
  } else {
    // console.log(
    //   'move < MOVEDISTANCE',
    //   Math.abs(agent.x - x),
    //   Math.abs(agent.y - y)
    // );
  }
  if (frame - agent.prop.Movement._lastMove < MOVEWINDOW) {
    didMoveWithinWindow = true; // moved within a period of time
  }
  agent.prop.Movement.isMoving.setTo(didMove || didMoveWithinWindow);

  // 2. Set Orientation
  //    If jitterRotate is triggered, jitter and skip orientation
  if (agent.prop.Movement._jitterRotate) {
    agent.prop.orientation.setTo(RNG() * Math.PI * 2);
    agent.prop.Movement._jitterRotate = false;
    return;
  }
  // Only set orientation if the agent did move, otherwise,
  // input characters will always revert to orientation 0
  // This way the last direction is maintained]
  let targetAngle;
  let lerpPct = 0.25;
  if (agent.isModePuppet() && !didMove) {
    // keep turning towards the old direction
    targetAngle = agent.prop.Movement._targetAngle;
    lerpPct = 0.8; // force quicker turn for input agents so it feels more responsive
    if (!targetAngle) return; // skip if it hasn't been set
  } else {
    targetAngle = AngleTo(agent, { x, y });
  }

  // don't turn if we're already on target, otherwise, NPCs end up turning
  // to 0 orientation
  if (Math.abs(agent.x - x) < 1 && Math.abs(agent.y - y) < 1) return;

  // ease into the turn
  const currAngle = agent.prop.Movement._orientation;
  const turnDirection = ANGLES.shortestDirection(currAngle, targetAngle);
  const orientation = ANGLES.lerp(currAngle, targetAngle, lerpPct, turnDirection);
  agent.prop.Movement._targetAngle = targetAngle; // save for future lerp
  agent.prop.Movement._orientation = orientation;
  if (agent.prop.Movement.useAutoOrientation.value)
    agent.prop.orientation.setTo(orientation);
  agent.prop.Movement.compassDirection.setTo(
    // For N/E/S/W Use `orientation + Math.PI / 2`
    // For E/W Use `orientation + Math.PI / 4`
    ANGLES.compass(orientation + Math.PI / 4)
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// VIZ_UPDATE
function m_SetPosition(agent, frame) {
  const x =
    agent.prop.Movement._x !== undefined ? agent.prop.Movement._x : agent.x; // Fall back to x, set by MapEditor
  const y =
    agent.prop.Movement._y !== undefined ? agent.prop.Movement._y : agent.y; // Fall back to y, set by MapEditor
  if (x === undefined || y === undefined) return; // Movement not set, so ignore
  agent.prop.Movement._x = x; // if Movement._x wasn't previously set, update it now
  agent.prop.Movement._y = y;
  agent.prop.x.value = x;
  agent.prop.y.value = y;
}

/// MOVEMENT TYPES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// JITTER
function moveJitter(agent: IAgent) {
  const min = -agent.prop.Movement.jitterDistance.value;
  const max = agent.prop.Movement.jitterDistance.value;
  const round = true;
  const x = m_random(min, max, round);
  const y = m_random(min, max, round);
  m_QueuePosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// WANDER
function moveWander(agent: IAgent) {
  // Mostly go in the same direction
  // but really change direction once in a while
  const distance = agent.prop.Movement.distance.value;
  let direction = agent.prop.Movement.direction.value;
  if (m_random() > 0.98 && agent.prop.Movement.doRandomOnWander.value) {
    direction += m_random(-90, 90);
    agent.prop.Movement.direction.value = direction;
  }
  const angle = Deg2Rad(direction);
  const { x, y } = ProjectPoint(agent, angle, distance);
  m_QueuePosition(agent, x, y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// EDGE to EDGE (of the entire tank / system)
/// Go in the same direction most of the way across the space, then turn back and do similar
function moveEdgeToEdge(agent: IAgent) {
  const bounds = BOUNDS;
  const pad = 5;
  let hwidth = pad; // half width -- default to some padding
  let hheight = pad;

  // If agent uses physics, we can get height/width, otherwise default
  // to small padding.
  if (agent.hasFeature('Physics')) {
    hwidth = agent.getFeatProp('Physics', 'bodyWidth').value / 2;
    hheight = agent.getFeatProp('Physics', 'bodyHeight').value / 2;
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

  const angle = Deg2Rad(direction);
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;

  // we handled our own bounce, so set x and y directly
  agent.prop.Movement._x = x;
  agent.prop.Movement._y = y;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// moveSetLocation -- set position immediately (don't move there)
function moveSetLocation(agent: IAgent) {
  // grab the targetX and targetY
  const x = agent.prop.Movement.targetX.value;
  const y = agent.prop.Movement.targetY.value;
  m_QueuePosition(agent, x, y);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// goLocation
function moveGoLocation(agent: IAgent) {
  // move toward targetX and targetY at speed of distance
  const distance = agent.prop.Movement.distance.value;

  // grab the targetX and targetY
  const targetX = agent.prop.Movement.targetX.value;
  const targetY = agent.prop.Movement.targetY.value;

  const target = {
    x: targetX,
    y: targetY
  };

  // if we are withing 1/2 of the 'speed' of the target, we can stop
  if (DistanceTo(agent, target) < distance / 2) return;

  const angle = -AngleTo(agent, target); // flip y

  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  m_QueuePosition(agent, x, y);

  m_setDirection(agent, angle);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FLOAT
function moveFloat(agent, y: number = -300) {
  // Move to some designated vertical position
  agent.prop.y.value = Math.max(y, agent.prop.y.value - 2);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Seek
function seek(agent: IAgent, target: { x; y }) {
  // stop seeking if target was removed
  // For input agents, target might be defined, but x and y are not
  if (!target || target.x === undefined || target.y === undefined) return;

  // stop seeking if we're close, otherwise agent flips orientation wildly
  if (DistanceTo(agent, target) < 5) return;

  const distance = agent.prop.Movement.distance.value;
  let angle = -AngleTo(agent, target); // flip y
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  m_QueuePosition(agent, x, y);
  // also set direction or agent will revert to wandering
  // towards the old direction
  m_setDirection(agent, angle);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// _seekAgent
function _seekAgent(agent: IAgent) {
  const targetId = agent.prop.Movement._targetId;
  if (!targetId) return; // no target, just idle
  const target = GetAgentById(targetId);
  seek(agent, target);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// _seekAgentOrWander
/// -- Move toward the target agent until the targetId
///    is removed (e.g. if you lost sight of it).  Then just wander.
function _seekAgentOrWander(agent: IAgent, frame: number) {
  const targetId = agent.prop.Movement._targetId;
  if (!targetId) {
    moveWander(agent); // no target, wander instead
    return;
  }
  const target = GetAgentById(targetId);
  seek(agent, target);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// wanderUntilAgent
function wanderUntilAgent(agent: IAgent, frame: number) {
  // Requires Touches
  const fn = `wanderUntilAgent`;
  if (!agent.hasFeature('Physics')) console.error(fn, 'requires Physics!');
  if (!agent.hasFeature('Touches'))
    console.error(fn, 'requires Touches monitoring "binb"!');
  // if (!INSIDE_AGENTS.has(agent.id)) {
  if (!agent.prop.Movement.targetCharacterType.value) {
    console.error(
      fn,
      'could not find a registered targetType for',
      agent.id,
      agent.blueprint.name,
      '. Perhaps its freshly spawned/cloned and you did not set the "wanderUntilInside" targetType yet?  Reverting movement type to static.'
    );
    agent.prop.Movement.movementType.setTo('stop');
    return;
  }
  const targetType = agent.prop.Movement.targetCharacterType.value;
  const targets = GetCharactersByType(targetType);
  let isInside = false;
  targets.forEach(target => {
    // for some reason `target.id` is a number not a string?
    const targetId = String(target.id);
    if (
      agent.isTouching &&
      agent.isTouching.get(targetId) &&
      agent.isTouching.get(targetId).binb
    ) {
      isInside = true;
    }
  });
  if (!isInside) moveWander(agent); // no target, wander instead
  // else just sit
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Movement Function Library
const MOVEMENT_FUNCTIONS: Map<string, Function> = new Map([
  ['stop'.toLowerCase(), undefined],
  ['wander'.toLowerCase(), moveWander],
  ['edgeToEdge'.toLowerCase(), moveEdgeToEdge],
  ['setLocation'.toLowerCase(), moveSetLocation],
  ['goLocation'.toLowerCase(), moveGoLocation],
  ['jitter'.toLowerCase(), moveJitter],
  ['float'.toLowerCase(), moveFloat],
  ['wanderUntilAgent'.toLowerCase(), wanderUntilAgent],
  ['_seekAgent'.toLowerCase(), _seekAgent], // internal method!
  ['_seekAgentOrWander'.toLowerCase(), _seekAgentOrWander] // internal method!
]);

/// SEEK ALGORITHMS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_FindNearestAgent(agent, targetType) {
  let shortestDistance: number = Infinity;
  let nearestAgent;
  const targetAgents = GetAllCharacters();
  targetAgents.forEach(t => {
    if (t.blueprint.name !== targetType) return; // skip if wrong blueprint type
    if (t.id === agent.id) return; // skip self
    const d = DistanceTo(agent, t);
    if (d < shortestDistance) {
      shortestDistance = d;
      nearestAgent = t;
    }
  });
  return nearestAgent;
}
/// Returns array of all agents of targetType that are within the vision distance
/// NOTE This is a pre-filter before using the more expensive vision cone processing
/// NOTE This assumes Vision
function m_FindNearbyAgents(agent, targetType) {
  // Only run this after m_FeaturesUpdate sets distances
  if (!agent.distanceTo) {
    console.log(
      `m_FindNearbyAgents skipping ${agent.blueprint.name} ${agent.id} because distanceTo was not yet calculated by SIM/PHYSICS_UPDATE.`
    );
    return [];
  }
  const nearby = [];
  const targets = GetCharactersByType(targetType);
  targets.forEach(t => {
    const distance = agent.distanceTo.get(t.id);
    if (distance < agent.prop.Vision.viewDistance.value)
      nearby.push({ agent: t, distance });
  });
  nearby.sort((a, b) => a.distance - b.distance);
  return nearby.map(n => n.agent);
}

/// UPDATES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// PHYSICS_UPDATE
function m_PhysicsUpdate(frame) {
  // 1. Cache Distances
  SEEKING_AGENTS.forEach((options, id) => {
    const agent = GetAgentById(id);
    if (!agent) return;
    const targets = GetCharactersByType(options.targetType);
    if (!agent.distanceTo) agent.distanceTo = new Map();
    targets.forEach(t => {
      agent.distanceTo.set(t.id, DistanceTo(agent, t));
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// FEATURES_THINK
function m_FeaturesThinkSeek(frame) {
  SEEKING_AGENTS.forEach((options, id) => {
    // REVIEW: Distance calculation should ideally only happen once and be cached

    const agent = GetAgentById(id);
    if (!agent) return;

    // REVIEW: We should be finding all agents within the visibility distance
    // not just the nearest one.

    // Find nearest agent
    // 1. Start with agents within vision distance
    //    Sorted by distance
    const nearAgents = m_FindNearbyAgents(agent, options.targetType);
    if (nearAgents === undefined) return; // no agents
    const target = nearAgents.find(near => {
      // 2. Find first active (non-inert) agent within the cone
      if (near && !near.isInert) {
        if (options.useVisionColor) {
          // console.log('...canSeeColor', near.id, agent.canSeeColor.get(near.id));
          return agent.canSeeColor.get(near.id);
        }
        if (options.useVisionCone) {
          // console.log('...canSeeCone', near.id, agent.canSeeCone.get(near.id));
          return agent.canSeeCone.get(near.id);
        }
        // not using vision, so target it if found
        return true;
      }
      return false; // stop searching
    });

    // decay untargetting, otherwise, you can flicker between
    // finding and losing a target when pivoting towards the target?
    if (target) {
      // console.error('....setting target to', target.id);
      agent.prop.Movement._targetId = target.id;
      agent.prop.Movement._lastTargetFrame = frame;
    } else if (frame - agent.prop.Movement._lastTargetFrame > 10) {
      // delay setting to undefined for 10 frames
      // console.log('....clearing targetId');
      agent.prop.Movement._targetId = undefined;
    } else {
      // console.log('....skipping, no target');
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_InputsUpdate(frame) {
  // 2. Decide on Movement
  const agents = [...MOVEMENT_AGENTS.values()];
  agents.forEach(agent => {
    if (!agent) return;
    // being controlled by a cursor
    if (agent.cursor) m_QueuePosition(agent, agent.cursor.x, agent.cursor.y);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_FeaturesThink(frame) {
  // 1. Process Seek agents: Find target Agent
  m_FeaturesThinkSeek(frame);
  // 2. Decide on Movement
  const agents = [...MOVEMENT_AGENTS.values()];
  agents.forEach(agent => {
    if (!agent) return;
    // ignore AI movement if input agent
    if (agent.isModePuppet()) return;
    // ignore AI movement if under cursor control
    if (agent.cursor) return;
    // ignore AI movement if being dragged
    if (agent.isCaptive) return;
    // ignore AI movement if inert
    if (agent.isInert) return;
    // handle movement
    const moveType = String(agent.prop.Movement.movementType.value).toLowerCase();
    const moveFn = MOVEMENT_FUNCTIONS.get(moveType);
    // cancel seek?  NOTE: seek stops one frame after
    if (!['seekAgent', 'seekAgentOrWander'].includes(moveType))
      SEEKING_AGENTS.delete(agent.id);
    if (moveFn) moveFn(agent, frame);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_FeaturesExec(frame) {
  // 3. Calculate derived properties (e.g. isMoving)
  const agents = [...MOVEMENT_AGENTS.values()];
  agents.forEach(agent => {
    if (!agent) return;
    m_ProcessPosition(agent, frame);
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_VizUpdate(frame) {
  // 4. Apply Positions
  const agents = [...MOVEMENT_AGENTS.values()];
  agents.forEach(agent => {
    if (!agent) return;
    m_SetPosition(agent, frame);
  });
}

/// HOOKS /////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

UR.HookPhase('SIM/PHYSICS_UPDATE', m_PhysicsUpdate);
UR.HookPhase('SIM/INPUTS_UPDATE', m_InputsUpdate);
UR.HookPhase('SIM/FEATURES_THINK', m_FeaturesThink);
UR.HookPhase('SIM/FEATURES_EXEC', m_FeaturesExec);
UR.HookPhase('SIM/VIS_UPDATE', m_VizUpdate);
// using VIS_UPDATE instead of FEATURES_EXEC here because
// we need to update input agents during PRE_RUN, otherwise, input controls
// will not show up until you run the sim

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MovementPack extends SM_Feature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
    this.handleInput = this.handleInput.bind(this);
    // this.featAddMethod('setController', this.setController);
    this.featAddMethod('queuePosition', this.queuePosition);
    this.featAddMethod('setRandomDirection', this.setRandomDirection);
    this.featAddMethod('setRandomPosition', this.setRandomPosition);
    this.featAddMethod('setRandomPositionX', this.setRandomPositionX);
    this.featAddMethod('setRandomPositionY', this.setRandomPositionY);
    this.featAddMethod('setRandomStart', this.setRandomStart);
    this.featAddMethod('setRandomStartPosition', this.setRandomStartPosition);
    this.featAddMethod('jitterPos', this.jitterPos);
    this.featAddMethod('jitterRotate', this.jitterRotate);
    this.featAddMethod('seekNearest', this.seekNearest);
    this.featAddMethod('seekNearestVisibleCone', this.seekNearestVisibleCone);
    this.featAddMethod('seekNearestVisibleColor', this.seekNearestVisibleColor);

    UR.SubscribeState('metadata', urStateUpdated);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  initialize(pm) {
    super.initialize(pm);
    pm.hook('INPUT', this.handleInput);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'movementType', new SM_String('stop'));
    this.featAddProp(agent, 'direction', new SM_Number(0)); // degrees
    this.featAddProp(agent, 'compassDirection', new SM_String()); // readonly
    this.featAddProp(agent, 'distance', new SM_Number(0.5));
    this.featAddProp(agent, 'jitterDistance', new SM_Number(5)); // degrees
    this.featAddProp(agent, 'bounceAngle', new SM_Number(180));
    this.featAddProp(agent, 'doRandomOnWander', new SM_Boolean(true));
    this.featAddProp(agent, 'isMoving', new SM_Boolean());
    this.featAddProp(agent, 'useAutoOrientation', new SM_Boolean(false));
    this.featAddProp(agent, 'targetX', new SM_Number(0)); // so that we can set a location in pieces and go to it
    this.featAddProp(agent, 'targetY', new SM_Number(0));
    this.featAddProp(agent, 'targetCharacterType', new SM_String()); // readonly

    // Initialize internal properties
    agent.prop.Movement._lastMove = 0;
    agent.prop.Movement._orientation = 0; // in radians. not `direction` which is externally set
    // 45 degrees to the left and right of center for a total 90 degree
    // field of vision = 0.785398

    // Set _x and _y to undefined at first so that
    // viz_update.SetPositiion can know to use agent.x
    agent.prop.Movement._x = undefined; // the next x postion.  Call it `_nextX`?
    agent.prop.Movement._y = undefined;

    // Other Internal Properties
    // Set default values?
    // agent.prop.Movement._targetId // id of seek target
    // agent.prop.Movement._targetAngle // cached value so input agents can keep turning between updates
    // agent.prop.Movement._jitterRotate

    MOVEMENT_AGENTS.set(agent.id, agent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    MOVEMENT_AGENTS.clear();
    SEEKING_AGENTS.clear();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  handleInput() {
    // hook into INPUT phase and do what needs doing for
    // the feature as a whole
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  queuePosition(agent: IAgent, x: number, y: number) {
    m_QueuePosition(agent, x, y);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // MOVEMENTTYPE METHODS
  // These are convenience functions.
  // Each can be set separately via featProps.
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomDirection(agent: IAgent) {
    m_setDirection(agent, m_random(0, 360));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomBoundedPosition(
    agent: IAgent,
    bounds: { left: number; right: number; top: number; bottom: number }
  ) {
    const x = m_random(bounds.left, bounds.right);
    const y = m_random(bounds.top, bounds.bottom);
    m_QueuePosition(agent, x, y);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomPosition(agent: IAgent) {
    this.setRandomBoundedPosition(agent, BOUNDS);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomPositionX(agent: IAgent) {
    const x = m_random(BOUNDS.left, BOUNDS.right);
    m_QueuePosition(agent, x, agent.prop.y.value);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomPositionY(agent: IAgent) {
    const y = m_random(BOUNDS.top, BOUNDS.bottom);
    m_QueuePosition(agent, agent.prop.x.value, y);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomStart(agent: IAgent) {
    this.setRandomDirection(agent);
    this.setRandomPosition(agent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  setRandomStartPosition(agent: IAgent, width: number, height: number) {
    const hwidth = width / 2;
    const hheight = height / 2;
    this.setRandomBoundedPosition(agent, {
      left: -hwidth,
      right: hwidth,
      top: -hheight,
      bottom: hheight
    });
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  jitterPos(agent, min: number = -5, max: number = 5, round: boolean = true) {
    const x = m_random(min, max, round);
    const y = m_random(min, max, round);
    m_QueuePosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // A single trigger that will clear itself after being run
  // The advantage of setting this as a method is that the script
  // doesn't have to clear the flag afterwards.  This makes it
  // easy to use in a conditional.
  jitterRotate(agent) {
    agent.prop.Movement._jitterRotate = true;
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  seekNearest(agent: IAgent, targetType: string) {
    // Clear any existing target.  This is especially important between rounds.
    agent.prop.Movement._targetId = undefined;
    SEEKING_AGENTS.set(agent.id, { targetType, useVisionCone: false });
    agent.prop.Movement.movementType.setTo('_seekAgent');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // vision cone visible
  seekNearestVisibleCone(agent: IAgent, targetType: string) {
    // Clear any existing target.  This is especially important between rounds.
    agent.prop.Movement._targetId = undefined;
    SEEKING_AGENTS.set(agent.id, { targetType, useVisionCone: true });
    agent.prop.Movement.movementType.setTo('_seekAgentOrWander');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // color visible
  seekNearestVisibleColor(agent: IAgent, targetType: string) {
    // Clear any existing target.  This is especially important between rounds.
    agent.prop.Movement._targetId = undefined;
    SEEKING_AGENTS.set(agent.id, { targetType, useVisionColor: true });
    agent.prop.Movement.movementType.setTo('_seekAgentOrWander');
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(MovementPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return MovementPack.Symbolize();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      movementType: SM_String.SymbolizeCustom({
        setTo: ['movementTypeString:string']
      }),
      direction: SM_Number.SymbolizeCustom({
        setTo: ['degreesNumber:number']
      }),
      // direction: SM_Number.Symbols,
      compassDirection: SM_String.Symbols,
      distance: SM_Number.Symbols,
      jitterDistance: SM_Number.Symbols,
      bounceAngle: SM_Number.Symbols,
      isMoving: SM_Number.Symbols,
      useAutoOrientation: SM_Boolean.Symbols,
      targetX: SM_Number.Symbols,
      targetY: SM_Number.Symbols,
      targetCharacterType: SM_String.Symbols
    },
    methods: {
      // setController: { args: ['x:number'] },
      queuePosition: { args: ['x:number', 'y:number'] },
      setRandomDirection: {}, // => use agent.prop.Movement.direction.value setToRnd 0 360
      setRandomPosition: {}, // keep b/c of bounds checking
      setRandomPositionX: {}, // keep b/c of bounds checking
      setRandomPositionY: {}, // keep b/c of bounds checking
      setRandomStart: {}, // => use direction + random Position?
      setRandomStartPosition: { args: ['width:number', 'height:number'] },
      jitterPos: { args: ['min:number', 'max:number', 'round:boolean'] },
      jitterRotate: {},
      seekNearest: { args: ['targetType:string'] },
      seekNearestVisibleCone: { args: ['targetType:string'] },
      seekNearestVisibleColor: { args: ['targetType:string'] }
    }
  };
} // end of feature class

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack(FEATID);
RegisterFeature(INSTANCE);
