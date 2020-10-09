import React from "react";
import APP from "../app-logic.js";
import ModelSelector from "./panels/ModelSelector";
import ModelView from "./panels/ModelView";

const DBG = false;
const PR = "AppHome: ";

class AppHome extends React.Component {
  constructor() {
    super();

    this.state = {
      selectedModelId: undefined,
      // This should be read from `datastore.js`
      // projects: [
      //   { id: 1, label: "fish and algae" },
      //   { id: 2, label: "decomposition" },
      //   { id: 3, label: "bees" },
      //   { id: 4, label: "particles" },
      //   { id: 5, label: "shared: particles (GRP1)", type: "shared" },
      //   { id: 6, label: "shared: particles (GRP2)", type: "shared" },
      // ],
    };

    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  HandleDATAUpdate(data) {
    if (DBG) console.log(PR + "Update data", data);
    this.forceUpdate();
  }

  HandleUIUpdate(data) {
    if (DBG) console.log(PR + "Update ui", data);
    this.setState({
      selectedModelId: data.selectedModelId,
    });
  }

  componentDidMount() {
    this.setState({
      selectedModelId: APP.GetSelectedModelId(),
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedModelId } = this.state;
    const models = APP.GetModels();
    return (
      <div
        className="mainpanel"
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignContent: "center",
          padding: "10px",
          overflow: "hidden",
        }}
      >
        <ModelSelector models={models} />
        <ModelView selectedModelId={selectedModelId} />
      </div>
    );
  }
}

export default AppHome;
