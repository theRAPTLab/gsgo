/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Vision Class

  Adds a `canSeeCone` map to agents, a lookup table for target agent ids
  that the agent can see within a projected vision cone based on the orientation
  of the agent.

  Dependencies:
  * feat-movement
  * feat-costume

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { SM_Number, SM_Boolean } from 'script/vars/_all_vars';
import SM_Feature from 'lib/class-sm-feature';
import * as SIMAGENTS from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import { intersect } from 'lib/vendor/js-intersect';
import { ANGLES } from 'lib/vendor/angles';
import { ProjectPoint } from 'lib/util-vector';

ANGLES.SCALE = Math.PI * 2;

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Vision';
const PR = UR.PrefixUtil(FEATID);
const DBG = false;

const VISION_AGENTS = new Map();

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns agent if it exists.
 *  If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 *  WIDGET_AGENTS */
function m_getAgent(agentId): IAgent {
  const a = SIMAGENTS.GetAgentById(agentId);
  if (!a) VISION_AGENTS.delete(agentId);
  return a;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_updateVisionCone(agent): { visionPoly: any[]; visionPath: any[] } {
  // Newly minted agents will not have x and y set until VIS_UPDATE
  if (
    agent.x === undefined ||
    agent.y === undefined ||
    agent.prop.Movement._orientation === undefined // orientation isn't set until agent moves
  )
    return { visionPoly: [], visionPath: [] };

  const distance = agent.prop.Vision.viewDistance.value;
  // convert degrees viewAngle to radians
  const viewAngleRad = (agent.prop.Vision.viewAngle.value * Math.PI) / 180;
  const orientation = -agent.prop.Movement._orientation; // flip y
  const viewAngleLeft = ANGLES.normalizeHalf(orientation - viewAngleRad / 2);
  const viewAngleRight = ANGLES.normalizeHalf(orientation + viewAngleRad / 2);
  // We project the middle point too, so that upon first detection, a pivot
  // towards the agent will not result in the target moving out of the vision cone
  const viewPointLeft = ProjectPoint(agent, viewAngleLeft, distance);
  const viewPointMiddle = ProjectPoint(agent, orientation, distance);
  const viewPointRight = ProjectPoint(agent, viewAngleRight, distance);
  const visionPoly = [
    { x: agent.x, y: agent.y },
    { x: viewPointLeft.x, y: viewPointLeft.y },
    { x: viewPointMiddle.x, y: viewPointMiddle.y },
    { x: viewPointRight.x, y: viewPointRight.y }
  ];

  // debug
  const visionPath = [
    agent.x,
    agent.y,
    viewPointLeft.x,
    viewPointLeft.y,
    viewPointMiddle.x,
    viewPointMiddle.y,
    viewPointRight.x,
    viewPointRight.y
  ];
  agent.debug = visionPath;

  return { visionPoly, visionPath };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Returns the SCALED bounding rect of the agent
function m_GetAgentBoundingRect(agent) {
  // Based on costume
  if (!agent.hasFeature('Costume'))
    throw new Error(
      `m_GetAgentBoundingRect: Tried to use vision on an agent with no costume ${agent.id}`
    );
  const { w, h } = agent.callFeatMethod('Costume', '_getScaledBounds');
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
// REVIEW: Consider using https://github.com/davidfig/pixi-intersects
function m_IsTargetWithinVisionCone(visionPoly, target): boolean {
  if (
    target === undefined ||
    target.isInert || // inert = dead
    target.x === undefined ||
    target.y === undefined
  )
    return false;

  const targetPoly = m_GetAgentBoundingRect(target);
  // Returns array of intersecting objects, or [] if no intersects
  const result = intersect(visionPoly, targetPoly);
  return result.length > 0;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Checks target color against target's background agent color using agent's
 *  Vision detection thresholds to determine if the target is visible against
 *  its background.
 *
 *  Checks that target's color is visible regardless of whether or not the
 *  target is within the vision one Check both visionCone and color if you need
 *  both to be true. The vision-cone-less check is necessary because checking
 *  for camouflage when the agent is on top of target (e.g. during eating) means
 *  the target is not visible in the visionCone.  */
function m_IsTargetColorVisible(agent: IAgent, target: IAgent) {
  if (
    !agent.hasFeature('Vision') ||
    !target.hasFeature('Vision') ||
    !target.hasFeature('Costume') ||
    !target.hasFeature('Touches')
  ) {
    console.error(
      'Agents missing Vision, Costume, or Touches Feature.  m_IsTargetColorVisible not possible.'
    );
    return false;
  }

  // hsvRange is the predator (viewer's) range settings
  // In other words: Can the predator see the prey against it's background?
  const hRange = agent.prop.Vision.colorHueDetectionThreshold.value;
  const sRange = agent.prop.Vision.colorSaturationDetectionThreshold.value;
  const vRange = agent.prop.Vision.colorValueDetectionThreshold.value;
  const backgroundAgent = target.callFeatMethod(
    'Touches',
    '_getTouchingAgent',
    'binb'
  ); // the target is touching a background agent
  if (DBG) console.log(target.id, 'backgroundAgent', backgroundAgent);
  if (!backgroundAgent) return true; // b not touching an agent so b is visible
  const backgroundColor = backgroundAgent.prop.color.value;
  // color is visible if it is NOT camouflaged
  return !target.callFeatMethod(
    'Vision',
    'isCamouflaged',
    backgroundColor,
    hRange,
    sRange,
    vRange
  );
}

/// PHYSICS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Vision Update Loop -- Runs once per gameloop */
function m_update(frame) {
  const agentIds = Array.from(VISION_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;

    // vision cone will show if hasActiveTargets
    let hasActiveTargets = false;

    const { visionPoly, visionPath } = m_updateVisionCone(agent);

    const targets = SIMAGENTS.GetCharactersByType(VISION_AGENTS.get(agentId));
    targets.forEach(t => {
      if (agent.id === t.id) return; // skip self

      // vision cone
      let canSeeCone = false;
      if (!t.isInert && t.prop.Vision.visionable.value) {
        // don't check vision if inert or not visible
        canSeeCone = m_IsTargetWithinVisionCone(visionPoly, t);
      }
      if (!agent.canSeeCone) agent.canSeeCone = new Map();
      agent.canSeeCone.set(t.id, canSeeCone);

      // vision color
      let canSeeColor = m_IsTargetColorVisible(agent, t);
      if (!agent.canSeeColor) agent.canSeeColor = new Map();
      agent.canSeeColor.set(t.id, canSeeColor);

      // pozyx targets might still be present, but inert
      if (!t.isInert && (canSeeCone || canSeeColor)) hasActiveTargets = true;
    });
    // Clear cone if no more non-inert targets.
    // We can't simply check for 0 targets because
    // pozyx targets might still be around but inert
    if (!hasActiveTargets) {
      agent.debug = undefined;
    } else {
      agent.debug = visionPath;
    }
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_simStop() {
  // Clear vision cone
  const agentIds = Array.from(VISION_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;
    agent.debug = undefined;
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_handleScriptEvent(data) {
  if (data.type === 'RoundStop') m_simStop();
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class VisionPack extends SM_Feature {
  //
  constructor(name) {
    super(name);
    this.featAddMethod('monitor', this.monitor);
    this.featAddMethod('isCamouflaged', this.isCamouflaged);
    this.featAddMethod('canSeeColorOfCharacter', this.canSeeColorOfCharacter);
    UR.HookPhase('SIM/AGENTS_UPDATE', m_update);
    // use AGENTS_UPDATE so the vision calculations are in place for use during
    // movmeent's FEATURES_UPDATE
    UR.HandleMessage('SCRIPT_EVENT', m_handleScriptEvent);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'visionable', new SM_Boolean(true)); // can be seen by Vision feature

    let prop = new SM_Number(250);
    prop.setMax(1000);
    prop.setMin(0);
    this.featAddProp(agent, 'viewDistance', prop);

    // If we want to allow view angles > 180, then the vision
    // cone needs to be re-implemented with more spokes, otherwise
    // the cone collapses.
    // 'viewAngle' is the measured as 1/2 of viewAngle to the right
    // and left of the orientation.
    prop = new SM_Number(45);
    prop.setMax(180);
    prop.setMin(0);
    this.featAddProp(agent, 'viewAngle', prop);

    // `color*DetectionThreshold` defines the range of HSV
    // values outside of which color can be detected
    // Used by `seesCamouflaged` condition
    // colors are detectable if they are OUTISDE the threshold value
    // e.g. if colorHueDetectionThreshold is 0.2
    //      and agent color hue is 0.5
    //      and background color hue is 0.6
    //      then `seesCamouflaged` would return false
    //      because the difference is 0.1, which is not outside
    //      the detectable range of 0.2
    // Set to 0 to always detect.
    prop = new SM_Number(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorHueDetectionThreshold', prop);
    prop = new SM_Number(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorSaturationDetectionThreshold', prop);
    prop = new SM_Number(0);
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'colorValueDetectionThreshold', prop);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    VISION_AGENTS.clear();
  }

  /// VISION METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  monitor(agent: IAgent, targetBlueprintName: string) {
    VISION_AGENTS.set(agent.id, targetBlueprintName);
  }
  /** isCamouflaged if agent colorHSV is within range of backgroundColor
   *  This is generally invoked by the viewer agent (e.g. predator)
   *  because their vision determines the range of visibility
   *  Used in m_IsTargetColorVisible
   */
  isCamouflaged(
    agent: IAgent,
    backgroundColor: number,
    hRange: number,
    sRange: number,
    vRange: number
  ) {
    if (!agent.hasFeature('Costume'))
      throw new Error('isCamouflaged requires Costume Feature!');
    return agent.callFeatMethod(
      'Costume',
      'colorHSVWithinRange',
      agent.prop.color.value,
      backgroundColor,
      hRange,
      sRange,
      vRange
    );
  }

  /** agent can see the color of the target against its background agent */
  canSeeColorOfCharacter(agent: IAgent, target: IAgent) {
    return m_IsTargetColorVisible(agent, target);
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(VisionPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return VisionPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      'visionable': SM_Number.Symbols,
      'viewDistance': SM_Number.Symbols,
      'viewAngle': SM_Number.Symbols,
      'colorHueDetectionThreshold': SM_Number.Symbols,
      'colorSaturationDetectionThreshold': SM_Number.Symbols,
      'colorValueDetectionThreshold': SM_Number.Symbols
    },
    methods: {
      'monitor': { args: ['targetBlueprintName:string'] },
      'isCamouflaged': {
        args: [
          'backgroundColor:number',
          'hRange:number',
          'sRange:number',
          'vRange:number'
        ]
      },
      // REVIEW TODO: target is an IAgent.  Should it be `blueprint`?
      'canSeeColorOfCharacter': { args: ['target:objref'] }
    }
  };
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new VisionPack(FEATID);
SIMDATA.RegisterFeature(INSTANCE);
