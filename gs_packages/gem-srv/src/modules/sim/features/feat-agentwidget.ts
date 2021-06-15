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

function m_FeaturesUpdate(frame) {
  const agentIds = Array.from(WIDGET_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;

    // Update Graph
    // This won't update if _graphFreq is 0
    if (frame % agent.prop.AgentWidgets._graphFreq === 0) {
      const graphProp = agent.prop.AgentWidgets._graphProp;
      const value = agent.getProp(graphProp).value;
      agent.prop.AgentWidgets._graph.push(frame, value);
    } else {
      // using graphValue?
      const value = agent.prop.AgentWidgets.graphValue.value;
      if (value !== agent.prop.AgentWidgets._graphValueOld) {
        // graphValue changed!
        const counter = agent.prop.AgentWidgets._graphCounter++;
        agent.prop.AgentWidgets._graph.push(counter, value);
        agent.prop.AgentWidgets._graphValueOld = value;
      }
    }
  });
}

/**
 * Widgets Update Loop -- Runs once per gameloop
 */
function m_UIUpdate(frame) {
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
      text = agent.getProp(textProp).value;
    } else {
      text = agent.getFeatProp(FEATID, 'text').value;
    }
    agent.prop.statusText.setTo(text);

    // 2. Update Meter
    //    Meters can be set directly via 'meter' featProp,
    //    or the meter can be bound to an agent property
    const meterProp = agent.getFeatProp(FEATID, 'meterProp').value;
    const meter = agent.getFeatProp(FEATID, 'meter').value;
    const meterColor = agent.getFeatProp(FEATID, 'meterColor').value;
    const isLargeGraphic = agent.getFeatProp(FEATID, 'isLargeGraphic').value;
    if (meterProp) {
      // Calculate meter value based on property max value
      const { max, min } = agent.prop[meterProp];
      const val = (agent.getProp(meterProp).value - min) / (max - min);
      agent.prop.statusValue.setTo(val);
    } else if (meter) {
      agent.prop.statusValue.setTo(meter);
    }
    if (meterColor) agent.prop.statusValueColor.setTo(meterColor);
    if (isLargeGraphic) agent.prop.statusValueIsLarge.setTo(isLargeGraphic);

    // 3. Update Graph
    // Only pass up to 50 points
    // The graph is 100 px wide, so this gives you at least a gap
    const max = 100 * 2;
    const l = agent.prop.AgentWidgets._graph.length;
    agent.prop.statusHistory = agent.prop.AgentWidgets._graph.slice(
      Math.max(l - max, 0)
    );
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class WidgetPack extends GFeature {
  //
  constructor(name) {
    super(name);
    // this.featAddMethod('setShape', this.setShape);
    UR.HookPhase('SIM/FEATURES_UPDATE', m_FeaturesUpdate);
    UR.HookPhase('SIM/UI_UPDATE', m_UIUpdate);
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
    this.featAddProp(agent, 'isLargeGraphic', new GVarBoolean(false));
    prop = new GVarNumber(0);
    this.featAddProp(agent, 'graphValue', prop);

    // Private Props
    this.featAddProp(agent, 'textProp', new GVarString()); // agent prop name that text is bound to
    this.featAddProp(agent, 'meterProp', new GVarString());

    agent.prop.AgentWidgets._graph = [0, 0];
    agent.prop.AgentWidgets._graphProp = undefined;
    agent.prop.AgentWidgets._graphFreq = 0;
    agent.prop.AgentWidgets._graphCounter = 0;
    agent.prop.AgentWidgets._graphValueOld = 0;

    // REGISTER the Agent for updates
    WIDGET_AGENTS.set(agent.id, agent.id);
  }

  /// WIDGET METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  bindTextTo(agent: IAgent, propname: string) {
    agent.prop.AgentWidgets.textProp.setTo(propname);
  }
  bindMeterTo(agent: IAgent, propname: string) {
    agent.prop.AgentWidgets.meterProp.setTo(propname);
  }
  bindGraphTo(agent: IAgent, propname: string, frequency: number) {
    agent.prop.AgentWidgets._graphProp = propname;
    agent.prop.AgentWidgets._graphFreq = frequency;
  }
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new WidgetPack(FEATID);
Register(INSTANCE);
