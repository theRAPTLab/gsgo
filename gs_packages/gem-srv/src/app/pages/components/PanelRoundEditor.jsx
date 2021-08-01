/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Edit a single round's parameters

  Update Cycle
  1. Changes to input parameters are handled by onFormInputUpdate
  2. Changes to scripts are handled by SubpanelScript, which
     sends changes to onFormInputUpdate
  3. onFormInputUpdate then calls onSave
  4. onSave triggers NET:ROUND_UPDATE,
     which is handled by project-data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';
import SubpanelScript from './SubpanelScript';

class PanelRoundEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      title: '',
      round: undefined
    };
    this.onFormInputUpdate = this.onFormInputUpdate.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    const title = 'Edit Rounds';
    const { round } = this.props; // copy props to state
    this.setState({
      title,
      round
    });
  }

  /// Round Editor Direct Input Field Updates (not script wizard UI)
  onFormInputUpdate(e) {
    // console.log('typed', e.target.value, e.target.id);
    const { round } = this.state;
    if (e.target.type === 'checkbox') {
      round[e.target.id] = e.target.checked;
    } else {
      round[e.target.id] = e.target.value;
    }
    this.setState({ round }, () => this.onSave());
  }

  // Save is triggered by any change in form data
  onSave() {
    const { round } = this.state;
    UR.RaiseMessage('NET:ROUND_UPDATE', { round });
  }

  render() {
    const { title, round } = this.state;
    const { modelId, id, isActive, classes } = this.props;
    const instructions = 'Click a round to edit';
    const onPanelClick = () => {
      // To be implemented
      console.log('PanelRounds Panel Click');
    };

    if (!round) return '';

    const initScript = round.initScript || '';
    const endScript = round.endScript || '';

    return (
      <div className={classes.instanceListItem}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '70px auto',
            gridTemplateRows: 'auto',
            lineHeight: '20px'
          }}
        >
          <div className={classes.inspectorLabelLeft}>Round {id}</div>
          <div />
          <div className={classes.inspectorLabel}>label:</div>
          <div className={classes.inspectorData}>
            <input
              id="label"
              defaultValue={round.label}
              type="string"
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>time:</div>
          <div className={classes.inspectorData}>
            <input
              id="time"
              defaultValue={round.time}
              type="number"
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>intro:</div>
          <div className={classes.inspectorData}>
            <input
              id="intro"
              defaultValue={round.intro}
              type="string"
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>outtro:</div>
          <div className={classes.inspectorData}>
            <input
              id="outtro"
              defaultValue={round.outtro}
              type="string"
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>introScript</div>
          <div className={classes.inspectorData}>
            <SubpanelScript
              id="initScript"
              script={initScript}
              onChange={this.onFormInputUpdate}
            />
          </div>
          <div className={classes.inspectorLabel}>outScript</div>
          <div className={classes.inspectorData}>
            <SubpanelScript
              id="endScript"
              script={endScript}
              onChange={this.onFormInputUpdate}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(PanelRoundEditor);
