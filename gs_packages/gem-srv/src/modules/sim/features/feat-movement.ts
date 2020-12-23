/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Feature Class!

  This is the "FeaturePack" base class, which you can extend to implement
  your own features.

  TODO: add methods for initialization management

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { NumberProp, StringProp } from 'modules/sim/props/var';
import Feature from 'lib/class-feature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';

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
  const x = m_Random(min, max, round);
  const y = m_Random(min, max, round);
  agent.prop.x.value += x;
  agent.prop.y.value += y;
}

/// WANDER
function moveWander(agent) {
  // Mostly go in the same direction
  // but really change direction once in a while
  const distance = agent.prop.Movement.distance.value;
  let direction = agent.prop.Movement.direction.value;
  if (Math.random() > 0.98) {
    direction += Math.random() * 180;
    agent.prop.Movement.direction.value = direction;
  }
  const angle = m_DegreesToRadians(direction);
  agent.prop.x.value += Math.cos(angle) * distance;
  agent.prop.y.value -= Math.sin(angle) * distance;
  // keep it in bounds
  agent.prop.x.value = Math.max(-500, Math.min(500, agent.prop.x.value));
  agent.prop.y.value = Math.max(-500, Math.min(500, agent.prop.y.value));
}

/// FLOAT
function moveFloat(agent, y: number = -300) {
  // Move to some designated vertical position
  agent.prop.y.value = Math.max(y, agent.prop.y.value - 2);
}

/// Movement Agent Manager
const MOVING_AGENTS = new Map();
UR.SystemHook('SIM/FEATURES_UPDATE', () => {
  const agents = [...MOVING_AGENTS.values()];
  agents.forEach(agent => {
    // handle movement
    const type = agent.prop.Movement.movementType.value;
    switch (type) {
      case 'wander':
        moveWander(agent);
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
class MovementPack extends Feature {
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));
    this.handleInput = this.handleInput.bind(this);
    this.featAddMethod('jitterPos', this.jitterPos);
    this.featAddMethod('setController', this.setController);
    this.featAddMethod('setMovementType', this.setMovementType);
    this.featAddMethod('setDirection', this.setDirection);
    this.featAddMethod('setRandomDirection', this.setRandomDirection);
    this.featAddMethod('setRandomPosition', this.setRandomPosition);
    this.featAddMethod('setRandomStart', this.setRandomStart);
  }

  /** This runs once to initialize the feature for all agents */
  initialize(pm) {
    super.initialize(pm);
    pm.hook('INPUT', this.handleInput);
  }

  decorate(agent) {
    super.decorate(agent);
    MOVING_AGENTS.set(agent.name, agent);
    this.featAddProp(agent, 'movementType', new StringProp('static'));
    this.featAddProp(agent, 'controller', new StringProp());
    let prop = new NumberProp(0);
    prop.setMax(Math.PI * 2);
    prop.setMin(0);
    prop.setWrap();
    this.featAddProp(agent, 'direction', prop); // degrees
    this.featAddProp(agent, 'distance', new NumberProp(0.5));
  }

  handleInput() {
    // hook into INPUT phase and do what needs doing for
    // the feature as a whole
  }

  setController(agent, x) {
    if (DBG) console.log(...PR(`setting control to ${x}`));
    agent.getProp('controller').value = x;
  }

  // TYPES
  //   'wander' -- params: distance
  setMovementType(agent: IAgent, type: string, ...params) {
    agent.featProp(this.name, 'movementType').value = type;
    if (params.length > 0) {
      switch (type) {
        case 'wander':
          // first param is distance
          agent.featProp(this.name, 'distance').value = params[0];
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
    agent.featProp(this.name, 'direction').value = direction;
  }

  setRandomDirection(agent: IAgent) {
    agent.featProp(this.name, 'direction').value = Math.random() * 360;
  }

  setRandomPosition(agent: IAgent) {
    agent.prop.x.value = m_Random(-300, 300); // HACK!  Bounds are hard coded!
    agent.prop.y.value = m_Random(-300, 300); // HACK!  Bounds are hard coded!
  }

  setRandomStart(agent: IAgent) {
    this.setRandomDirection(agent);
    this.setRandomPosition(agent);
  }

  jitterPos(agent, min: number = -5, max: number = 5, round: boolean = true) {
    const x = m_Random(min, max, round);
    const y = m_Random(min, max, round);
    agent.prop.x.value += x;
    agent.prop.y.value += y;
  }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_Random(min, max, round) {
  const n = Math.random() * (max - min) + min;
  if (round) return Math.round(n);
  return n;
}
function m_DegreesToRadians(degree) {
  return (degree * Math.PI) / 180;
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MovementPack('Movement');
Register(INSTANCE);
