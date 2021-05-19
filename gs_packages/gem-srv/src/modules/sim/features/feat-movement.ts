/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  Always use m_Random to generate random values.

  Direction
    0  = right
    90 = up

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import RNG from 'modules/sim/sequencer';
import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import { GetBounds, Wraps } from 'modules/datacore/dc-project';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Movement';
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

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
function m_setDirection(agent, degrees) {
  agent.prop.Movement.direction.value = degrees;
}
function m_setPosition(agent, x, y) {
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
  agent.prop.x.value = xx;
  agent.prop.y.value = yy;
}

/// JITTER
function moveJitter(
  agent,
  min: number = -5,
  max: number = 5,
  round: boolean = true
) {
  const x = m_random(min, max, round);
  const y = m_random(min, max, round);
  m_setPosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
}

/// WANDER
function moveWander(agent) {
  // Mostly go in the same direction
  // but really change direction once in a while
  const distance = agent.prop.Movement.distance.value;
  let direction = agent.prop.Movement.direction.value;
  if (m_random() > 0.98) {
    direction += m_random(-90, 90);
    agent.prop.Movement.direction.value = direction;
  }
  const angle = m_DegreesToRadians(direction);
  const x = agent.prop.x.value + Math.cos(angle) * distance;
  const y = agent.prop.y.value - Math.sin(angle) * distance;
  m_setPosition(agent, x, y);
}

/// EDGE to EDGE (of the entire tank / system)
// Go in the same direction most of the way across the space, then turn back and do similar

function moveEdgeToEdge(agent) {
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
  agent.prop.x.value = x;
  agent.prop.y.value = y;
}

/// FLOAT
function moveFloat(agent, y: number = -300) {
  // Move to some designated vertical position
  agent.prop.y.value = Math.max(y, agent.prop.y.value - 2);
}

/// Movement Function Library
const MOVEMENT_FUNCTIONS = new Map([
  ['static', undefined],
  ['wander', moveWander],
  ['edgeToEdge', moveEdgeToEdge],
  ['jitter', moveJitter],
  ['float', moveFloat]
]);

/// Movement Agent Manager
const MOVING_AGENTS = new Map();
UR.HookPhase('SIM/FEATURES_UPDATE', () => {
  const agents = [...MOVING_AGENTS.values()];
  agents.forEach(agent => {
    // ignore AI movement if input agent
    if (agent.isModePuppet()) return;
    // handle movement
    const moveFn = MOVEMENT_FUNCTIONS.get(agent.prop.Movement.movementType.value);
    if (moveFn) moveFn(agent);
  });
});

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MovementPack extends GFeature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
    this.handleInput = this.handleInput.bind(this);
    this.featAddMethod('setController', this.setController);
    this.featAddMethod('setPosition', this.setPosition);
    this.featAddMethod('setMovementType', this.setMovementType);
    this.featAddMethod('setDirection', this.setDirection);
    this.featAddMethod('setRandomDirection', this.setRandomDirection);
    this.featAddMethod('setRandomPosition', this.setRandomPosition);
    this.featAddMethod('setRandomPositionX', this.setRandomPositionX);
    this.featAddMethod('setRandomPositionY', this.setRandomPositionY);
    this.featAddMethod('setRandomStart', this.setRandomStart);
    this.featAddMethod('jitterPos', this.jitterPos);
  }

  /** This runs once to initialize the feature for all agents */
  initialize(pm) {
    super.initialize(pm);
    pm.hook('INPUT', this.handleInput);
  }

  decorate(agent) {
    super.decorate(agent);
    MOVING_AGENTS.set(agent.name, agent);
    this.featAddProp(agent, 'movementType', new GVarString('static'));
    this.featAddProp(agent, 'controller', new GVarString());
    let prop = new GVarNumber(0);
    prop.setMax(Math.PI * 2);
    prop.setMin(0);
    prop.setWrap();
    this.featAddProp(agent, 'direction', prop); // degrees
    this.featAddProp(agent, 'distance', new GVarNumber(0.5));
    this.featAddProp(agent, 'bounceAngle', new GVarNumber(180));
  }

  handleInput() {
    // hook into INPUT phase and do what needs doing for
    // the feature as a whole
  }

  setController(agent, x) {
    if (DBG) console.log(...PR(`setting control to ${x}`));
    agent.getProp('controller').value = x;
  }

  setPosition(agent, x, y) {
    m_setPosition(agent, x, y);
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
    m_setPosition(agent, x, y);
  }

  setRandomPositionX(agent: IAgent) {
    const bounds = GetBounds();
    const x = m_random(bounds.left, bounds.right);
    m_setPosition(agent, x, agent.prop.y.value);
  }

  setRandomPositionY(agent: IAgent) {
    const bounds = GetBounds();
    const y = m_random(bounds.top, bounds.bottom);
    m_setPosition(agent, agent.prop.x.value, y);
  }

  setRandomStart(agent: IAgent) {
    this.setRandomDirection(agent);
    this.setRandomPosition(agent);
  }

  jitterPos(agent, min: number = -5, max: number = 5, round: boolean = true) {
    const x = m_random(min, max, round);
    const y = m_random(min, max, round);
    m_setPosition(agent, agent.prop.x.value + x, agent.prop.y.value + y);
  }
} // end of feature class

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack(FEATID);
Register(INSTANCE);
