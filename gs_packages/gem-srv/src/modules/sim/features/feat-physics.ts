/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Physics Class!

  `shape` defines the type of boundary: radius vs height/width
  `shape` defaults to CIRCLE.

  You generally want to define Costume and sprite before `init`ing Physics
  so that the size can be automatically set.

  Eventually this might cover:
  * Boundaries
  * Intersection
  * Laws of motion
  * Reaction test
  * Change laws of motion properties
    -  acceleration (change in velocity), mass, moment of inertia, speed dx/dy

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { GetAgentById } from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PhysicsPack');
const DBG = false;

const CIRCLE = 'circle';
const RECTANGLE = 'rectangle';

const PHYSICS_AGENTS = new Map();

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * PHYSICS_AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  if (!a) PHYSICS_AGENTS.delete(agentId);
  return a;
}

/// PHYSICS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Physics Update Loop -- Runs once per gameloop
 * Sets physics body and agent scale based on an application of
 * user-defined scale to user-defined width / height
 */
function m_update(frame) {
  const agentIds = Array.from(PHYSICS_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) {
      // console.error('could not find', agentId, 'Probably removed?');
      return;
    }
    // 1. Get Costume Defaults
    const cw = agent.getFeatProp('Physics', 'costumeWidth').value;
    const ch = agent.getFeatProp('Physics', 'costumeHeight').value;
    //    Get User-Defined W/H Overrides (defaults to costume size if not set explicitly)
    const w = agent.callFeatMethod('Physics', 'getWidth'); //  use featMethod
    const h = agent.callFeatMethod('Physics', 'getHeight'); // because might be circle
    //    Get Current Scale Overrides
    const scale = agent.getFeatProp('Physics', 'scale').value;
    const scaleY = agent.getFeatProp('Physics', 'scaleY').value || scale;

    //    Calculate new size (apply scale to user-defined w/h)
    let newW;
    let newH;
    if (scale) {
      newW = scale * w; // apply scale on top of width overrides
      newH = scaleY * h;
    } else {
      newW = w;
      newH = h;
    }

    // 2. Update Physics Body
    agent.getFeatProp('Physics', 'bodyWidth').setTo(newW);
    agent.getFeatProp('Physics', 'bodyHeight').setTo(newH);

    // 3. Update Agent Scale if necessary
    const newScale = newW / cw;
    const newScaleY = newH / ch;
    if (newScale !== agent.scale || newScaleY !== agent.scaleY) {
      agent.scale = newScale;
      agent.scaleY = newScaleY;
    }
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhysicsPack extends GFeature {
  //
  constructor(name) {
    super(name);
    // REVIEW: Is it necessary for these to be accessible to students/scripts?
    // should these just be private methods?
    this.featAddMethod('setShape', this.setShape);
    this.featAddMethod('setSize', this.setSize);
    this.featAddMethod('setRadius', this.setRadius);
    this.featAddMethod('getWidth', this.getWidth);
    this.featAddMethod('getHeight', this.getHeight);
    this.featAddMethod('getBounds', this.getBounds);

    UR.HookPhase('SIM/PHYSICS', m_update);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
  // initalize is not implemented and currently DOES NOT RUN!!!!
  initialize(simloop) {
    super.initialize(simloop);
    simloop.hook('INPUT', frame => console.log(frame));
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Add physics-specific properties to the agent. The feature methods
   *  are defined inside the featurepack instance, not the agent instance
   *  as props are.
   */
  decorate(agent) {
    super.decorate(agent);
    // add feature props here
    this.featAddProp(agent, 'shape', new GVarString(CIRCLE)); // default to small round body

    // Student-settable Script Setting
    let prop = new GVarNumber();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'radius', prop);
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'width', prop); // in general, use getWidth
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'height', prop); // in general, use getHeight

    // Private Costume Defaults
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'costumeWidth', prop); // intended internal use only
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'costumeHeight', prop); // intended for internal use only

    // Private Physics Body
    prop = new GVarNumber(1); // default to small round body
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'bodyRadius', prop);
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyWidth', prop); // intended internal use only
    prop = new GVarNumber();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyHeight', prop); // intended for internal use only

    // shape = [ circle, rectangle ]
    prop = new GVarNumber(1);
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'scale', prop); // in general, set featProp directly rather than calling the method
    // scale is absolute scale relative to the base size of the Costume
    prop = new GVarNumber();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'scaleY', prop); // in general, set featProp directly rather than calling the method

    // Init
    this.init(agent);

    // REGISTER the Agent for updates
    PHYSICS_AGENTS.set(agent.id, agent.id);
  }

  /**
   * Init
   * Automatically initializes Physics with the default
   * values based on the current Costume.
   */
  init(agent: IAgent) {
    const dim = this.readCostumeSize(agent);
    this.setSize(agent, dim.width, dim.height); // default to sprite size
    this.setShape(agent, RECTANGLE);
  }

  /// PHYSICS HELPERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Checks the currently set costume sprite for its size
   * and saves the results in `costumeWidth` and `costumeHeigh`
   * parameters for use in scaling.
   */
  readCostumeSize(agent: IAgent): { width: number; height: number } {
    if (!agent.hasFeature('Costume')) return { width: 0, height: 0 }; // no costume
    const { w, h } = agent.callFeatMethod('Costume', 'getBounds');
    agent.getFeatProp(this.name, 'costumeWidth').setTo(w);
    agent.getFeatProp(this.name, 'costumeHeight').setTo(h);
    return { width: w, height: h };
  }

  /// PHYSICS METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  setShape(agent: IAgent, shape: string) {
    agent.getFeatProp(this.name, 'shape').setTo(shape);
  }
  /**
   * Convenience function for setting width/height variables.
   * The actual application of the size happens during m_update.
   * This is the same as calling `featProp Physics width setTo n`
   * followed by `featProp Physics height setTo n`
   */
  setSize(agent: IAgent, width: number, height: number = width) {
    this.setWidth(agent, width);
    this.setHeight(agent, height);
  }
  setRadius(agent: IAgent, radius: number) {
    agent.getFeatProp(this.name, 'radius').setTo(radius);
  }
  /**
   * NOTE: This only saves a local value.  The physics body and agent visual
   * are updated during m_update.
   */
  setWidth(agent: IAgent, num: number) {
    agent.getFeatProp(this.name, 'width').setTo(num);
  }
  /**
   * NOTE: This only saves a local value.  The physics body and agent visual
   * are updated during m_update.
   */
  setHeight(agent: IAgent, num: number) {
    agent.getFeatProp(this.name, 'height').setTo(num);
  }
  getRadius(agent: IAgent): number {
    return agent.getFeatProp(this.name, 'radius').value;
  }
  getWidth(agent: IAgent): number {
    return agent.getFeatProp(this.name, 'width').value;
  }
  getHeight(agent: IAgent): number {
    return agent.getFeatProp(this.name, 'height').value;
  }
  getBodyWidth(agent: IAgent): number {
    switch (agent.getFeatProp(this.name, 'shape').value) {
      case RECTANGLE:
        return agent.getFeatProp(this.name, 'bodyWidth').value;
      case CIRCLE:
      default:
        return agent.getFeatProp(this.name, 'bodyRadius').value * 2;
    }
  }
  getBodyHeight(agent: IAgent): number {
    switch (agent.getFeatProp(this.name, 'shape').value) {
      case RECTANGLE:
        return agent.getFeatProp(this.name, 'bodyHeight').value;
      case CIRCLE:
      default:
        return agent.getFeatProp(this.name, 'bodyRadius').value * 2;
    }
  }
  /**
   * Returns the Physics Body bounds, which is scale * width||height
   * Since sprites are centered, we adjust the x and y
   */
  getBounds(agent: IAgent) {
    // console.log('getting bounds for', agent);
    const w = this.getBodyWidth(agent);
    const h = this.getBodyHeight(agent);
    return {
      x: agent.x - w / 2,
      y: agent.y - h / 2,
      width: w,
      height: h
    };
  }
  /** Used by sim-conditions for 'touches' test */
  intersectsWith(agent: IAgent, b: IAgent): boolean {
    const boundsA = this.getBounds(agent);
    const boundsB = this.getBounds(b);
    // REVIEW: This currently treats all intersections as rectangules
    // Round objects are not specifically handled.
    return this.intersects(boundsA, boundsB);
  }
  intersectsWithBounds(
    agent: IAgent,
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    const boundsA = this.getBounds(agent);
    // REVIEW: This currently treats all intersections as rectangules
    // Round objects are not specifically handled.
    return this.intersects(boundsA, b);
  }
  intersects(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PhysicsPack('Physics');
Register(INSTANCE);
