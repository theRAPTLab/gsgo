import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as ASSETS from 'modules/asset_core';
import * as DCPROJECT from 'modules/datacore/dc-project';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import { GS_ASSETS_PROJECT_ROOT } from '../../../../config/gem-settings';

import PanelChrome from './PanelChrome';
import DialogFilename from './DialogFilename';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSelectSimulation', 'TagPurple');
const DBG = true;

let PROJECTS = []; // [ {id, label}, ... ]

/** Returns random 3 digit suffix for filenames */
function randomSuffix() {
  const suf = String(Math.random());
  return suf.substring(suf.length - 3);
}

// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PanelSelectSimulation extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Project',
      projectTemplates: [],
      projectFiles: [],
      showEnterNameDialog: false,
      filename: '',
      selectedTemplateId: undefined,
      isValidFilename: false
    };
    this.onSelectTemplate = this.onSelectTemplate.bind(this);
    this.onSelectProject = this.onSelectProject.bind(this);
    this.onCheckValidFilename = this.onCheckValidFilename.bind(this);
    this.onCreateFileFromTemplate = this.onCreateFileFromTemplate.bind(this);
    this.onUpdateProjectsList = this.onUpdateProjectsList.bind(this);
    this.isFilenameUnique = this.isFilenameUnique.bind(this);
    this.listProjects = this.listProjects.bind(this);

    /// URSYS SYSHOOKS ////////////////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    UR.HookPhase(
      'UR/LOAD_ASSETS',
      () =>
        new Promise((resolve, reject) => {
          if (DBG)
            console.log(...PR('LOADING ASSET MANIFEST @ UR/LOAD_ASSETS...'));
          (async () => {
            await ASSETS.PromiseLoadAssets(GS_ASSETS_PROJECT_ROOT).catch(err => {
              reject(
                new Error(
                  `couldn't load from project root ${GS_ASSETS_PROJECT_ROOT}`
                )
              );
            });
            if (DBG) console.log(...PR('ASSETS LOADED'));
            resolve();
          })();
        })
    );
    UR.HookPhase('UR/APP_READY', () => {
      console.error('APP READ, list projects');
      const PROJECT_LOADER = ASSETS.GetLoader('projects');
      PROJECTS = PROJECT_LOADER.getProjectsList();
      this.listProjects(PROJECTS);
    });
    /// URSYS MESSAGE HANDLERS ////////////////////////////////////////////////
    /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    UR.HandleMessage('NET:PROJECTS_UPDATE', this.onUpdateProjectsList);
  }

  componentDidMount() {}

  componentWillUnmount() {}

  onSelectTemplate(projId) {
    if (DBG) console.log(...PR('Clicked to Select model ID:', projId));
    // This should request a model load through URSYS
    // HACK for now to go to main select screen\

    let filename;
    do {
      filename = `${projId.replace('_template_', '')}_${randomSuffix()}`;
    } while (!this.isFilenameUnique(filename));
    this.setState({
      showEnterNameDialog: true,
      filename,
      selectedTemplateId: projId
    });
  }

  onSelectProject(projId) {
    if (DBG) console.log(...PR('Clicked to Select model ID:', projId));
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick(`project=${projId}`); // Tell Login panel to show Panelselect
  }

  onCheckValidFilename(e) {
    // Update filename if it's valid
    const filename = e.target.value;
    this.isFilenameUnique(filename);
    this.setState({ filename });
  }

  async onCreateFileFromTemplate() {
    const { selectedTemplateId, filename } = this.state;
    await DCPROJECT.ProjectFileCreateFromTemplate(selectedTemplateId, filename);
    // then open it
    const { onClick } = this.props;
    onClick(`project=${filename}`);
  }

  /** UR message handler for PROJECTS_UPDATE
   *  This is raised by ac-projects running on another app on the
   *  network when the name or metadata of the project is changed,
   *  so we need to update the list.
   */
  onUpdateProjectsList(data) {
    if (data.projectNames) {
      data.projectNames.forEach(p => {
        const i = PROJECTS.findIndex(P => P.id === p.id);
        PROJECTS.splice(i, 1, { id: p.id, label: p.label });
      });
      this.listProjects(PROJECTS);
    } else {
      console.warn(
        PR,
        'PROJECTS_UPDATE message received with no projectNames:',
        data
      );
    }
  }

  /** Checks current list of project names to make sure name is unique */
  isFilenameUnique(filename) {
    const { projectFiles } = this.state;
    const ids = projectFiles.map(f => f.id);
    const isValidFilename = !ids.includes(filename);
    this.setState({ isValidFilename });
    return isValidFilename;
  }

  /** Splits the array of project files in to 'template' files and
   *  regular 'project' files so that they can be displayed in
   *  separate lists.
   *  projlist = [ ...{id, label, info}] */
  listProjects(projlist) {
    // sort alphabetically
    projlist = projlist.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });
    const projectFiles = [];
    const projectTemplates = [];
    projlist.forEach(p => {
      if (p.id.startsWith('_template_')) projectTemplates.push(p);
      else projectFiles.push(p);
    });
    this.setState({ projectTemplates, projectFiles });
  }

  render() {
    const {
      title,
      projectTemplates,
      projectFiles,
      showEnterNameDialog,
      filename,
      isValidFilename
    } = this.state;
    const { id, isActive, onClick, classes } = this.props;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '30% 70%',
            overflow: 'scroll'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'start',
              padding: '30px'
            }}
          >
            <div>
              <b>TEMPLATES</b>
            </div>
            <div className={classes.instructions}>
              <p>Create a new project from a Project Template:</p>
            </div>
            {projectTemplates.map(m => (
              <button
                type="button"
                className={classes.buttonSmall}
                style={{ textAlign: 'left' }}
                key={m.id}
                title={m.id}
                onClick={() => this.onSelectTemplate(m.id)}
              >
                New {m.label} ({m.id})
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '30px'
            }}
          >
            <div>
              <b>PROJECTS</b>
            </div>
            <div className={classes.instructions}>
              <p>Select a project to work on:</p>
            </div>
            {projectFiles.map(m => (
              <button
                type="button"
                className={classes.button}
                style={{ textAlign: 'left' }}
                key={m.id}
                title={m.id}
                onClick={() => this.onSelectProject(m.id)}
              >
                {m.label} ({m.id})
              </button>
            ))}
          </div>
        </div>
        <DialogFilename
          open={showEnterNameDialog}
          value={filename}
          hasValidFilename={isValidFilename}
          onChange={this.onCheckValidFilename}
          onClose={this.onCreateFileFromTemplate}
          yesMessage="OK"
          noMessage=""
        />
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelectSimulation);
