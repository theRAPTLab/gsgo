import React from 'react';
import UR from '@gemstep/ursys/client';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import PlayButton from './PlayButton';

class PanelPlayback extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Control',
      isDisabled: true,
      isRunning: false
    };
    this.DoModelUpdate = this.DoModelUpdate.bind(this);
    this.OnResetClick = this.OnResetClick.bind(this);
    this.OnStartClick = this.OnStartClick.bind(this);

    UR.RegisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.DoModelUpdate);
  }

  componentWillUnmount() {
    UR.UnregisterMessage('HACK_SIMDATA_UPDATE_MODEL', this.DoModelUpdate);
  }

  DoModelUpdate(data) {
    // If no model has been set, then disable (hide) all the run/playback buttons
    this.setState({ isDisabled: data.model === undefined });
  }

  OnResetClick() {
    UR.RaiseMessage('NET:HACK_SIM_RESET');
  }

  OnStartClick() {
    const { isRunning } = this.state;
    if (isRunning) {
      UR.RaiseMessage('NET:HACK_SIM_STOP');
    } else {
      UR.RaiseMessage('NET:HACK_SIM_START');
    }
    this.setState({ isRunning: !isRunning });
  }

  render() {
    const { title, isDisabled, isRunning } = this.state;
    const { id, isActive, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {isDisabled ? (
              <p>No model loaded</p>
            ) : (
              <>
                <button
                  type="button"
                  className={classes.button}
                  onClick={this.OnResetClick}
                >
                  RESET
                </button>
                <PlayButton isRunning={isRunning} onClick={this.OnStartClick} />
              </>
            )}

            {/* <div className={clsx(classes.button, classes.buttonDisabled)}>
              PAUSE
            </div>
            <div className={clsx(classes.button, classes.buttonDisabled)}>
              STOP
            </div>
            <div className={clsx(classes.button, classes.buttonDisabled)}>
              REPLAY
            </div> */}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelPlayback);
