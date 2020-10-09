import React from "react";
import InstancesPanel from "./panels/InstancesPanel";
import ModelPanel from "./panels/ModelPanel";
import RecordPanel from "./panels/RecordPanel";
import APP from "../app-logic";

const DBG = true;
const PR = "AppRun: ";

class AppRun extends React.Component {
  constructor() {
    super();
    this.state = {
      instances: undefined,
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
      instances: data.INSTANCES,
    });
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + "Update ui", data);
  }

  componentDidMount() {
    // request data update
    // REVIEW: this should probably be done further up the food chain
    // AND this should probably be a direct read rather than
    // a rqeuest for a geneeral broadcast?
    // OTOH, AppRun will not receive updates until
    // its tab is selected...
    APP.RequestUpdateBroadcast();
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { instances, expanded } = this.state;
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
          <InstancesPanel agents={instances} viewOnly={true} />
          <div
            style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
          >
            <ModelPanel instances={instances} expanded={!expanded} />
          </div>
          <RecordPanel />
        </div>
      </div>
    );
  }
}

export default AppRun;
