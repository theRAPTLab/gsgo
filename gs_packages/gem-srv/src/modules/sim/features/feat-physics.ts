/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Physics Class!

  Setting the costume size will also set the default physics body dimensions.
  If you need manual control of the physics body dimensions, you can
  override the physics body dimensions using the `bodyWidth`. `bodyHeight` and
  `bodyRadiu` properties.

  When calculating intersects (e.g. for Touches), we use the internal
  dimensions by default (_bodyWidth, _bodyHeight, _bodyRadius).  But if
  the user-defined properties have been set (bodyWidth, bodyHeight, bodyRadius),
  they will override the internal dimensions.

  `bodyShape` defines the type of boundary: radius vs height/width
  `bodyShape` defaults to RECTANGLE.

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
  // Also delete if agent has switched bp and no longer has the feature
  if (!a || !a.prop.Physics) PHYSICS_AGENTS.delete(agentId);
  else return a;
}

/// PHYSICS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Physics Update Loop -- Runs once per gameloop
 */
function m_Update(frame) {
  const agentIds = Array.from(PHYSICS_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) {
      // console.error('could not find', agentId, 'Probably removed?');
      return;
    }
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhysicsPack extends SM_Feature {
  //
  constructor(name) {
    super(name);
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

    // Advanced: User-defined physics body dimensions -- overrides internal values
    let prop = new SM_Number();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'bodyRadius', prop);
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyWidth', prop);
    prop = new SM_Number();
    prop.setMin(0);
    this.featAddProp(agent, 'bodyHeight', prop);
    this.featAddProp(agent, 'bodyShape', new SM_String(RECTANGLE)); // CIRCLE || RECTANGLE

    // private variables
    agent.prop.Physics._bodyWidth = 1;
    agent.prop.Physics._bodyHeight = 1;
    agent.prop.Physics._bodyRadius = 1;

    // Init
    this.init(agent);

    // REGISTER the Agent for updates
    PHYSICS_AGENTS.set(agent.id, agent.id);
  }

  /**
   * Init
   */
  init(agent: IAgent) {
    // do something
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    PHYSICS_AGENTS.clear();
  }

  /// PHYSICS HELPERS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  /**
   * Returns the Physics Body bounds, which is scale * width||height
   * Since sprites are centered, we adjust the x and y
   */
  m_GetBounds(agent: IAgent) {
    // console.log('getting bounds for', agent);
    const w = this._getBodyWidth(agent);
    const h = this._getBodyHeight(agent);
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
  _getBodyWidth(agent: IAgent): number {
    switch (agent.prop.Physics.bodyShape.value) {
      case RECTANGLE:
        return (
          agent.prop.Physics.bodyWidth.value || agent.prop.Physics._bodyWidth
        );
      case CIRCLE:
      default:
        return agent.prop.Physics.bodyRadius.value * 2;
    }
  }
  _getBodyHeight(agent: IAgent): number {
    switch (agent.prop.Physics.bodyShape.value) {
      case RECTANGLE:
        return (
          agent.prop.Physics.bodyHeight.value || agent.prop.Physics._bodyHeight
        );
      case CIRCLE:
      default:
        return agent.prop.Physics.bodyRadius.value
          ? agent.prop.Physics.bodyRadius.value * 2
          : agent.prop.Physics._bodyRadius * 2;
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

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(PhysicsPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return PhysicsPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      'bodyRadius': SM_Number.Symbols,
      'bodyWidth': SM_Number.Symbols,
      'bodyHeight': SM_Number.Symbols,
      'bodyShape': SM_Number.Symbols
    },
    methods: {
      // INTERNAL USE ONLY -- do not expose to GUI
      //
      // 'intersectsWith': {
      //   args: ['targetAgent:blueprint'],
      //   returns: 'intersects:boolean'
      // },
      // 'intersectsWithBounds': {
      //   args: ['bounds:{any}'],
      //   returns: 'intersects:boolean'
      // },
      // 'intersectsCenterWithBounds': {
      //   args: ['bounds:{any}'],
      //   returns: 'intersects:boolean'
      // },
      // 'intersectsCenterWithAgentBounds': {
      //   args: ['targetAgent:blueprint'],
      //   returns: 'intersects:boolean'
      // },
      // 'isBoundedBy': {
      //   args: ['targetAgent:blueprint'],
      //   returns: 'isBounded:boolean'
      // },
      // 'intersects': {
      //   args: ['boundsA:{any}', 'boundsB:{any}'],
      //   returns: 'isBounded:boolean'
      // }
    }
  };
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PhysicsPack('Physics');
SIMDATA.RegisterFeature(INSTANCE);
