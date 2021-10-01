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
     which is handled by project-server

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
      round: undefined
    };
    this.urStateUpdated = this.urStateUpdated.bind(this);
    this.onFormInputUpdate = this.onFormInputUpdate.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('rounds', this.urStateUpdated);

    const roundsSGM = UR.ReadFlatStateGroups('rounds');
    this.urStateUpdated(roundsSGM);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('rounds', this.urStateUpdated);
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
    const { roundId, onFormChange } = this.props;
    onFormChange({ roundId, round });
  }

  urStateUpdated(stateObj, cb) {
    const { rounds } = stateObj;
    if (rounds) {
      const { roundId } = this.props;
      const round = rounds.find(r => r.id === roundId);
      if (round) this.setState({ round });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { round } = this.state;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { roundId, onFormChange, classes } = this.props;

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
          <div className={classes.inspectorLabelLeft}>Round {roundId}</div>
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
