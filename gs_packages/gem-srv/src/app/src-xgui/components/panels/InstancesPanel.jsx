import React from "react";
import PropTypes from "prop-types";
import AgentsList from "./AgentsList";
import InstanceEditor from "./InstanceEditor";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";

class InstancesPanel extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedInstanceId: undefined,
    };
    this.HandleUIUpdate = this.HandleUIUpdate.bind(this);
    this.AddInstance = this.AddInstance.bind(this);
    this.DoMinimize = this.DoMinimize.bind(this);
    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  // Force update so that instances are moved between script-controlled and user-controlled?
  HandleDATAUpdate(data) {
    this.forceUpdate();
  }

  HandleUIUpdate(data) {
    console.log("got update", data);
    this.setState({
      selectedInstanceId: data.selectedInstanceId,
    });
  }

  AddInstance() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddInstance,
      params: {},
    });
  }

  DoMinimize() {
    // Deselecting will minimize the AgentPanel
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectInstance,
      params: {
        agentId: undefined,
      },
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedInstanceId } = this.state;
    const { viewOnly } = this.props;
    const scriptInstances = APP.GetScriptControlledInstances();
    const nonscriptInstances = APP.GetNonScriptControlledInstances();
    return (
      <div
        className="instancespanel"
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignContent: "center",
        }}
      >
        <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex" }}>
            <div className="syslabel" style={{ flexGrow: 1 }}>
              MODEL INSTANCES
            </div>
            {selectedInstanceId && (
              <button onClick={this.DoMinimize}>&lt;</button>
            )}
          </div>
          <div style={{ flexGrow: 1, display: "flex" }}>
            <div
              style={{
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div className="syslabel">Script-Controlled</div>
              <AgentsList
                agents={scriptInstances}
                selectedAgentId={selectedInstanceId}
                type="instance"
              />
              <div className="syslabel">User-Controlled</div>
              <AgentsList
                agents={nonscriptInstances}
                selectedAgentId={selectedInstanceId}
                type="instance"
              />
              {!viewOnly && (
                <button className="agent-addbtn" onClick={this.AddInstance}>
                  +
                </button>
              )}
              <div>
                <input type="checkbox" />
                Show
                <br />
                Annotations
              </div>
            </div>
            {selectedInstanceId && (
              <InstanceEditor
                instanceId={selectedInstanceId}
                viewOnly={viewOnly}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

InstancesPanel.propTypes = {
  viewOnly: PropTypes.bool,
};

export default InstancesPanel;
