import React from "react";
import APP from "../../app-logic";

const DBG = false;
const PR = "ModelPanel: ";

class ModelPanel extends React.Component {
  constructor() {
    super();

    this.state = {
      instances: [],
      selectedAgentId: undefined,
      selectedInstanceId: undefined,
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
    this.setState({
      selectedAgentId: data.selectedAgentId,
      selectedInstanceId: data.selectedInstanceId,
      selectedAgent: APP.GetAgent(data.selectedAgentId),
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedInstanceId } = this.state;
    const { instances, expanded } = this.props;
    if (instances === undefined) return "";
    return (
      <div
        className="modelpanel"
        style={{
          flexGrow: 1,
          minWidth: "300px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignContent: "center",
          overflow: "scroll",
        }}
      >
        <div className="syslabel dark">MODEL</div>
        <div className="modelPane" style={{ flexGrow: 1 }}>
          <div className="modelSurface">
            {instances.map(
              (i) =>
                !i.hidden && (
                  <div
                    className={`agent ${selectedInstanceId} ${i.id} ${
                      selectedInstanceId === i.id ? "controlled" : ""
                    }`}
                    style={{
                      top: APP.GetInstanceProperty(i.id, "y"),
                      left: APP.GetInstanceProperty(i.id, "x"),
                    }}
                    key={i.id}
                  >
                    {APP.GetInstanceLabel(i.id)}
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ModelPanel;
