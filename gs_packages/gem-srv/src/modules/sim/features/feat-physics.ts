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
import { SM_Number, SM_String } from 'script/vars/_all_vars';
import SM_Feature from 'lib/class-sm-feature';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';

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
  const a = SIMAGENTS.GetAgentById(agentId);
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
function m_Update(frame) {
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
    agent.prop.Physics.bodyWidth.setTo(newW);
    agent.prop.Physics.bodyHeight.setTo(newH);

    // 3. Calculate New Scale
    let newScale = newW / cw;
    let newScaleY = newH / ch;

    // 4. Handle Flips
    if (agent.hasFeature('Costume')) {
      newScale = agent.prop.Costume.flipX.value ? -newScale : newScale;
      newScaleY = agent.prop.Costume.flipY.value ? -newScaleY : newScaleY;
    }

    // 5. Update Agent Scale if necessary
    if (newScale !== agent.scale || newScaleY !== agent.scaleY) {
      agent.scale = newScale;
      agent.scaleY = newScaleY;
    }
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhysicsPack extends SM_Feature {
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

    UR.HookPhase('SIM/PHYSICS_UPDATE', m_Update);
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
    this.featAddProp(agent, 'shape', new SM_String(CIRCLE)); // default to small round body

    // Student-settable Script Setting
    let prop = new SM_Number();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'radius', prop);
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'width', prop); // in general, use getWidth
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'height', prop); // in general, use getHeight

    // Private Costume Defaults
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'costumeWidth', prop); // intended internal use only
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'costumeHeight', prop); // intended for internal use only

    // Private Physics Body
    prop = new SM_Number(1); // default to small round body
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'bodyRadius', prop);
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyWidth', prop); // intended internal use only
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyHeight', prop); // intended for internal use only

    // shape = [ circle, rectangle ]
    prop = new SM_Number(1);
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'scale', prop); // in general, set featProp directly rather than calling the method
    // scale is absolute scale relative to the base size of the Costume
    prop = new SM_Number();
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
    // if size was previously set, use that, otherwise, default to sprite size
    if (agent.prop.Physics.width.value !== undefined) {
      this.setWidth(agent, agent.prop.Physics.width.value);
      this.setHeight(agent, agent.prop.Physics.height.value);
    } else {
      const dim = this.readCostumeSize(agent);
      this.setSize(agent, dim.width, dim.height); // default to sprite size
    }
    this.setShape(agent, RECTANGLE);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  symbolize(): TSymbolData {
    return {
      props: {
        'radius': SM_Number.Symbols,
        'width': SM_Number.Symbols,
        'height': SM_Number.Symbols,
        'costumeWidth': SM_Number.Symbols,
        'costumeHeight': SM_Number.Symbols,
        'bodyRadius': SM_Number.Symbols,
        'bodyWidth': SM_Number.Symbols,
        'bodyHeight': SM_Number.Symbols,
        'scale': SM_Number.Symbols,
        'scaleY': SM_Number.Symbols
      },
      methods: {
        'setShape': { args: ['shape:string'] },
        'setSize': { args: ['width:number', 'height:number'] },
        'setRadius': { args: ['radius:number'] },
        'getWidth': { returns: 'width:number' },
        'getHeight': { returns: 'height:number' }
      }
    };
  }

  /// PHYSICS HELPERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /**
   * Checks the currently set costume sprite for its size
   * and saves the results in `costumeWidth` and `costumeHeigh`
   * parameters for use in scaling.
   */
  readCostumeSize(agent: IAgent): { width: number; height: number } {
    if (!agent.hasFeature('Costume') || agent.prop.skin.value === undefined)
      return { width: 0, height: 0 }; // no costume
    const { w, h } = agent.callFeatMethod('Costume', 'getBounds');
    agent.prop.Physics.costumeWidth.setTo(w);
    agent.prop.Physics.costumeHeight.setTo(h);
    return { width: w, height: h };
  }
  /**
   * Returns the Physics Body bounds, which is scale * width||height
   * Since sprites are centered, we adjust the x and y
   */
  m_GetBounds(agent: IAgent) {
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

  /// PHYSICS METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  setShape(agent: IAgent, shape: string) {
    agent.prop.Physics.shape.setTo(shape);
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
    agent.prop.Physics.radius.setTo(radius);
  }
  /**
   * NOTE: This only saves a local value.  The physics body and agent visual
   * are updated during m_update.
   */
  setWidth(agent: IAgent, num: number) {
    agent.prop.Physics.width.setTo(num);
  }
  /**
   * NOTE: This only saves a local value.  The physics body and agent visual
   * are updated during m_update.
   */
  setHeight(agent: IAgent, num: number) {
    agent.prop.Physics.height.setTo(num);
  }
  getRadius(agent: IAgent): number {
    return agent.prop.Physics.radius.value;
  }
  getWidth(agent: IAgent): number {
    return agent.prop.Physics.width.value;
  }
  getHeight(agent: IAgent): number {
    return agent.prop.Physics.height.value;
  }
  getBodyWidth(agent: IAgent): number {
    switch (agent.prop.Physics.shape.value) {
      case RECTANGLE:
        return agent.prop.Physics.bodyWidth.value;
      case CIRCLE:
      default:
        return agent.prop.Physics.bodyRadius.value * 2;
    }
  }
  getBodyHeight(agent: IAgent): number {
    switch (agent.prop.Physics.shape.value) {
      case RECTANGLE:
        return agent.prop.Physics.bodyHeight.value;
      case CIRCLE:
      default:
        return agent.prop.Physics.bodyRadius.value * 2;
    }
  }
  /** Used by sim-conditions for 'touches' test */
  intersectsWith(agent: IAgent, b: IAgent): boolean {
    const boundsA = this.m_GetBounds(agent);
    const boundsB = this.m_GetBounds(b);
    // REVIEW: This currently treats all intersections as rectangules
    // Round objects are not specifically handled.
    return this.intersects(boundsA, boundsB);
  }
  intersectsWithBounds(
    agent: IAgent,
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    const boundsA = this.m_GetBounds(agent);
    // REVIEW: This currently treats all intersections as rectangules
    // Round objects are not specifically handled.
    return this.intersects(boundsA, b);
  }
  intersectsCenterWithBounds(
    agent: IAgent,
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    const boundsA = this.m_GetBounds(agent);
    const size = 10; // size of the center box.
    const boundsB = {
      x: b.x - size / 2,
      y: b.y - size / 2,
      width: size,
      height: size
    };
    return this.intersects(boundsA, boundsB);
  }
  // center of A within bounds of B
  intersectsCenterWithAgentBounds(agent: IAgent, b: IAgent): boolean {
    const size = 10; // size of the center box.
    const centerA = {
      x: agent.x - size / 2,
      y: agent.y - size / 2,
      width: size,
      height: size
    };
    const boundsB = this.m_GetBounds(b);
    return this.intersects(centerA, boundsB);
  }
  // bounds of A is inside bounds of B
  isBoundedBy(agentA: IAgent, agentB: IAgent): boolean {
    const a = this.m_GetBounds(agentA);
    const b = this.m_GetBounds(agentB);
    const ahw = a.width / 2;
    const ahh = a.height / 2;
    const bhw = b.width / 2;
    const bhh = b.height / 2;
    return (
      a.x > b.x &&
      a.x + a.width < b.x + b.width &&
      a.y > b.y &&
      a.y + a.height < b.y + b.height
    );
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
SIMDATA.RegisterFeature(INSTANCE);
