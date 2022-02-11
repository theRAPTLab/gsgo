/* eslint-disable react/destructuring-assignment */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  PanelProjectEditor -- Edit project metadata

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import UR from '@gemstep/ursys/client';

/// PANELS ////////////////////////////////////////////////////////////////////
import PanelChrome from './PanelChrome';
import { useStylesHOC } from '../elements/page-xui-styles';
import '../scrollbar.css';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PROJEDIT');
const DBG = false;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// NOTE: STYLES ARE IMPORTED FROM COMMON-STYLES.JS
class ProjectEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      project: undefined,
      isBeingEdited: false
    };
    this.urStateUpdated = this.urStateUpdated.bind(this);
    this.onFormInputUpdate = this.onFormInputUpdate.bind(this);
    this.OnPanelClick = this.OnPanelClick.bind(this);
    this.EditProject = this.EditProject.bind(this);
    this.EndEditProject = this.EndEditProject.bind(this);
    this.SaveProjectData = this.SaveProjectData.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('project', this.urStateUpdated);
    const projectSGM = UR.ReadFlatStateGroups('project');
    this.urStateUpdated(projectSGM);
  }

  componentDidCatch(e) {
    console.log(e);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('project', this.urStateUpdated);
  }

  onFormInputUpdate(e) {
    let val;
    if (e.target.type === 'number') val = Number(e.target.value);
    else if (e.target.type === 'checkbox') val = Boolean(e.target.checked);
    else val = e.target.value;

    /**
     * This cleans the form data so " TRuE  " becomes "true"
     * before saving as an array of booleans
     * @param {string} boolstr - e.g. " True"
     * @returns boolean
     */
    function cleanBoolString(boolstr) {
      return boolstr.toLowerCase().trim() === 'true';
    }

    const { project } = this.state;
    if (e.target.id === 'id') {
      project.id = val;
    } else if (e.target.id === 'label') {
      project.label = val;
    } else if (e.target.id === 'wrap') {
      project.metadata.wrap = val.split(',').map(w => cleanBoolString(w));
    } else {
      project.metadata[e.target.id] = val;
    }
    this.setState({ project }, () => this.SaveProjectData());
  }

  urStateUpdated(stateObj, cb) {
    const { project } = stateObj;
    if (project) this.setState({ project });
    if (typeof cb === 'function') cb();
  }

  OnPanelClick(id) {
    console.log('click', id); // e, e.target, e.target.value);
  }

  EditProject() {
    this.setState({ isBeingEdited: true });
  }

  EndEditProject() {
    this.setState({ isBeingEdited: false });
  }

  SaveProjectData() {
    const { project } = this.state;
    UR.WriteState('project', 'project', project);
  }

  render() {
    const { project, isBeingEdited } = this.state;
    const { classes } = this.props;

    if (project === undefined) return '';

    const showEdit = isBeingEdited;

    const { metadata } = project;
    const metadataFields = [
      'top',
      'right',
      'bottom',
      'left',
      'wrap',
      'bounce',
      'bgcolor',
      'roundsCanLoop'
    ];

    const inputJsx = (
      <>
        <div
          style={{
            padding: '10px',
            display: 'grid',
            gridTemplateColumns: '120px auto',
            gridTemplateRows: 'auto',
            lineHeight: '20px'
          }}
        >
          <div className={classes.inspectorLabel}>id (url)&nbsp;</div>
          <div className={classes.inspectorData}>
            <input
              id="id"
              defaultValue={project.id}
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>label&nbsp;</div>
          <div className={classes.inspectorData}>
            <input
              id="label"
              defaultValue={project.label}
              onChange={this.onFormInputUpdate}
            />
            <br />
            <br />
          </div>
        </div>
        <div>
          {metadataFields.map(f => (
            <div
              key={f}
              style={{
                padding: '0 10px',
                display: 'grid',
                gridTemplateColumns: '120px auto',
                gridTemplateRows: 'auto'
              }}
            >
              <div className={classes.inspectorLabel}>{f}&nbsp;</div>
              <div className={classes.inspectorData}>
                <input
                  id={f}
                  defaultValue={metadata[f]}
                  type={
                    typeof metadata[f] === 'boolean'
                      ? 'checkbox'
                      : typeof metadata[f]
                  }
                  checked={typeof metadata[f] === 'boolean' ? metadata[f] : false}
                  onChange={this.onFormInputUpdate}
                />
              </div>
            </div>
          ))}

          <div className={classes.inspectorLabel}>&nbsp;</div>
          <div className={classes.inspectorData}>
            <br />
            <button
              type="button"
              onClick={this.EndEditProject}
              className={classes.button}
            >
              Save Project Settings
            </button>
          </div>
        </div>
      </>
    );

    return (
      <PanelChrome
        id="project"
        title="EDIT PROJECT SETTINGS"
        isActive
        onClick={this.OnPanelClick}
      >
        <div style={{ padding: '10px' }}>
          {showEdit ? (
            inputJsx
          ) : (
            <button
              type="button"
              onClick={this.EditProject}
              className={classes.buttonSmall}
            >
              Edit Project Settings
            </button>
          )}
        </div>
      </PanelChrome>
    );
  }
}

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(ProjectEditor);
