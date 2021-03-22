import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelectAgent extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Agent'
    };
    this.onClick = this.onClick.bind(this);
    this.OnScriptClick = this.OnScriptClick.bind(this);
  }

  onClick(id) {
    // This should request a agent load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick('script');
  }

  OnScriptClick(id) {
    // ScriptEditor handles `HACK_SELECT_AGENT` by opening the script
    UR.RaiseMessage('HACK_SELECT_AGENT', id);
  }

  render() {
    const { title } = this.state;
    const { id, isActive, agents, onClick, classes } = this.props;

    // agents are [ {id, label}, ... ]

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '300px',
              padding: '30px'
            }}
          >
            {agents.map(m => (
              <div key={m.id}>
                <button
                  type="button"
                  disabled={m.editor !== undefined}
                  style={{ width: '300px' }}
                  className={classes.button}
                  onClick={() => this.OnScriptClick(m.id)}
                >
                  {m.label}
                </button>
                <div className={classes.instructions}>
                  {m.editor ? `Checked out by ${m.editor}` : ''}
                  <br />
                  <br />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelectAgent);
