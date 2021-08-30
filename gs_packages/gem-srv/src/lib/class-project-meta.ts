/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object MetaData

  Used by:
  * class-project.ts

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class ProjectMetadata {
  // Core
  private _id: any; // id of parent project object -- REVIEW: necessary?
  // Bounds
  private _top: number;
  private _right: number;
  private _bottom: number;
  private _left: number;
  // Stage Settings
  private _wrap: boolean[]; // which walls wrap in css [top,right,bottom,left] or [vert,horiz] or [all] order
  private _bounce: boolean; // agents bounce off of walls
  private _bgcolor: number; // background color of stage
  // Rounds Settings
  private _roundsCanLoop: boolean; // after last round, go back to first round

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(id) {
    this.init(id);
  }

  init(id) {
    this._id = id; // parent project id, not really used for anything currently

    this._top = 0;
    this._right = 400;
    this._bottom = 400;
    this._left = 0;

    this._wrap = [false];
    this._bounce = false;
    this._bgcolor = 0x00ffff;

    this._roundsCanLoop = false;
  }

  read(def) {
    if (def === undefined)
      throw new Error(
        `ProjectMetadata.load missing definition object: ${JSON.stringify(def)}`
      );

    this._top = def.top !== undefined ? def.top : 0;
    this._right = def.right !== undefined ? def.right : 400;
    this._bottom = def.bottom !== undefined ? def.bottom : 400;
    this._left = def.left !== undefined ? def.left : 0;

    this._wrap = def.wrap !== undefined ? def.wrap : [false];
    this._bounce = def.bounce !== undefined ? def.bounce : false;
    this._bgcolor = def.bgcolor !== undefined ? def.bgcolor : 0x00ffff;

    this._roundsCanLoop =
      def.roundsCanLoop !== undefined ? def.roundsCanLoop : false;
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
  /// BOUNDS

  get top(): number {
    return this._top;
  }
  set top(val: number) {
    this._top = val;
  }

  get right(): number {
    return this._right;
  }
  set right(val: number) {
    this._right = val;
  }

  get bottom(): number {
    return this._bottom;
  }
  set bottom(val: number) {
    this._bottom = val;
  }

  get left(): number {
    return this._left;
  }
  set left(val: number) {
    this._left = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// STAGE SETTINGS

  get wrap(): boolean[] {
    return this._wrap;
  }
  set wrap(val: boolean[]) {
    this._wrap = val;
  }

  get bounce(): boolean {
    return this._bounce;
  }
  set bounce(val: boolean) {
    this._bounce = val;
  }

  get bgcolor(): number {
    return this._bgcolor;
  }
  set bgcolor(val: number) {
    this._bgcolor = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// ROUNDS SETTINGS

  get roundsCanLoop(): boolean {
    return this._roundsCanLoop;
  }
  set roundsCanLoop(val: boolean) {
    this._roundsCanLoop = val;
  }
}
