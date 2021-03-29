import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelectAgent extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Character Type'
    };
    this.onClick = this.onClick.bind(this);
    this.OnScriptClick = this.OnScriptClick.bind(this);
    this.OnAddScript = this.OnAddScript.bind(this);
  }

  onClick(id) {
    // This should request a agent load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick('script');
  }

  OnScriptClick(id) {
    // ScriptEditor handles `SELECT_SCRIPT` by opening the script
    // Need { id, label}
    UR.RaiseMessage('SELECT_SCRIPT', { scriptId: id });
  }

  OnAddScript() {
    UR.RaiseMessage('SELECT_SCRIPT', { scriptId: '' }); // empty agent sets new agent
  }

  render() {
    const { title } = this.state;
    const { id, isActive, agents, modelId, onClick, classes } = this.props;

    // agents are [ {id, label}, ... ]

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              alignItems: 'center',
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
            <button
              type="button"
              className={classes.button}
              onClick={this.OnAddScript}
            >
              ADD CHARACTER TYPE
            </button>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelectAgent);
