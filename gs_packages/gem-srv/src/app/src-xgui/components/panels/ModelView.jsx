import React from "react";
import PropTypes from "prop-types";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";
import { TAB } from "../../constants";

class ModelView extends React.Component {
  constructor() {
    super();
    this.Back = this.Back.bind(this);
    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.DoRun = this.DoRun.bind(this);
    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  HandleDATAUpdate(data) {
    this.forceUpdate();
  }

  HandleUIUpdate(data) {}

  Back() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectModelId,
      params: {
        modelId: undefined, // deselect to go back to model select view
      },
    });
  }

  OnLabelChange(e) {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateModel,
      params: {
        modelId: this.props.selectedModelId,
        label: e.target.value,
      },
    });
  }

  DoRun() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectAppTab,
      params: {
        tabId: TAB.RUN,
      },
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { selectedModelId } = this.props;
    if (selectedModelId === undefined) return "";

    const model = APP.GetModel(selectedModelId);
    const agents = APP.GetModelAgents();
    return (
      <div style={{ padding: "5px" }}>
        <button onClick={this.Back}>Close</button>
        <h1>Selected Model</h1>
        <h1>
          <input
            type="text"
            onChange={this.OnLabelChange}
            value={model.label}
          />
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div
            style={{ display: "flex", flexDirection: "column", width: "50%" }}
          >
            <div>DATE CREATED: 09/20/2020 3:20pm</div>
            <div>MODIFIED: 09/21/2020 4:42pm</div>
            <div>
              DESCRIPTION: Lorem ipsum dolor sit amet, consectetur adipisicing
              elit, sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
              laboris nisi ut aliquip ex ea commodo consequat.
            </div>
            <br />
            <button style={{ fontSize: "1.5em" }} onClick={this.DoRun}>RUN</button>
          </div>
          <div>
            <div>AGENTS:</div>
            <ul>
              {agents.map((a) => (
                <li key={a.id}>{a.label}</li>
              ))}
            </ul>
          </div>
          <div>
            <div>SAVED RUNS</div>
            <ul>
              <li>09/20/2020 5:30pm</li>
              <li>09/20/2020 5:35pm</li>
              <li>09/20/2020 5:49pm</li>
              <li>09/19/2020 4:40pm</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

ModelView.propTypes = {
  selectedModelId: PropTypes.string,
};

export default ModelView;
