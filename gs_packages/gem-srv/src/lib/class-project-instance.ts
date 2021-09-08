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

  constructor(def) {
    if (def === undefined)
      throw new Error(
        `ProjectInstance.load missing definition object: ${JSON.stringify(def)}`
      );
    this._id = def.id !== undefined ? def.id : 0;
    this._label = def.label !== undefined ? def.label : '';

    this._bpid = def.bpid !== undefined ? def.bpid : '';
    this._initScript = def.initScript !== undefined ? def.initScript : '';
  }

  get() {
    const instance: any = {};
    instance.id = this._id;
    instance.label = this._label;
    instance.bpid = this._bpid;
    instance.initScript = this._initScript;
    return instance;
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
