/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Project Core Data Object

  This is the data structure for defining a project (a set of blueprints,
  instances, specification of rounds and general stage setup, e.g. bounds
  corresponding to a particular phenomean, e.g. "Moths")

  It loads and initiates the appcore modules (and group state managers)
  for metadata, rounds, blueprints, and instances.

  Used by:
  * dc-project

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

  constructor(id = '0') {
    this.init(id);
  }

  init(id: string) {
    this._id = id;
    this._label = '';
    this._metadata = new ProjectMetadata(id);
    this._rounds = [];
    this._blueprints = [];
    this._instances = [];
  }

  /** Set data from 'def' into class-project object  */
  set(def: {
    id: string;
    label: string;
    metadata: any;
    rounds: any[];
    blueprints: any[];
    instances: any[];
  }) {
    this._id = def.id !== undefined ? def.id : this._id;
    this._label = def.label !== undefined ? def.label : this._label;
    this._metadata.set(def.metadata);
    this._rounds = def.rounds.map(r => new ProjectRound(r));
    this._blueprints = def.blueprints.map(b => new ProjectBlueprint(b));
    this._instances = def.instances.map(i => new ProjectInstance(i));
  }

  /** Get a copy of the project data */
  get() {
    const proj: any = {};
    proj.id = this._id;
    proj.label = this._label;
    proj.metadata = this._metadata.get();
    proj.rounds = this._rounds.map(r => r.get());
    proj.blueprints = this._blueprints.map(b => b.get());
    proj.instances = this._instances.map(i => i.get());
    return proj;
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
  get blueprints(): ProjectBlueprint[] {
    return this._blueprints;
  }
  set blueprints(val: ProjectBlueprint[]) {
    this._blueprints = val;
  }
  get instances(): ProjectInstance[] {
    return this._instances;
  }
  set instances(val: ProjectInstance[]) {
    this._instances = val;
  }

  /// API /////////////////////////////////////////////////////////////////////
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
}
