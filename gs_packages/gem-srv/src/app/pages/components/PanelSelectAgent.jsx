import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelSelectAgent extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Select Agent',
      options: [
        // Dummy Data
        { id: 'fish', label: 'Fish', editor: 'UADDR01: Joshua' },
        { id: 'algae', label: 'Algae' },
        { id: 'lightbeam', label: 'Lightbeam', editor: 'UADDR01: Noel' }
      ]
    };
    this.onClick = this.onClick.bind(this);
  }

  onClick(id) {
    // This should request a agent load through URSYS
    // HACK for now to go to main select screen
    const { onClick } = this.props;
    onClick('script');
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
              alignContent: 'center',
              width: '200px',
              padding: '30px'
            }}
          >
            {options.map(m => (
              <div key={m.id}>
                <button
                  type="button"
                  disabled={m.editor !== undefined}
                  className={
                    m.editor
                      ? `${classes.button} ${classes.buttonDisabled}`
                      : classes.button
                  }
                  onClick={() => this.onClick(m.id)}
                >
                  {m.label}
                </button>
                <div className={classes.instructions}>
                  {m.editor ? `EDITING: ${m.editor}` : ''}
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
