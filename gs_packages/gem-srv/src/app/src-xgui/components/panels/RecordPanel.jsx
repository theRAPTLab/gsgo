import React from "react";
import { v4 as UUID } from "uuid";

class RecordPanel extends React.Component {
  constructor() {
    super();
    this.state = {
      currentRun: undefined,
      runs: [],
      saves: [],
    };
    this.DoRun = this.DoRun.bind(this);
    this.DoSave = this.DoSave.bind(this);
    this.DoReplay = this.DoReplay.bind(this);
    this.IsAlreadySaved = this.IsAlreadySaved.bind(this);
  }

  DoRun() {
    const run = {
      id: UUID(),
      time: new Date(),
      duration: Math.trunc(Math.random() * 240) + " sec",
    };
    const runs = this.state.runs;
    runs.push(run);
    this.setState({
      currentRun: run,
      runs,
    });
  }

  DoSave(run) {
    if (this.IsAlreadySaved(run.id)) return; // already saved
    this.setState((state) => {
      return { saves: state.saves.concat([run]) };
    });
  }

  DoReplay(run) {
    this.setState({ currentRun: run });
  }

  DoDelete(runId) {
    this.setState((state) => {
      return { saves: state.saves.filter((s) => s.id !== runId) };
    });
  }

  IsAlreadySaved(runId) {
    return this.state.saves.find((s) => s.id === runId);
  }

  componentDidMount() {
    // Load the last run
    if (this.state.runs.length > 0) {
      this.setState({
        currentRun: this.state.runs[this.state.runs.length - 1],
      });
    }
  }

  render() {
    const { currentRun, runs, saves } = this.state;
    const { project } = this.props;
    console.log('runs', runs);
    return (
      <div
        className="runpanel"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div className="syslabel">RUN MODEL</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "5px",
            overflow: "hidden",
          }}
        >
          <button>RESET STAGE</button>
          <button style={{ fontSize: "1.5em" }} onClick={this.DoRun}>
            {currentRun ? "NEW RUN" : "RUN"}
          </button>
          <hr />
          {currentRun && (
            <>
              <div className="instancepanel">
                THIS RUN: {currentRun ? currentRun.time.toLocaleString() : ""}
                <button
                  style={{ width: "100%", fontSize: "1.5em", height: "50px" }}
                >
                  REPLAY
                </button>
                <br />
                <div style={{ display: "flex" }}>
                  <button style={{ width: "100px" }}>FF</button>
                  <button style={{ flexGrow: 1 }}>PAUSE</button>
                  <button style={{ width: "100px" }}>RW</button>
                </div>
                <br />
                <button onClick={() => this.DoSave(currentRun)}>SAVE</button>
              </div>
              <hr />
            </>
          )}
          <div style={{ overflowY: "scroll" }}>
            {saves.length > 0 && (
              <>
                SAVED RUN(s):
                <ul>
                  {saves.map((r) => (
                    <li key={r.id}>
                      {r.time.toLocaleString()} {r.duration} --&nbsp;
                      <button onClick={() => this.DoReplay(r)}>REPLAY</button>
                      <button onClick={() => this.DoDelete(r.id)}>X</button>
                    </li>
                  ))}
                </ul>
                <hr />
              </>
            )}
            {runs.length > 0 && (
              <>
                RUN HISTORY:
                <ul>
                  {runs.map((r) => (
                    <li key={r.id}>
                      {r.time.toLocaleString()} {r.duration} --&nbsp;
                      {!this.IsAlreadySaved(r.id) && (
                        <button onClick={() => this.DoSave(r)}>SAVE</button>
                      )}
                      <button onClick={() => this.DoReplay(r)}>REPLAY</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="devnote">Runs are not yet saved.</div>
      </div>
    );
  }
}

export default RecordPanel;
