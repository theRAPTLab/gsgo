/*

    AgentEditor
    
    Any changes to properties and features are retained
    locally in state by this component.
    
    When save is triggered, we construct a new `agent` object
    using the saved property and features and dispatch
    an update event.
    
    * There can only be one active editor at a time.
      e.g. you're editing either properties, or events, or features..

 */

import React from "react";
import PropTypes from "prop-types";
import PropertiesList from "../scripting/PropertiesList";
import FeaturesList from "../scripting/FeaturesList";
import EventsList from "../scripting/EventsList";
import PropertyEditor from "../scripting/PropertyEditor";
import FeatureEditor from "../scripting/FeatureEditor";
import EventEditor from "../scripting/EventEditor";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";
import { DATATYPE } from "../../constants";

const DBG = true;
const PR = "AgenEditor: ";

class AgentEditor extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedProperty: undefined,
      selectedFeature: undefined,
      selectedEvent: undefined,
    };

    this.HandleDATAUpdate = this.HandleDATAUpdate.bind(this);
    this.DoSave = this.DoSave.bind(this);
    this.OnPropertySelect = this.OnPropertySelect.bind(this);
    this.OnPropertyChange = this.OnPropertyChange.bind(this);
    this.OnPropertyAdd = this.OnPropertyAdd.bind(this);
    this.OnFeatureSelect = this.OnFeatureSelect.bind(this);
    this.OnFeatureChange = this.OnFeatureChange.bind(this);
    this.OnFeatureAdd = this.OnFeatureAdd.bind(this);
    this.OnEventSelect = this.OnEventSelect.bind(this);

    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  HandleDATAUpdate(data) {
    if (DBG) console.log(PR + "DATAUPDATE!", data);
    // when data is updated, we need to trigger a retrieval of
    // current event data in the render function
    this.forceUpdate();
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + "UIUpdate", data);
    // clear selections
    this.setState({
      selectedProperty: undefined,
      selectedFeature: undefined,
      selectedEvent: undefined,
    });
  }

  DoSave() {
    if (DBG) console.log(PR + "DoSave");
    const updatedAgent = this.props.agent;
    if (updatedAgent === undefined) return;

    const updatedProperty = this.state.selectedProperty;
    if (updatedProperty)
      updatedAgent.properties = updatedAgent.properties.map((p) =>
        p.id === updatedProperty.id ? updatedProperty : p
      );

    const updatedFeatures = this.state.selectedFeature;
    if (updatedFeatures) {
      updatedAgent.features = updatedAgent.features.map((f) =>
        f.id === updatedFeatures.id ? updatedFeatures : f
      );
    }

    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateAgent,
      params: {
        agent: updatedAgent,
      },
    });
  }

  OnPropertySelect(property) {
    if (property === undefined) {
      // clear selection
      DISPATCHER.Do({
        action: DISPATCHER.ACTION.SelectAgent,
        params: {
          agentId: undefined,
        },
      });
    } else {
      this.setState(
        {
          selectedProperty: property,
          selectedFeature: undefined,
          selectedEvent: undefined,
        },
        this.DoSave
      );
    }
  }
  OnPropertyChange(property) {
    // Update according to user input
    // Dispatch built-in agent saves immediately
    // REVIEW: Should this be handled in app-logic?
    //         Or perhaps separated out to diff func?
    let updatedAgent;
    switch (property.id) {
      case "label":
        updatedAgent = this.props.agent;
        updatedAgent.label = property.value;
        DISPATCHER.Do({
          action: DISPATCHER.ACTION.UpdateAgent,
          params: {
            agent: updatedAgent,
          },
        });
        break;
      default:
        break;
    }
    this.setState({ selectedProperty: property });
  }
  OnPropertyAdd() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddProperty,
      params: {
        agentId: this.props.agent.id,
      },
    });
  }

  OnFeatureSelect(feature) {
    this.DoSave();
    this.setState({
      selectedProperty: undefined,
      selectedFeature: feature,
      selectedEvent: undefined,
    });
  }
  OnFeatureChange(feature) {
    this.setState({ selectedFeature: feature });
  }
  OnFeatureAdd() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddFeature,
      params: {
        agentId: this.props.agent.id,
      },
    });
  }

  OnEventSelect(eventId) {
    this.DoSave();
    const event = APP.GetEvent(eventId);
    if (DBG) console.log(PR + "Loading event", event);
    this.setState({
      selectedProperty: undefined,
      selectedFeature: undefined,
      selectedEvent: event,
    });
  }

  componentWillUnmount() {
    console.error("agenteditor unmounting");
    this.DoSave();
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedProperty, selectedFeature, selectedEvent } = this.state;
    const { agent } = this.props;
    const { features } = agent;
    const agentProperties = APP.GetAgentPropertiesForAgentEditing(agent.id);
    const userProperties = APP.GetUserPropertiesForAgentEditing(agent.id);
    const properties = agentProperties.concat(userProperties);
    const events = APP.GetAgentEvents(agent.id);
    return (
      <div
        className="controlpanel-sub"
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-start",
          alignContent: "center",
          padding: "5px 0 5px 5px",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <PropertiesList
            properties={properties}
            selectedProperty={selectedProperty}
            title="PROPERTIES"
            viewOnly={false}
            OnSelect={this.OnPropertySelect}
            OnAddProperty={this.OnPropertyAdd}
          />
          <FeaturesList
            features={features}
            selectedFeature={selectedFeature}
            agentType={DATATYPE.AGENT}
            OnSelect={this.OnFeatureSelect}
            OnAddFeature={this.OnFeatureAdd}
          />
          <EventsList
            events={events}
            selectedEvent={selectedEvent}
            OnSelect={this.OnEventSelect}
          />
        </div>

        <div
          className="scriptpanel"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          {selectedProperty && (
            <PropertyEditor
              property={selectedProperty}
              type="agent"
              OnChange={this.OnPropertyChange}
            />
          )}
          {selectedFeature && (
            <FeatureEditor
              feature={selectedFeature}
              agentId={agent.id}
              agentType={DATATYPE.AGENT}
              OnChange={this.OnFeatureChange}
            />
          )}
          {selectedEvent && (
            <EventEditor agentId={agent.id} event={selectedEvent} />
          )}
        </div>
      </div>
    );
  }
}

AgentEditor.propTypes = {
  agent: PropTypes.object,
};

export default AgentEditor;
