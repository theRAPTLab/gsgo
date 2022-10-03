import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

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

  onClick(name) {
    // This should request a agent load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick('script');
  }

  OnScriptClick(bpName) {
    // ScriptEditor handles `SELECT_SCRIPT` by opening the script
    // Need { id, label}
    UR.RaiseMessage('SELECT_SCRIPT', { bpName });
  }

  OnAddScript() {
    UR.RaiseMessage('SELECT_SCRIPT', { bpName: '' }); // empty agent sets new agent
  }

  render() {
    const { title } = this.state;
    const { id, isActive, bpEditList, projId, onClick, classes } = this.props;

    const sortedBlueprints = bpEditList
      ? bpEditList.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        })
      : [];

    // NOTE that `bp.editor` is not currently being tracked at all.
    // We still need to build the system to register and track who
    // is editing a specific blueprint

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
            {sortedBlueprints.map(bp => (
              <div key={bp.name} style={{ height: '60px' }}>
                <button
                  type="button"
                  disabled={bp.editor !== undefined}
                  style={{ width: '300px' }}
                  className={classes.button}
                  onClick={() => this.OnScriptClick(bp.name)}
                >
                  {bp.name}
                </button>
                <div className={classes.instructions}>
                  {bp.editor ? `Checked out by ${bp.editor}` : ''}
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
              NEW CHARACTER TYPE
            </button>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelectAgent);
