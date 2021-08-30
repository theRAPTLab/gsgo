/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Lists all the rounds defined for a model
  Used to select a round for editing.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import PanelRoundEditor from './PanelRoundEditor';

class PanelRounds extends React.Component {
  constructor() {
    super();
    const { rounds } = UR.ReadFlatStateGroups('rounds');
    this.state = {
      title: '',
      rounds: rounds
    };
    this.onRoundChange = this.onRoundChange.bind(this);
    this.onSave = this.onSave.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
    this.OnBlueprintClick = this.OnRoundEdit.bind(this);
  }

  componentDidMount() {
    // FUTURE: Allow adding new rounds.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { enableAdd } = this.props;
    const title = 'Edit Rounds';
    this.setState({ title });
    UR.SubscribeState('rounds', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('rounds', this.urStateUpdated);
  }

  onRoundChange(data) {
    this.setState(
      state => {
        const rounds = state.rounds;
        const idx = rounds.findIndex(r => r.id === data.roundId);
        console.error(
          'replacing round',
          data.roundId,
          'with',
          data.round,
          'at index',
          idx
        );
        rounds.splice(idx, 1, data.round);
        return { rounds };
      },
      () => this.onSave()
    );
  }

  onSave() {
    const { rounds } = this.state;
    UR.WriteState('rounds', 'rounds', rounds);
  }

  urStateUpdated(stateObj, cb) {
    const { rounds } = stateObj;
    if (rounds) {
      this.setState({ rounds });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title, rounds } = this.state;
    const { id, isActive, classes } = this.props;
    const instructions = 'Click a round to edit';
    const onPanelClick = () => {
      // To be implemented
      console.log('PanelRounds Panel Click');
    };

    return (
      <PanelChrome
        id={id}
        title={title}
        isActive={isActive}
        onClick={onPanelClick}
      >
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>{instructions}</span>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {rounds.map((r, index) => (
                <div
                  style={{
                    flex: '0 1 auto'
                  }}
                  key={r.id}
                >
                  <PanelRoundEditor
                    roundId={r.id}
                    onFormChange={this.onRoundChange}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelRounds);
