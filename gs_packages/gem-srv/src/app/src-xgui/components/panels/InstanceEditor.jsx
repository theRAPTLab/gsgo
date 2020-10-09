/*


 */

import React from "react";
import PropTypes from "prop-types";
import Menu from "../scripting/Menu";
import PropertiesList from "../scripting/PropertiesList";
import FeaturesList from "../scripting/FeaturesList";
import PropertyEditor from "../scripting/PropertyEditor";
import FeatureEditor from "../scripting/FeatureEditor";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";
import { DATATYPE } from "../../constants";

const DBG = false;
const PR = "InstanceEditor: ";

class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedProperty: undefined,
      selectedFeature: undefined,
    };
    this.DoSave = this.DoSave.bind(this);
    this.OnPropertySelect = this.OnPropertySelect.bind(this);
    this.OnPropertyChange = this.OnPropertyChange.bind(this);
    this.OnFeatureSelect = this.OnFeatureSelect.bind(this);
    this.OnFeatureChange = this.OnFeatureChange.bind(this);
    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + "UIUpdate", data);
    // clear selections
    this.setState({
      selectedProperty: undefined,
      selectedFeature: undefined,
    });
  }

  DoSave() {
    if (this.state.selectedProperty === undefined) return;

    let updatedInstance = APP.GetInstance(this.props.instanceId);
    if (updatedInstance === undefined) return;

    const updatedProperty = this.state.selectedProperty;
    updatedInstance = updatedInstance.properties.map((p) => {
      p.id === updatedProperty.id ? updatedProperty : p;
    });

    const updatedFeatures = this.state.selectedFeature;
    if (updatedFeatures) {
      updatedInstance.features = updatedInstance.features.map((f) =>
        f.id === updatedFeatures.id ? updatedFeatures : f
      );
    }

    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateInstance,
      params: {
        agent: updatedInstance,
      },
    });
  }

  OnPropertySelect(property) {
    if (this.props.viewOnly) return;
    if (property === undefined) {
      // clear selection
      DISPATCHER.Do({
        action: DISPATCHER.ACTION.SelectInstance,
        params: {
          agentId: undefined,
        },
      });
    } else {
      // select
      this.setState(
        {
          selectedProperty: property,
        },
        this.DoSave
      );
    }
  }
  OnPropertyChange(property) {
    // Update according to user input
    let updatedInstance = APP.GetInstance(this.props.instanceId);
    if (updatedInstance === undefined) return;

    updatedInstance = updatedInstance.properties.map((p) => {
      p.id === property.id ? property : p;
    });

    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateInstance,
      params: {
        agent: updatedInstance,
      },
    });

    this.setState({ selectedProperty: property });
  }

  OnFeatureSelect(feature) {
    if (this.props.viewOnly) return;
    this.DoSave();
    this.setState({
      selectedProperty: undefined,
      selectedFeature: feature,
    });
  }
  OnFeatureChange(feature) {
    let updatedInstance = APP.GetInstance(this.props.instanceId);
    if (updatedInstance === undefined) return;

    updatedInstance.features = updatedInstance.features.map((f) =>
      f.id === feature.id ? feature : f
    );

    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateInstance,
      params: {
        agent: updatedInstance,
      },
    });

    this.setState({ selectedFeature: feature });
  }

  componentWillUnmount() {
    this.DoSave();
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedProperty, selectedFeature } = this.state;
    const { instanceId, viewOnly } = this.props;
    const instance = APP.GetInstance(instanceId);
    const properties = APP.GetInstanceProperties(instanceId);
    const features = APP.GetInstanceFeatures(instanceId);
    console.log("instanceViewer render with agent", instanceId);
    return (
      <div
        className="instanceviewer"
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-start",
          alignContent: "center",
          padding: "5px 0 5px 5px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="propertylist">
            <div className="propertylist-item">
              <div className="propertylist-item label">Agent Type:&nbsp;</div>
              <div className="propertylist-item value">
                {viewOnly ? (
                  APP.GetAgentLabel(instance.agentId)
                ) : (
                  <Menu
                    options={APP.GetModelAgents()}
                    selectedOptionId={instance.agentId}
                    action={DISPATCHER.ACTION.UpdateInstanceAgentId}
                    actionParams={{
                      instanceId: instance.id,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <PropertiesList
            properties={properties}
            selectedProperty={selectedProperty}
            title="PROPERTIES"
            viewOnly={true}
            OnSelect={this.OnPropertySelect}
          />
          <FeaturesList
            features={features}
            selectedFeature={selectedFeature}
            agentType={DATATYPE.INSTANCE}
            OnSelect={this.OnFeatureSelect}
            OnAddFeature={this.OnFeatureAdd}
          />
          <div style={{ flexGrow: 4 }}>
            <div className="syslabel">LOG</div>
            <div className="log">stack trace</div>
          </div>
        </div>
        <div
          className="instancepanel"
          style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          {selectedProperty && (
            <PropertyEditor
              property={selectedProperty}
              agentType={DATATYPE.INSTANCE}
              viewOnly={true}
              OnChange={this.OnPropertyChange}
            />
          )}
          {selectedFeature && (
            <FeatureEditor
              feature={selectedFeature}
              agentId={instanceId}
              agentType={DATATYPE.INSTANCE}
              viewOnly={true}
              OnChange={this.OnFeatureChange}
            />
          )}
        </div>
      </div>
    );
  }
}

InstanceEditor.propTypes = {
  instanceId: PropTypes.string,
  viewOnly: PropTypes.bool,
};

export default InstanceEditor;
