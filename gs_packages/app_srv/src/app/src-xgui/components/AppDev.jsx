import React from "react";
import APP from "../app-logic";
import DB from "../datastore";

class AppDev extends React.Component {
  constructor() {
    super();

    this.state = {
      status: "",
    };

    this.LoadJSON = this.LoadJSON.bind(this);
  }

  LoadJSON(e) {
    let filename = e.target.files[0].name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      APP.LoadDB(data);
      this.setState({ status: `${filename} loaded` });
    };
    reader.readAsText(e.target.files[0]);
  }

  componentDidMount() {
    let exportData = "data:text/json;charset=utf-8,";
    exportData += encodeURIComponent(JSON.stringify(DB, null, 4));
    const download = document.getElementById("download");
    download.setAttribute("href", exportData);
    download.setAttribute("download", "datastore.json");
  }

  render() {
    const { status } = this.state;
    return (
      <div
        className="mainpanel"
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignContent: "center",
          padding: "10px",
          overflow: "hidden",
          backgroundColor: "#999",
        }}
        onClick={this.OnClick}
      >
        <div>
          <h1>DEV PANEL</h1>
          <p>
            The "DEV" panel houses various utilities that are helpful during the
            development phase of this project. The tools are intended for
            researchers and curriculum developers only. They are not intended
            for teacher or studen tuse.
          </p>
          <h3>Development Utilities</h3>
          <p>
            Save your script changes by downloading the JSON file. You can
            reload them later.
          </p>
          <a id="download">Download JSON</a>
          <label>
            Load JSON:&nbsp;
            <input type="file" onChange={this.LoadJSON} />
          </label>
          <div>{status}</div>
        </div>
        <br />
        <hr />
        <br />
        <h3>Color Scheme</h3>
        <div style={{ display: "flex" }}>
          <div className="colorblock bg1">dark shade</div>
          <div className="colorblock bg2">dark accent</div>
          <div className="colorblock bg3">light accent</div>
          <div className="colorblock bg5">light shade</div>
          <div className="colorblock bg4">main brand</div>
        </div>
      </div>
    );
  }
}

export default AppDev;
