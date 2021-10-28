import React from 'react';
import UR from '@gemstep/ursys/client';

/// APP MAIN ENTRY POINT //////////////////////////////////////////////////////
import * as ASSETS from 'modules/asset_core';

import { CreateFileFromTemplate } from 'modules/datacore/dc-project'; // Have to import to load db
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as ACProjects from 'modules/appcore/ac-projects'; // Have to import to access state

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';
import { GS_ASSETS_PROJECT_ROOT } from '../../../../config/gem-settings';

import PanelChrome from './PanelChrome';
import DialogFilename from './DialogFilename';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelSelectSimulation', 'TagPurple');
const DBG = true;

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
    const { projectNames } = UR.ReadFlatStateGroups('projects');
    this.state = {
      title: 'Select Project',
      projectTemplates: [],
      projectFiles: projectNames,
      showEnterNameDialog: false,
      filename: '',
      selectedTemplateId: undefined,
      isValidFilename: false
      // projectNames: [
      //   // Dummy Data
      //   { id: 'aquatic', label: 'Aquatic Ecosystems' },
      //   { id: 'decomposition', label: 'Decomposition' },
      //   { id: 'particles', label: 'Particles' },
      //   { id: 'aquatic-blue', label: 'Blue Group Aquatic' }
      // ]
    };
    this.onSelectTemplate = this.onSelectTemplate.bind(this);
    this.onSelectProject = this.onSelectProject.bind(this);
    this.onCheckValidFilename = this.onCheckValidFilename.bind(this);
    this.onCreateFileFromTemplate = this.onCreateFileFromTemplate.bind(this);
    this.isFilenameUnique = this.isFilenameUnique.bind(this);
    this.listProjectTemplates = this.listProjects.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);

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
      const PROJECT_LOADER = ASSETS.GetLoader('projects');
      this.listProjects(PROJECT_LOADER.getProjectsList());
    });
  }

  componentDidMount() {
    UR.SubscribeState('projects', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('projects', this.urStateUpdated);
  }

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
    await CreateFileFromTemplate(selectedTemplateId, filename);
    // then open it
    const { onClick } = this.props;
    onClick(`project=${filename}`);
  }

  /** Checks current list of project names to make sure name is unique */
  isFilenameUnique(filename) {
    const { projectFiles } = this.state;
    const ids = projectFiles.map(f => f.id);
    const isValidFilename = !ids.includes(filename);
    this.setState({ isValidFilename });
    return isValidFilename;
  }

  /** projlist = [ ...{id, label, info}] */
  listProjects(projlist) {
    let projectFiles = [];
    let projectTemplates = [];
    projlist.forEach(p => {
      if (p.id.startsWith('_template_')) projectTemplates.push(p);
      else projectFiles.push(p);
    });
    this.setState({ projectTemplates, projectFiles });
  }

  urStateUpdated(stateObj, cb) {
    const { projectFiles } = stateObj;
    if (projectFiles) {
      this.setState({ projectFiles });
    }
    if (typeof cb === 'function') cb();
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
