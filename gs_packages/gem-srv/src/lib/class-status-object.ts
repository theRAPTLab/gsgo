/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Status Object for defining custom SM_Agent parameters

  Used by:
  * SM_Agent
  * AgentWidgets for barGraph

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class StatusObject {
  // Metadata
  private _id: number; // id of status object
  private _position: number; // bit, relative to agent

  // Bar Graph
  private _barGraph: number[]; // array of bar values between 0 and 1, e.g. [1.0, 0.8, 0.5, 0.9]
  private _barGraphLabels: string[]; // array of labels corresponding to the barGraph, e.g. ["A", "B", "C", "D"]

  constructor(agent) {
    this.init(agent);
  }

  init(agent) {
    this._id = agent.id;

    this._position = 1;

    this._barGraph = undefined;
    this._barGraphLabels = undefined;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// METADATA

  // getter syntax used as sobj.id, not sobj.id();
  // using this form allows us to intercept and add our own logic
  get id() {
    return this._id;
  }
  // setter syntax used as sobj.id = 0, not sobj.id(0);
  // using this form allows us to intercept and add our own logic
  set id(val) {
    this._id = val;
  }

  get position(): number {
    return this._position;
  }
  set position(val: number) {
    this._position = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// BAR GRAPH

  get barGraph(): number[] {
    return this._barGraph;
  }
  set barGraph(val: number[]) {
    this._barGraph = val;
  }
  get barGraphLabels(): string[] {
    return this._barGraphLabels;
  }
  set barGraphLabels(val: string[]) {
    this._barGraphLabels = val;
  }
}
