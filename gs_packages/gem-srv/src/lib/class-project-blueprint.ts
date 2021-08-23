/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object Script Definition

  Used by:
  * class-project.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class ProjectScript {
  // Core
  private _id: any; // id of parent project object -- REVIEW: necessary?
  private _label: string;
  // Settings
  private _isCharControllable: boolean; // agent can be controlled by charcontrol (iPad)
  private _isPozyxControllable: boolean; // pozyx tag immediately appears as agent (only one allowed per project)
  // Definitions
  private _scriptText: string; // blueprint definition gemscript

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(id) {
    this.init(id);
  }

  init(id) {
    this._id = id;
    this._label = '';

    this._isCharControllable = false;
    this._isPozyxControllable = false;

    this._scriptText = '';
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
