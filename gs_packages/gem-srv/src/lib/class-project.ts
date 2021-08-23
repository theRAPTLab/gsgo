/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Object

  Used by:
  *

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import ProjectMetadata from './class-project-meta';
import ProjectRound from './class-project-round';
import ProjectBlueprint from './class-project-blueprint';
import ProjectInstance from './class-project-instance';

/// CLASS DEFINITIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default class Project {
  // Core
  private _id: any; // id of project object
  private _slug: string; // project name url, e.g. `?model=aquatic`
  private _label: string;
  // Settings
  private _metadata: ProjectMetadata;
  // Definitions
  private _rounds: ProjectRound[];
  private _blueprints: ProjectBlueprint[];
  private _instances: ProjectInstance[];

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  constructor(id) {
    this.init(id);
  }

  init(id) {
    this._id = id;
    this._label = '';
    this._metadata = new ProjectMetadata(id);
    this._rounds = [];
    this._blueprints = [];
    this._instances = [];
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

  get metadata(): ProjectMetadata {
    return this._metadata;
  }
  set metadata(val: ProjectMetadata) {
    this._metadata = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// DEFINITIONS
  ///
  /// In general, don't use these getters/setters!  Use the API!
  get rounds(): ProjectRound[] {
    return this._rounds;
  }
  set rounds(val: ProjectRound[]) {
    this._rounds = val;
  }
  get blueprints(): ProjectScript[] {
    return this._blueprints;
  }
  set blueprints(val: ProjectScript[]) {
    this._blueprints = val;
  }
  get instances(): ProjectInstance[] {
    return this._instances;
  }
  set instances(val: ProjectInstance[]) {
    this._instances = val;
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// API

  GetRound(id) {
    return this.rounds.find(r => r.id === id);
  }
  SetRound(id, updatedRound) {
    const index = this.rounds.findIndex(r => r.id === id);
    this.rounds[index] = { ...updatedRound }; // copy
  }
  GetBlueprint(id) {
    return this.blueprints.find(s => s.id === id);
  }
  SetBlueprint(id, updatedBlueprint) {
    const index = this.blueprints.findIndex(s => s.id === id);
    this.blueprints[index] = { ...updatedBlueprint }; // copy
  }
  GetInstance(id) {
    return this.instances.find(i => i.id === id);
  }
  SetInstance(id, updatedInstance) {
    const index = this.instances.findIndex(i => i.id === id);
    this.instances[index] = { ...updatedInstance }; // copy
  }
}
