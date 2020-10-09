import React from "react";

class Inspector extends React.Component {
  constructor() {
    super();
    this.state = {
      data: [
        { label: "X", value: "132" },
        { label: "Y", value: "523" },
        { label: "EnergyLevel", value: "50%" },
      ],
    };
  }
  render() {
    const { data } = this.state;
    return (
      <div
        className="inspector"
        style={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-start",
          alignContent: "center",
        }}
      >
        {data.map((d) => (
          <div style={{ display: "flex", paddingRight: "10px" }} key={d.label}>
            <div className="inspector-label">{d.label}:&nbsp;</div>
            <div className="inspector-value">{d.value}</div>
          </div>
        ))}
        <div style={{ flexGrow: 1, textAlign: "right" }}>
          <button style={{ height: "20px" }}>set</button>
        </div>
      </div>
    );
  }
}

export default Inspector;
