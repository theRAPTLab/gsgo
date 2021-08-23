/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object Instance Definition

  Used by:
  * class-project.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class ProjectInstance {
  // Core
  private _id: any; // id of parent project object -- REVIEW: necessary?
  // Definitions
  private _label: string;
  private _bpid: string;
  private _initScript: string; // blueprint definition gemscript

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(id) {
    this.init(id);
  }

  init(id) {
    this._id = id;

    this._label = '';
    this._bpid = '';
    this._initScript = '';
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// CORE

  // getter syntax used as sobj.id, not sobj.id();
  // using this form allows us to intercept and add our own logic
  get id(): any {
    return this._id;
  }
  // setter syntax used as sobj.id = 0, not sobj.id(0);
  // using this form allows us to intercept and add our own logic
  set id(val: any) {
    this._id = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DEFINITIONS

  get label(): string {
    return this._label;
  }
  set label(val: string) {
    this._label = val;
  }

  get bpid(): string {
    return this._bpid;
  }
  set bpid(val: string) {
    this._bpid = val;
  }

  get initScript(): string {
    return this._initScript;
  }
  set initScript(val: string) {
    this._initScript = val;
  }
}
