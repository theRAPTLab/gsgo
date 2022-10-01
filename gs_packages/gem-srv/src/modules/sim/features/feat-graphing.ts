/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Grapahing Class (Formerly Agent Widgets)

  Widgets update during the SIM/UI_UPDATE phase.

  Text
  * Text can be set directly via featProp 'text', or
  * Text can be bound to an agent property using the `bindTextTo` method.

  Meters
  * Meters can be set directly via featProp 'meter', or
  * Meters can be bound to an agent property using the `bindMeterTo` method.
  * If you bind to a property, the SM_Feature will automatically calculate
    the meter value based on the min and max properties.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import {
  SM_Number,
  SM_String,
  SM_Boolean
} from 'modules/sim/script/vars/_all_vars';
import SM_Feature from 'lib/class-sm-feature';
import { GetAgentById } from 'modules/datacore/dc-sim-agents';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import SM_Agent from 'lib/class-sm-agent';
import FLAGS from 'modules/flags';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FEATID = 'Graphing';
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

/// WIDGETS LOOP ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// SIM/FEATURES_UPDATE -- Runs once per gameloop
function m_FeaturesUpdate(frame) {
  const agentIds = Array.from(WIDGET_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;
    const agentWgt = agent.prop.Graphing;

    const graphPropValue = agentWgt.graphProp && agentWgt.graphProp.value;
    const graphGlobalPropValue =
      agentWgt.graphGlobalProp && agentWgt.graphGlobalProp.value;
    // Add new Graph values
    if (
      (graphPropValue || graphGlobalPropValue) && // only plot if these have been set
      frame % agentWgt.graphFrequency.value === 0
    ) {
      // Time-based Graphs
      // New plot point based every graphFrequency per second
      // This won't update if graphFrequency is 0
      // (it defaults to 30 though)
      let value;
      if (graphPropValue) {
        const prop = agent.prop[graphPropValue];
        value = prop ? prop.value : 0; // default to 0
      } else if (graphGlobalPropValue) {
        const graphProp = graphGlobalPropValue;
        const global = SM_Agent.GetGlobalAgent();
        value = global.prop[graphProp].value;
      }
      value = value || 0; // default to 0 (value can be undefined on first frame)
      const counter = agent.prop.Graphing._graphCounter++;
      if (Number.isNaN(value))
        throw new Error(`${agent.name} tried to graph a NaN value.`);
      agent.prop.Graphing._graph.push(counter, value);
    } else {
      // Trigger-based Graph
      // New plot point on change in _graphValue
      const value = agent.prop.Graphing.graphValue.value;
      if (value !== agent.prop.Graphing._graphValueOld) {
        // graphValue changed!
        const counter = agent.prop.Graphing._graphCounter++;
        agent.prop.Graphing._graph.push(counter, value);
        agent.prop.Graphing._graphValueOld = value;
      }
    }
  });
}

/// SIM/GRAPHS_UPDATE -- Runs during PreRun and CostumeLoop as well as regular sim LOOP
///                      Runs after FEATURES_UPDATE so histograms can override graphs
function m_GraphsUpdate(frame) {
  const agentIds = Array.from(WIDGET_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;

    // HACK: LineGraph Histogram
    // If Histogram has been defined, this will override any line graphs
    // Just hacking this in for Moths for now.  Implementation is really
    // problematic
    if (agent.prop.Graphing._histogramFeature) {
      // SUPER HACK
      // values are stored in the Global Agent because they're
      // calculated during Round Init
      // const values =
      //   agent.prop[agent.prop.Graphing._histogramFeature][
      //     agent.prop.Graphing._histogramProp
      //   ];
      const GLOBAL_AGENT = SM_Agent.GetGlobalAgent();
      const values =
        GLOBAL_AGENT.prop[agent.prop.Graphing._histogramFeature][
          agent.prop.Graphing._histogramProp
        ];
      // console.error('values', values);
      const keys = [...values.keys()]; // don't sort because numbers are strings .sort();
      // clear
      agent.prop.Graphing._graph.splice(0);
      keys.forEach((k, index) => {
        agent.prop.Graphing._graph.push(index, values.get(k));
      });
      // console.error('graph', agent.prop.Graphing._graph);
    }
  });
}

/// SIM/UI_UPDATE Loop -- Runs once per gameloop
/// Update agent with new values
function m_UIUpdate(frame) {
  const agentIds = Array.from(WIDGET_AGENTS.keys());
  agentIds.forEach(agentId => {
    const agent = m_getAgent(agentId);
    if (!agent) return;
    const agentWgt = agent.prop.Graphing;

    // 1. Update Text
    //    Text can either be set directly via the `text` featProp,
    //    or, text can be bound to an agent property.
    let text;
    const textProp = agentWgt.textProp.value;
    if (textProp !== undefined) {
      text = agent.prop[textProp].value;
    } else {
      text = agentWgt.text.value;
    }
    agent.prop.statusText.setTo(text);

    // 2. Update Meter
    //    Meters can be set directly via 'meter' featProp,
    //    or the meter can be bound to an agent property
    const meterProp = agentWgt.meterProp.value;
    const meter = agentWgt.meter.value;
    const meterColor = agent.getFeatProp(FEATID, 'meterColor').value;
    const isLargeGraphic = agent.getFeatProp(FEATID, 'isLargeGraphic').value;
    if (meterProp !== undefined) {
      // Calculate meter value based on property max value
      const { value: meterValue, max = 1, min = 0 } = agent.prop[meterProp];
      const val = (meterValue - min) / (max - min);
      agent.prop.statusValue.setTo(val);
    } else if (meter) {
      agent.prop.statusValue.setTo(meter);
    }
    if (meterColor !== undefined) agent.prop.statusValueColor.setTo(meterColor);
    if (isLargeGraphic) agent.prop.statusValueIsLarge.setTo(isLargeGraphic);

    // 3. Update Graph
    //    Only pass up to 50 points
    //    The graph is 100 px wide, so this gives you at least a gap
    const max = 100 * 2;
    const l = agent.prop.Graphing._graph.length;
    // If a graph has been spec'd, always draw the graph so the bg draws
    if (agentWgt.graphProp && agentWgt.graphProp.value) {
      agent.prop.statusHistory = [
        // inject bounds
        agentWgt.graphMinX.value || 0, // Min X
        agentWgt.graphMaxX.value || 0, // Max X -- set to match minX to trigger auto-bounds-setting
        agentWgt.graphMinY.value || 0, // Min Y
        agentWgt.graphMaxY.value || 0, // Max Y -- set to match minY to trigger auto-bounds-setting
        // add graph data
        ...agentWgt._graph.slice(Math.max(l - max, 0))
      ];
    }

    // 4. Update Bar Graph
    const barGraphProp = agent.prop.Graphing.barGraphProp.value;
    const barGraphPropFeature = agent.prop.Graphing.barGraphPropFeature.value;
    let barGraphSource;
    if (barGraphPropFeature) {
      // featProp
      barGraphSource = agent.prop[barGraphPropFeature][barGraphProp]; // dict, so don't use 'value'
    } else if (barGraphProp) {
      // prop
      barGraphSource = agent.prop[barGraphProp]; // dict
    }
    if (barGraphSource) {
      if (!(barGraphSource instanceof Map))
        throw new Error(
          `Graphing: barGraphProp (${barGraphProp}) needs to be a Map property!`
        );
      agent.statusObject.barGraph = [...barGraphSource.values()];
      agent.statusObject.barGraphLabels = [...barGraphSource.keys()];
    }
  });
}

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class WidgetPack extends SM_Feature {
  //
  constructor(name) {
    super(name);
    this.featAddMethod('showMessage', this.showMessage);
    this.featAddMethod('setMeterPosition', this.setMeterPosition);
    this.featAddMethod(
      'bindLineGraphHistogramToFeatProp',
      this.bindLineGraphHistogramToFeatProp
    );
    UR.HookPhase('SIM/GRAPHS_UPDATE', m_GraphsUpdate);
    UR.HookPhase('SIM/FEATURES_UPDATE', m_FeaturesUpdate);
    UR.HookPhase('SIM/UI_UPDATE', m_UIUpdate);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  decorate(agent) {
    super.decorate(agent);
    // Public Props
    this.featAddProp(agent, 'text', new SM_String(agent.name)); // default to agent name
    this.featAddProp(agent, 'textProp', new SM_String()); // agent prop name that text is bound to
    let prop = new SM_Number();
    prop.setMax(1);
    prop.setMin(0);
    this.featAddProp(agent, 'meter', prop);
    this.featAddProp(agent, 'meterProp', new SM_String());
    prop = new SM_Number();
    this.featAddProp(agent, 'meterColor', prop);
    this.featAddProp(agent, 'isLargeGraphic', new SM_Boolean(false));
    prop = new SM_Number(0);
    this.featAddProp(agent, 'graphValue', prop);
    this.featAddProp(agent, 'graphMinX', new SM_Number()); // fix graph x scale mininum value
    this.featAddProp(agent, 'graphMaxX', new SM_Number()); // fix graph x scale maximum value
    this.featAddProp(agent, 'graphMinY', new SM_Number()); // fix graph y scale mininum value
    this.featAddProp(agent, 'graphMaxY', new SM_Number()); // fix graph y scale maximum value
    this.featAddProp(agent, 'graphProp', new SM_String()); // agent prop name that text is bound to
    this.featAddProp(agent, 'graphGlobalProp', new SM_String()); // agent prop name that text is bound to
    prop = new SM_Number(30);
    this.featAddProp(agent, 'graphFrequency', prop);

    // Bar Graph
    this.featAddProp(agent, 'barGraphProp', new SM_String()); // this should be a dict prop
    this.featAddProp(agent, 'barGraphPropFeature', new SM_String());

    // Private Props
    agent.prop.Graphing._graph = [0, 0];
    agent.prop.Graphing._graphCounter = 0;
    agent.prop.Graphing._graphValueOld = 0;
    // REGISTER the Agent for updates
    WIDGET_AGENTS.set(agent.id, agent.id);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  reset() {
    WIDGET_AGENTS.clear();
  }

  /// WIDGET METHODS /////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** Invoked through featureCall script command. To invoke via script:
   *  featCall Physics setRadius value
   */
  showMessage(agent: IAgent, message: string) {
    UR.RaiseMessage('SHOW_MESSAGE', { message });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// METER
  setMeterPosition(agent: IAgent, position: string) {
    let result = FLAGS.POSITION.OUTSIDE_LEFT; // defaults to outside left
    if (position === 'outside-left') result = FLAGS.POSITION.OUTSIDE_LEFT;
    if (position === 'inside-left') result = FLAGS.POSITION.INSIDE_LEFT;
    if (position === 'middle') result = FLAGS.POSITION.MIDDLE;
    if (position === 'inside-right') result = FLAGS.POSITION.INSIDE_RIGHT;
    if (position === 'outside-right') result = FLAGS.POSITION.OUTSIDE_RIGHT;
    agent.statusObject.position = result;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// HISTOGRAMS

  /// This expects the featprop to be a dictionary
  bindLineGraphHistogramToFeatProp(
    agent: IAgent,
    feature: string,
    propName: string
  ) {
    agent.prop.Graphing._histogramFeature = feature;
    agent.prop.Graphing._histogramProp = propName;
  }

  /// SYMBOL DECLARATIONS /////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** static method to return symbol data */
  static Symbolize(): TSymbolData {
    return SM_Feature._SymbolizeNames(WidgetPack.Symbols);
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** instance method to return symbol data */
  symbolize(): TSymbolData {
    return WidgetPack.Symbolize();
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  static _CachedSymbols: TSymbolData;
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /** declaration of base symbol data; methods will be modified to include
   *  the name parameter in each methodSignature */
  static Symbols: TSymbolData = {
    props: {
      text: SM_String.SymbolizeCustom({
        setTo: ['labelString:string']
      }),
      textProp: SM_String.Symbols,
      meter: SM_Number.Symbols,
      meterProp: SM_String.SymbolizeCustom({
        setTo: ['propertyName:string']
      }),
      meterColor: SM_Number.SymbolizeCustom({
        setTo: ['colorNumber:number']
      }),
      isLargeGraphic: SM_Boolean.Symbols,
      graphValue: SM_Number.Symbols,
      graphProp: SM_String.Symbols,
      graphGlobalProp: SM_String.Symbols,
      graphFrequency: SM_Number.Symbols,
      barGraphProp: SM_String.Symbols,
      barGraphPropFeature: SM_String.Symbols
    },
    methods: {
      showMessage: { args: ['messageString:string'] },
      setMeterPosition: { args: ['position:string'] },
      bindLineGraphHistogramToFeatProp: {
        args: ['featureName:feature', 'propName:prop']
      }
    }
  };
}

/// REGISTER SINGLETON ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new WidgetPack(FEATID);
SIMDATA.RegisterFeature(INSTANCE);
