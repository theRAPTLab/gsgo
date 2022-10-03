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

  constructor(def) {
    if (def === undefined)
      throw new Error(
        `ProjectRound.load missing definition object: ${JSON.stringify(def)}`
      );
    this._id = def.id !== undefined ? def.id : 0;
    this._label = def.label !== undefined ? def.label : '';

    this._time = def.time !== undefined ? def.time : 60;

    this._intro = def.intro !== undefined ? def.intro : '';
    this._outtro = def.outtro !== undefined ? def.outtro : '';
    this._initScript = def.initScript !== undefined ? def.initScript : '';
    this._endScript = def.endScript !== undefined ? def.endScript : '';
  }

  get() {
    const round: any = {};
    round.id = this._id;
    round.label = this._label;
    round.time = this._time;
    round.intro = this._intro;
    round.outtro = this._outtro;
    round.initScript = this._initScript;
    round.endScript = this._endScript;
    return round;
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
