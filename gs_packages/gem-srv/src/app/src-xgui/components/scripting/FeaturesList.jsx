import React from "react";
import PropTypes from "prop-types";
import { DATATYPE } from "../../constants";

class FeaturesList extends React.Component {
  render() {
    const {
      features,
      selectedFeature,
      agentType,
      OnSelect,
      OnAddFeature,
    } = this.props;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "10px",
        }}
      >
        <div className="syslabel">FEATURES</div>
        <div className="propertylist">
          {features.map((feature) => (
            <div
              className={`propertylist-item ${
                selectedFeature &&
                selectedFeature.label === feature.label &&
                "selected"
              }`}
              style={{ display: "flex" }}
              onClick={() => OnSelect(feature)}
              key={feature.label}
            >
              <div>{feature.label}</div>
            </div>
          ))}
        </div>
        {agentType === DATATYPE.AGENT && (
          <button onClick={OnAddFeature}>+ Feature</button>
        )}
      </div>
    );
  }
}

FeaturesList.propTypes = {
  features: PropTypes.array,
  selectedFeature: PropTypes.object,
  agentType: PropTypes.string,
  OnSelect: PropTypes.func,
  OnAddFeature: PropTypes.func,
};

export default FeaturesList;
