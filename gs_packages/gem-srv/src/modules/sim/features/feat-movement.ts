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

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import PROJ from 'app/data/project-data';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('FeatMovement');
const DBG = false;

/// MOVING_AGENTS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// Movement helper functions

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
  const bounds = PROJ.GetBounds();
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
    direction = direction + 180;
  } else if (
    agent.prop.x.value <= bounds.left + hwidth ||
    agent.prop.y.value >= bounds.bottom - hheight
  ) {
    direction = direction - 180;
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

/// Movement Agent Manager
const MOVING_AGENTS = new Map();
UR.HookPhase('SIM/FEATURES_UPDATE', () => {
  const agents = [...MOVING_AGENTS.values()];
  agents.forEach(agent => {
    // handle movement
    const type = agent.prop.Movement.movementType.value;
    switch (type) {
      case 'wander':
        moveWander(agent);
        break;
      case 'edgeToEdge':
        moveEdgeToEdge(agent);
        break;
      case 'jitter':
        moveJitter(agent);
        break;
      case 'float':
        moveFloat(agent);
        break;
      case 'static':
      default:
        break;
    }
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
  //   'wander' -- params: distance
  setMovementType(agent: IAgent, type: string, ...params) {
    agent.getFeatProp(this.name, 'movementType').value = type;
    if (params.length > 0) {
      switch (type) {
        case 'wander':
          // first param is distance
          agent.getFeatProp(this.name, 'distance').value = params[0];
          break;
        case 'edgeToEdge':
          agent.getFeatProp(this.name, 'distance').value = params[0];
          agent.getFeatProp(this.name, 'direction').value = params[1];
          if (params[2] == 'rand')
            agent.getFeatProp(this.name, 'direction').value = m_random(0, 180);
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
    const bounds = PROJ.GetBounds();
    const x = m_random(bounds.left, bounds.right);
    const y = m_random(bounds.top, bounds.bottom);
    m_setPosition(agent, x, y);
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

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_random(min = 0, max = 1, round = false) {
  // REVIEW: Replace with a seeded random number generator
  const n = Math.random() * (max - min) + min;
  if (round) return Math.round(n);
  return n;
}
function m_DegreesToRadians(degree) {
  return (degree * Math.PI) / 180;
}
function m_setPosition(agent, x, y) {
  const bounds = PROJ.GetBounds();
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
  if (PROJ.Wraps('left')) {
    // This lets the agent poke its nose out before wrapping
    // to the other side.  Otherwise, the agent will suddenly
    // pop to other side.
    xx = x <= bounds.left ? bounds.right - pad : xx;
  } else {
    // wall
    if (x - hwidth < bounds.left) {
      xx = bounds.left + hwidth + pad;
      if (bounds.bounce) m_setDirection(agent, m_random(-89, 89));
    }
  }
  if (PROJ.Wraps('right')) {
    xx = x >= bounds.right ? bounds.left + pad : xx;
  } else {
    if (x + hwidth >= bounds.right) {
      xx = bounds.right - hwidth - pad;
      if (bounds.bounce) m_setDirection(agent, m_random(91, 269));
    }
  }
  if (PROJ.Wraps('top')) {
    yy = y <= bounds.top ? bounds.bottom - pad : yy;
  } else {
    if (y - hheight <= bounds.top) {
      yy = bounds.top + hheight + pad;
      if (bounds.bounce) m_setDirection(agent, m_random(181, 359));
    }
  }
  if (PROJ.Wraps('bottom')) {
    yy = y >= bounds.bottom ? bounds.top + pad : yy;
  } else {
    if (y + hheight > bounds.bottom) {
      yy = bounds.bottom - hheight - pad;
      if (bounds.bounce) m_setDirection(agent, m_random(1, 179));
    }
  }
  agent.prop.x.value = xx;
  agent.prop.y.value = yy;
}
function m_setDirection(agent, degrees) {
  console.error('direction', degrees);
  agent.prop.Movement.direction.value = degrees;
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack('Movement');
Register(INSTANCE);
