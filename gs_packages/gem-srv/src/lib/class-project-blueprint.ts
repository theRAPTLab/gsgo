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
  // Settings
  private _isCharControllable: boolean; // agent can be controlled by charcontrol (iPad)
  private _isPozyxControllable: boolean; // pozyx tag immediately appears as agent (only one allowed per project)
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

    this._isCharControllable =
      def.isCharControllable !== undefined ? def.isCharControllable : false;
    this._isPozyxControllable =
      def.isPozyxControllable !== undefined ? def.isPozyxControllable : false;

    this._scriptText = def.scriptText !== undefined ? def.scriptText : '';
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
  /// SETTINGS

  get isCharControllable(): boolean {
    return this._isCharControllable;
  }
  set isCharControllable(val: boolean) {
    this._isCharControllable = val;
  }

  get isPozyxControllable(): boolean {
    return this._isPozyxControllable;
  }
  set isPozyxControllable(val: boolean) {
    this._isPozyxControllable = val;
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
