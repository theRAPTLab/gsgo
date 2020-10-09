import React from "react";
import PropTypes from "prop-types";

import { DATATYPE } from "../../constants";

// Full list of unimplemented objects
// const TYPES = [
//   { id: "n", label: "Number" },
//   { id: "nc", label: "Counter" },
//   { id: "nr", label: "NumberRange" },
//   { id: "s", label: "String" },
//   { id: "sr", label: "RichText" },
//   { id: "b", label: "Boolean" },
//   { id: "c", label: "Color" },
//   { id: "v", label: "Visual" },
//   { id: "ig", label: "Group" },
//   { id: "iseq", label: "Sequence" },
//   { id: "istate", label: "State" },
//   { id: "istack", label: "Stack" },
//   { id: "ic", label: "Collection" },
//   { id: "iq", label: "Queue" },
// ];

const TYPES = [
  { id: DATATYPE.NUMBER, label: "Number" },
  { id: DATATYPE.STRING, label: "String" },
  { id: DATATYPE.BOOL, label: "Boolean" },
];

const DBG = false;
const PR = "PropertyEditor: ";

class PropertyEditor extends React.Component {
  constructor() {
    super();

    this.OnTypeSelect = this.OnTypeSelect.bind(this);
    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.OnValueChange = this.OnValueChange.bind(this);
  }

  OnTypeSelect(e) {
    if (DBG) console.log(PR, "selected", e.target.value);
    const property = Object.assign(this.props.property, {
      type: e.target.value,
    });
    this.props.OnChange(property);
  }

  OnLabelChange(e) {
    if (DBG) console.log(PR, "typed", e.target.value);
    const property = Object.assign(this.props.property, {
      label: e.target.value,
    });
    this.props.OnChange(property);
  }

  OnValueChange(e) {
    if (DBG) console.log(PR, "typed", e.target.value);
    const property = Object.assign(this.props.property, {
      value: e.target.value,
    });
    this.props.OnChange(property);
  }

  render() {
    const { property, agentType, OnChange } = this.props;
    if (property === undefined) return "";
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "10px",
        }}
      >
        <div className="syslabel">EDIT PROPERTY</div>
        <br />
        {agentType === "instance" || property.isBuiltIn ? (
          <>
            <div className="editorItem">
              <div className="editorLabel">Property Name</div>
              <div className="editorValue">{property.label}</div>
            </div>
            <div className="editorItem">
              <div className="editorLabel">Type</div>
              <div className="editorValue">{property.type}</div>
            </div>
          </>
        ) : (
          <>
            <div className="editorItem">
              <div className="editorLabel">Property Name</div>
              <input
                className="editorValue"
                value={property.label}
                onChange={this.OnLabelChange}
              />
            </div>
            <div className="editorItem">
              <div className="editorLabel">Type</div>
              <div className="editorValue">
                <select value={property.type} onChange={this.OnTypeSelect}>
                  {TYPES.map((type) => (
                    <option value={type.id} key={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
        <div className="editorItem">
          <div className="editorLabel">Initial Value</div>
          <input
            className="editorValue"
            value={property.value}
            onChange={this.OnValueChange}
          />
        </div>
      </div>
    );
  }
}

PropertyEditor.propTypes = {
  property: PropTypes.object,
  agentType: PropTypes.string,
  OnChange: PropTypes.func,
};

export default PropertyEditor;
