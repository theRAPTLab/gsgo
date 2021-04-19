/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Physics Class!

  `shape` defines the type of boundary: radius vs height/width
  `shape` defaults to CIRCLE.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { Register } from 'modules/datacore/dc-features';
import { GetSpriteDimensions } from 'modules/datacore/dc-globals';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PhysicsPack');
const DBG = false;

const CIRCLE = 'circle';
const RECTANGLE = 'rectangle';

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PhysicsPack extends GFeature {
  //
  constructor(name) {
    super(name);
    // add feature methods here
    this.featAddMethod('setShape', this.setShape);
    this.featAddMethod('setSize', this.setSize);
    this.featAddMethod('setRadius', this.setRadius);
    this.featAddMethod('getWidth', this.getWidth);
    this.featAddMethod('getHeight', this.getHeight);
    this.featAddMethod('getBounds', this.getBounds);
    this.featAddMethod('setScale', this.setScale);
    this.featAddMethod('init', this.init);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** This runs once to initialize the feature for all agents */
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
    this.featAddProp(agent, 'shape', new GVarString(CIRCLE));
    let prop = new GVarNumber();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'radius', prop);
    prop = new GVarNumber();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'width', prop); // in general, use getWidth
    prop = new GVarNumber();
    prop.setMax(100);
    prop.setMin(0);
    this.featAddProp(agent, 'height', prop); // in general, use getHeight
    // shape = [ circle, rectangle ]
  }

  /// PHYSICS METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  setShape(agent: IAgent, shape: string) {
    agent.getFeatProp(this.name, 'shape').value = shape;
  }
  /**
   * Student should generally use setSize to set the size of agents.
   * This will set the scale and the physics body boundary
   * @param agent
   * @param width
   * @param height
   */
  setSize(agent: IAgent, width: number, height: number = width) {
    if (!agent.hasFeature('Costume')) return; // no costume
    const costumeName = agent.getProp('skin').value;
    const frame = agent.getFeatProp('Costume', 'currentFrame').value || 0;
    const { w, h } = GetSpriteDimensions(costumeName, frame);
    // if width and height were undefined, default to same size as sprite
    const newWidth = width || w;
    const newHeight = height || h;
    // set Physics body boundaries
    this.setWidth(agent, newWidth);
    this.setHeight(agent, newHeight);
    // set agent visuals
    const scaleX = newWidth / w;
    const scaleY = newHeight / h;
    agent.scale = scaleX;
    agent.scaleY = scaleY;
  }
  setRadius(agent: IAgent, radius: number) {
    agent.getFeatProp(this.name, 'radius').value = radius;
  }
  /**
   * NOTE: This only changes the physics body, not the agent visual
   * @param agent
   * @param num
   */
  setWidth(agent: IAgent, num: number) {
    agent.getFeatProp(this.name, 'width').value = num;
  }
  /**
   * NOTE: This only changes the physics body, not the agent visual
   * @param agent
   * @param num
   */
  setHeight(agent: IAgent, num: number) {
    agent.getFeatProp(this.name, 'height').value = num;
  }
  getWidth(agent: IAgent): number {
    switch (agent.getFeatProp(this.name, 'shape').value) {
      case RECTANGLE:
        return agent.getFeatProp(this.name, 'width').value;
      case CIRCLE:
      default:
        return agent.getFeatProp(this.name, 'radius').value;
    }
  }
  getHeight(agent: IAgent): number {
    switch (agent.getFeatProp(this.name, 'shape').value) {
      case RECTANGLE:
        return agent.getFeatProp(this.name, 'height').value;
      case CIRCLE:
      default:
        return agent.getFeatProp(this.name, 'radius').value;
    }
  }
  /**
   * Since sprites are centered, we adjust the x and y
   * @param agent
   * @returns
   */
  getBounds(agent: IAgent) {
    // console.log('getting bounds for', agent);
    const w = this.getWidth(agent);
    const h = this.getHeight(agent);
    return {
      x: agent.x - w / 2,
      y: agent.y - h / 2,
      width: w,
      height: h
    };
  }
  /**
   * Use this to scale in place of agent setScale so that
   * physics body bounds are also set.  Scale is relative
   * to the current size.  e.g. scale=2 is twice as big.
   * Calling it twice in a row would make the object 4x as big.
   * This should be run after init.
   * @param agent
   * @param scaleX
   * @param scaleY
   */
  setScale(agent: IAgent, scaleX: number, scaleY: number = scaleX) {
    const w = this.getWidth(agent);
    const h = this.getHeight(agent);
    this.setSize(agent, w * scaleX, h * scaleY);
  }
  /**
   * Init
   * Automatically initializes Physics with the default
   * values based on the current Costume.
   */
  init(agent: IAgent) {
    this.setShape(agent, RECTANGLE);
    this.setSize(agent, undefined); // default to sprite size
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new PhysicsPack('Physics');
Register(INSTANCE);
