/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object Blueprint Script Definition

  Used by:
  * class-project.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class ProjectBlueprint {
  // Core
  private _id: any; // id of parent project object -- REVIEW: necessary?
  private _label: string;
  // Definitions
  private _scriptText: string; // blueprint definition gemscript

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(def) {
    if (def === undefined)
      throw new Error(
        `ProjectBlueprint.load missing definition object: ${JSON.stringify(def)}`
      );
    this._id = def.id !== undefined ? def.id : 0;
    this._label = def.label !== undefined ? def.label : '';

    this._scriptText = def.scriptText !== undefined ? def.scriptText : '';
  }

  get() {
    const bp: any = {};
    bp.id = this._id;
    bp.label = this._label;
    bp.scriptText = this._scriptText;
    return bp;
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

  get label(): string {
    return this._label;
  }
  set label(val: string) {
    this._label = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DEFINITIONS

  get scriptText(): string {
    return this._scriptText;
  }
  set scriptText(val: string) {
    this._scriptText = val;
  }
}
