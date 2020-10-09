import React from "react";
import PropTypes from "prop-types";
import DISPATCHER from "../../dispatcher";

class ProjectSelector extends React.Component {
  constructor() {
    super();
    this.OnSelectModel = this.OnSelectModel.bind(this);
    this.OnAddModel = this.OnAddModel.bind(this);
  }

  OnSelectModel(modelId) {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectModelId,
      params: {
        modelId,
      },
    });
  }

  OnAddModel() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddModel,
      params: {},
    });
  }

  render() {
    const { models } = this.props;

    return (
      <div>
        <h1>MODELS</h1>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {models.map((model) => (
            <button
              className={`projectbtn ${model.type === "shared" && "shared"}`}
              key={model.id}
              onClick={() => this.OnSelectModel(model.id)}
            >
              {model.label}
            </button>
          ))}
          <button className="projectbtn new" onClick={this.OnAddModel}>+</button>
        </div>
      </div>
    );
  }
}

ProjectSelector.propTypes = {
  models: PropTypes.array,
};

export default ProjectSelector;
