/*
    PropertiesList
    
    Used for both built-in agent properties
    and user-defined agent properties.

*/
import React from "react";
import PropTypes from "prop-types";

class PropertiesList extends React.Component {
  render() {
    const {
      properties,
      selectedProperty,
      title,
      viewOnly,
      OnSelect,
      OnAddProperty,
    } = this.props;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "10px",
        }}
      >
        <div className="syslabel">{title}</div>
        <div className="propertylist" style={{ flexGrow: 1 }}>
          {properties.map((property) => (
            <div
              className={`propertylist-item ${
                selectedProperty &&
                selectedProperty.label === property.label &&
                "selected"
              }`}
              onClick={() => OnSelect(property)}
              key={property.label}
            >
              <div className="propertylist-item label">{property.label}</div>
              <div className="propertylist-item value">
                :&nbsp;{property.value}
              </div>
            </div>
          ))}
        </div>
        {!viewOnly && <button onClick={OnAddProperty}>+ Property</button>}
      </div>
    );
  }
}

PropertiesList.propTypes = {
  properties: PropTypes.array,
  selectedProperty: PropTypes.object,
  title: PropTypes.string,
  viewOnly: PropTypes.bool,
  OnSelect: PropTypes.func,
  OnAddProperty: PropTypes.func,
};

export default PropertiesList;
