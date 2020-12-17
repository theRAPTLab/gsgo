import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelect extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Work',
      options: [
        // Dummy Data
        { id: 'missioncontrol', label: 'Mission Control' },
        { id: 'scripteditor', label: 'Edit Script' },
        { id: 'faketrack', label: 'Fake Track' }
      ]
    };
    this.onClick = this.onClick.bind(this);
  }

  onClick(url) {
    // This should request a model load through URSYS
    // HACK for now to go to main select screen
    window.location = `/app/${url}`;
  }

  render() {
    const { title, options } = this.state;
    const { id, isActive, onClick, classes } = this.props;

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '200px',
              padding: '30px'
            }}
          >
            {options.map(m => (
              <button
                type="button"
                className={classes.button}
                key={m.id}
                onClick={() => this.onClick(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelSelect);
