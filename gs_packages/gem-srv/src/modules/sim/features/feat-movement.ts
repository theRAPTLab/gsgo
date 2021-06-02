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
function m_setDirection(agent, degrees) {
  agent.prop.Movement.direction.value = degrees;
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Processes position request
/// * Checks bounds
/// * Applies bounce
/// But does not actually set the agent x/y until FEATURES_EXEC phase
function m_QueuePosition(agent, x, y) {
  const bounds = GetBounds();
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

  if (
    agent.x === undefined ||
    agent.y === undefined ||
    x === undefined ||
    y === undefined
  )
    return; // Agent position or Movement not set, so ignore

  // 1. Is Moving?
  // inputs come in at a 15fps frame rate, so we need to use hysteresis
  let didMove = false;
  let didMoveWithinWindow = false;
  if (
    Math.abs(agent.x - x) > MOVEDISTANCE ||
    Math.abs(agent.y - y) > MOVEDISTANCE
  ) {
    agent.prop.Movement._lastMove = frame;
    didMove = true;
  } else if (frame - agent.prop.Movement._lastMove < MOVEWINDOW) {
    didMoveWithinWindow = true;
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
    targetAngle = AngleTo(agent, {
      x: agent.prop.Movement._x,
      y: agent.prop.Movement._y
    });
  }
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
  const angle = Deg2Rad(direction);
  const { x, y } = ProjectPoint(agent, angle, distance);
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

  const angle = Deg2Rad(direction);
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
  // stop seeking if target was removed
  // For input agents, target might be defined, but x and y are not
  if (!target || !target.x || !target.y) return;

  // stop seeking if we're close, otherwise agent flips orientation wildly
  if (DistanceTo(agent, target) < 5) return;

  const distance = agent.prop.Movement.distance.value;
  let angle = -AngleTo(agent, target); // flip y
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  m_QueuePosition(agent, x, y);
  // also set direction or agent will revert to wandering
  // towards the old direction
  m_setDirection(agent, Deg2Rad(angle));
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
function m_FindNearbyAgents(agent, targetType) {
  // Only run this after m_FeaturesUpdate sets distances
  if (!agent.distanceTo)
    throw new Error('Set distance before finding nearby agents');
  const nearby = [];
  const targets = GetAgentsByType(targetType);
  targets.forEach(t => {
    const distance = agent.distanceTo.get(t.id);
    if (distance < agent.prop.Vision._viewDistance)
      nearby.push({ agent: t, distance });
  });
  nearby.sort((a, b) => a.distance - b.distance);
  return nearby.map(n => n.agent);
}

/// UPDATES ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function m_FeaturesUpdate(frame) {
  // 1. Cache Distances
  SEEK_AGENTS.forEach((options, id) => {
    const agent = GetAgentById(id);
    const targets = GetAgentsByType(options.targetType);
    if (!agent.distanceTo) agent.distanceTo = new Map();
    targets.forEach(t => {
      agent.distanceTo.set(t.id, DistanceTo(agent, t));
    });
  });
}

function m_FeaturesThink(frame) {
  // 1. Find target Agent
  SEEK_AGENTS.forEach((options, id) => {
    // REVIEW: Distance calculation should ideally only happen once and be cached

    const agent = GetAgentById(id);

    // REVIEW: We should be finding all agents within the visibility distance
    // not just the nearest one.

    // Find nearest agent
    // 1. Start with agents within vision distance
    //    Sorted by distance
    const nearAgents = m_FindNearbyAgents(agent, options.targetType);
    const target = nearAgents.find(near => {
      // 2. Find first agent within the cone
      if (near) {
        if (options.useVisionCone) {
          // console.log('...canSee', near.id, agent.canSee.get(near.id));
          return agent.canSee.get(near.id);
        }
        // not using vision, so target it if found
        return true;
      }
      return false; // stop searching
    });

    // decay untargetting, otherwise, you can flicker between
    // finding and losing a target when pivoting towards the target?
    if (target) {
      // console.log('....setting to', target.id);
      agent.prop.Movement._targetId = target.id;
      agent.prop.Movement._lastTargetFrame = frame;
    } else if (frame - agent.prop.Movement._lastTargetFrame > 10) {
      // delay setting to undefined for 5 frames
      // console.log('....clearing targetId');
      agent.prop.Movement._targetId = undefined;
    } else {
      // console.log('....skipping, no target');
    }
  });

  // 2. Decide on Movement
  const agents = [...TRACKED_AGENTS.values()];
  agents.forEach(agent => {
    // ignore AI movement if input agent
    if (agent.isModePuppet()) return;
    // ignore AI movement if being dragged
    if (agent.isCaptive) return;
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
    this.featAddMethod('setRandomDirection', this.setRandomDirection);
    this.featAddMethod('setRandomPosition', this.setRandomPosition);
    this.featAddMethod('setRandomPositionX', this.setRandomPositionX);
    this.featAddMethod('setRandomPositionY', this.setRandomPositionY);
    this.featAddMethod('setRandomStart', this.setRandomStart);
    this.featAddMethod('jitterPos', this.jitterPos);
    this.featAddMethod('jitterRotate', this.jitterRotate);
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
    this.featAddProp(agent, 'direction', new GVarNumber(0)); // degrees
    this.featAddProp(agent, 'compassDirection', new GVarString()); // readonly
    this.featAddProp(agent, 'distance', new GVarNumber(0.5));
    this.featAddProp(agent, 'bounceAngle', new GVarNumber(180));
    this.featAddProp(agent, 'isMoving', new GVarBoolean());
    this.featAddProp(agent, 'useAutoOrientation', new GVarBoolean(false));

    // Initialize internal properties
    agent.prop.Movement._lastMove = 0;
    agent.prop.Movement._orientation = 0; // in radians. not `direction` which is externally set
    // 45 degrees to the left and right of center for a total 90 degree
    // field of vision = 0.785398

    // Other Internal Properties
    // agent.prop.Movement._x
    // agent.prop.Movement._y
    // agent.prop.Movement._targetId // id of seek target
    // agent.prop.Movement._targetAngle // cached value so input agents can keep turning between updates
    // agent.prop.Movement._jitterRotate
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

  // A single trigger that will clear itself after being run
  // The advantage of setting this as a method is that the script
  // doesn't have to clear the flag afterwards.  This makes it
  // easy to use in a conditional.
  jitterRotate(agent) {
    agent.prop.Movement._jitterRotate = true;
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
