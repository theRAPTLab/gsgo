import React from "react";
import AgentsPanel from "./panels/AgentsPanel";
import InstancesPanel from "./panels/InstancesPanel";
import ModelPanel from "./panels/ModelPanel";
import APP from "../app-logic";

const DBG = false;
const PR = "AppEdit: ";

class AppEdit extends React.Component {
  constructor() {
    super();

    this.state = {
      agents: undefined,
      instances: undefined,
      selectedAgentId: undefined,
      selectedAgent: undefined,
      expanded: false,
    };

    this.HandleDATAUpdate = this.HandleDATAUpdate.bind(this);
    this.HandleUIUpdate = this.HandleUIUpdate.bind(this);

    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  HandleDATAUpdate(data) {
    if (DBG) console.log(PR + "Update data", data);
    this.setState({
      agents: APP.GetModelAgents(),
      instances: APP.GetModelInstances(),
    });
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + "Update ui", data);
    this.setState({
      expanded: data.selectedAgentId !== undefined,
      selectedAgentId: data.selectedAgentId,
      selectedAgent: APP.GetAgent(data.selectedAgentId),
    });
  }

  componentDidMount() {
    // request data update
    // REVIEW: this should probably be done further up the food chain
    // AND this should probably be a direct read rather than
    // a rqeuest for a geneeral broadcast.
    APP.RequestUpdateBroadcast();
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    let { agents, selectedAgent, expanded, instances } = this.state;
    return (
      <div
        className="mainpanel"
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignContent: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
          <AgentsPanel agents={agents} selectedAgent={selectedAgent} />
          <InstancesPanel agents={instances} />
          <ModelPanel instances={instances} expanded={!expanded} />
        </div>
      </div>
    );
  }
}

AppEdit.propTypes = {};

export default AppEdit;
