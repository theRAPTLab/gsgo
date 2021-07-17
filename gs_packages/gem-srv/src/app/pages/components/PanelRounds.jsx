/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Lists all the rounds defined for a model
  Used to select a round for editing.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import PanelRoundEditor from './PanelRoundEditor';

class PanelRounds extends React.Component {
  constructor() {
    super();
    this.state = {
      title: ''
    };
    this.OnBlueprintClick = this.OnRoundEdit.bind(this);
  }

  componentDidMount() {
    const { enableAdd } = this.props;
    const title = 'Edit Rounds';
    this.setState({ title });
  }

  OnRoundEdit(roundId) {
    // Make editable?
  }

  render() {
    const { title } = this.state;
    const { modelId, id, isActive, rounds, classes } = this.props;
    const instructions = 'Click a round to edit';
    const onPanelClick = () => {
      // To be implemented
      console.log('PanelRounds Panel Click');
    };

    const roundDefs = rounds && rounds.roundDefs ? rounds.roundDefs : [];

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
              {roundDefs.map((r, index) => (
                <div
                  style={{
                    flex: '0 1 auto'
                    // height: '20px',
                    // overflow: 'hide'
                  }}
                  // onClick={() => this.OnRoundEdit(r.id)}
                  key={r.id}
                >
                  <PanelRoundEditor id={r.id} round={r} modelId={modelId} />
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
