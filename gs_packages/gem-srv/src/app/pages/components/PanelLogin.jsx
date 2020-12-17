import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelLogin extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Login',
      username: ''
    };
    this.OnInputChange = this.OnInputChange.bind(this);
    this.OnLoginClick = this.OnLoginClick.bind(this);
  }

  OnInputChange(e) {
    // Handle authentication
    console.log('User typed', e.target.value);
    this.setState({ username: e.target.value });
  }

  OnLoginClick() {
    // This should send a login message to URSYS
    // HACK FOR NOW
    const { onClick } = this.props;
    onClick('selectSimulation');
  }

  render() {
    const { title, username } = this.state;
    const { id, isActive, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('login');
    };

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '200px',
              height: '200px'
            }}
          >
            <div className={classes.instructions} style={{ textAlign: 'center' }}>
              Enter your login token
            </div>
            <input
              id="username"
              className={classes.input}
              type="text"
              value={username}
              onChange={this.OnInputChange}
            />
            <button
              className={classes.button}
              type="submit"
              onClick={this.OnLoginClick}
            >
              LOGIN
            </button>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelLogin);
