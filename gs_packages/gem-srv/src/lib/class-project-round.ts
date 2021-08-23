/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object Round Definition

  Used by:
  * class-project.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class ProjectRound {
  // Core
  private _id: any; // id of parent project object -- REVIEW: necessary?
  private _label: string;
  // Settings
  private _time: number; // number of seconds the round should run
  // Definitions
  private _intro: string; // short description for dialog, displayed before round starts
  private _outtro: string; // short description for dialog, displayed after round ends
  private _initScript: string; // raw gemscript text run before round starts
  private _endScript: string; // raw gemscript text run after round ends

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(id) {
    this.init(id);
  }

  init(id) {
    this._id = id;
    this._label = '';

    this._time = 60;

    this._intro = '';
    this._outtro = '';
    this._initScript = '';
    this._endScript = '';
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

  get time(): number {
    return this._time;
  }
  set time(val: number) {
    this._time = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DEFINITIONS

  get intro(): string {
    return this._intro;
  }
  set intro(val: string) {
    this._intro = val;
  }

  get outtro(): string {
    return this._outtro;
  }
  set outtro(val: string) {
    this._outtro = val;
  }

  get initScript(): string {
    return this._initScript;
  }
  set initScript(val: string) {
    this._initScript = val;
  }

  get endScript(): string {
    return this._endScript;
  }
  set endScript(val: string) {
    this._endScript = val;
  }
}
