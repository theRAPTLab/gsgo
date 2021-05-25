/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Agent Widget Class

  Widgets update during the SIM/UI_UPDATE phase.

  Text
  * Text can be set directly via featProp 'text', or
  * Text can be bound to an agent property using the `bindTextTo` method.

  Meters
  * Meters can be set directly via featProp 'meter', or
  * Meters can be bound to an agent property using the `bindMeterTo` method.
  * If you bind to a property, the Feature will automatically calculate
    the meter value based on the min and max properties.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { GVarNumber, GVarString, GVarBoolean } from 'modules/sim/vars/_all_vars';
import GFeature from 'lib/class-gfeature';
import { IAgent } from 'lib/t-script';
import { GetAgentById } from 'modules/datacore/dc-agents';
import { Register } from 'modules/datacore/dc-features';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'AgentWidgets';
const PR = UR.PrefixUtil(FEATID);
const DBG = false;

const CIRCLE = 'circle';
const RECTANGLE = 'rectangle';

const WIDGET_AGENTS = new Map();

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Returns agent if it exists.
 * If it doesn't exist anymore (e.g. CharControl has dropped), remove it from
 * WIDGET_AGENTS
 * @param agentId
 */
function m_getAgent(agentId): IAgent {
  const a = GetAgentById(agentId);
  if (!a) WIDGET_AGENTS.delete(agentId);
  return a;
}

/// PHYSICS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/**
 * Widgets Update Loop -- Runs once per gameloop
 */
function m_update(frame) {
  const agentIds = Array.from(WIDGET_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;

    // 1. Update Text
    //    Text can either be set directly via the `text` featProp,
    //    or, text can be bound to an agent property.
    let text;
    const textProp = agent.getFeatProp(FEATID, 'textProp').value;
    if (textProp !== undefined) {
      text = agent.getProp(textProp) ? agent.getProp(textProp).value : undefined;
    } else {
      text = agent.getFeatProp(FEATID, 'text').value;
    }
    agent.getProp('statusText').setTo(text);

    // 2. Update Meter
    //    Meters can be set directly via 'meter' featProp,
    //    or the meter can be bound to an agent property
    const meterProp = agent.getFeatProp(FEATID, 'meterProp').value;
    const meter = agent.getFeatProp(FEATID, 'meter').value;
    const meterColor = agent.getFeatProp(FEATID, 'meterColor').value;
    const isLargeMeter = agent.getFeatProp(FEATID, 'isLargeMeter').value;
    if (meterProp) {
      // Calculate meter value based on property max value
      const { max, min } = agent.getProp(meterProp);
      const val = (agent.getProp(meterProp).value - min) / (max - min);
      agent.getProp('statusValue').setTo(val);
    } else if (meter) {
      agent.getProp('statusValue').setTo(meter);
    }
    if (meterColor) agent.getProp('statusValueColor').setTo(meterColor);
    if (isLargeMeter) agent.getProp('statusValueIsLarge').setTo(isLargeMeter);
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class WidgetPack extends GFeature {
  //
  constructor(name) {
    super(name);
    // this.featAddMethod('setShape', this.setShape);
    UR.HookPhase('SIM/UI_UPDATE', m_update);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);

    // Public Props
    this.featAddProp(agent, 'text', new GVarString(agent.name)); // default to agent name
    let prop = new GVarNumber();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'meter', prop);
    prop = new GVarNumber();
    this.featAddProp(agent, 'meterColor', prop);
    this.featAddProp(agent, 'isLargeMeter', new GVarBoolean(false));

    // Private Props
    this.featAddProp(agent, 'textProp', new GVarString()); // agent prop name that text is bound to
    this.featAddProp(agent, 'meterProp', new GVarString());

    // REGISTER the Agent for updates
    WIDGET_AGENTS.set(agent.id, agent.id);
  }

  /// WIDGET METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  bindTextTo(agent: IAgent, propname: string) {
    agent.getFeatProp(FEATID, 'textProp').setTo(propname);
  }
  bindMeterTo(agent: IAgent, propname: string) {
    agent.getFeatProp(FEATID, 'meterProp').setTo(propname);
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new WidgetPack(FEATID);
Register(INSTANCE);
