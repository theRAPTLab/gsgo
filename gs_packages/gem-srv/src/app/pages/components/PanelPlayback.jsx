import React from 'react';
import UR from '@gemstep/ursys/client';
import { SIMSTATUS } from 'modules/sim/api-sim';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import PlayButton from './PlayButton';

class PanelPlayback extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Control',
      isRunning: false
    };
    this.OnResetClick = this.OnResetClick.bind(this);
    this.OnCostumesClick = this.OnCostumesClick.bind(this);
    this.OnNextRoundClick = this.OnNextRoundClick.bind(this);
    this.OnStartClick = this.OnStartClick.bind(this);
  }

  componentWillUnmount() {}

  OnResetClick() {
    this.setState({ isRunning: false });
    UR.RaiseMessage('NET:HACK_SIM_RESET');
  }

  OnCostumesClick() {
    this.setState({ isRunning: false });
    UR.RaiseMessage('NET:HACK_SIM_COSTUMES');
  }

  OnNextRoundClick() {
    this.setState({ isRunning: false });
    UR.RaiseMessage('NET:HACK_SIM_NEXTROUND');
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
    const { title, isRunning } = this.state;
    const { id, model, needsUpdate, isActive, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    const isDisabled = model === undefined;

    const showCostumes =
      SIMSTATUS.currentLoop === 'prerun' && !SIMSTATUS.completed;
    const showRun =
      (SIMSTATUS.currentLoop === 'prerun' ||
        SIMSTATUS.currentLoop === 'costumes' ||
        SIMSTATUS.currentLoop === 'run') &&
      !SIMSTATUS.completed;
    const showNextRun =
      (SIMSTATUS.currentLoop === 'staged' ||
        SIMSTATUS.currentLoop === 'postrun') &&
      !SIMSTATUS.completed;
    const timer = SIMSTATUS.timer;

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
          {timer !== undefined && (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: 'white'
              }}
            >
              {timer}
            </div>
          )}
          {needsUpdate && (
            <div
              className={classes.infoHighlightColor}
              style={{ padding: '5px' }}
            >
              Scripts Updated!
              <br />
              Reset Stage!
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {isDisabled ? (
              <p>No model loaded</p>
            ) : (
              <>
                <button
                  type="button"
                  className={needsUpdate ? classes.buttonHi : classes.button}
                  onClick={this.OnResetClick}
                  style={{ width: '100%' }}
                >
                  RESET STAGE
                </button>
                {showCostumes && (
                  <button
                    type="button"
                    className={needsUpdate ? classes.buttonHi : classes.button}
                    onClick={this.OnCostumesClick}
                    style={{ width: '100%' }}
                  >
                    PICK CHARACTERS
                  </button>
                )}
                {showRun && (
                  <PlayButton isRunning={isRunning} onClick={this.OnStartClick} />
                )}
                {showNextRun && (
                  <button
                    type="button"
                    className={needsUpdate ? classes.buttonHi : classes.button}
                    onClick={this.OnNextRoundClick}
                    style={{ width: '100%' }}
                  >
                    PREP ROUND
                  </button>
                )}
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
