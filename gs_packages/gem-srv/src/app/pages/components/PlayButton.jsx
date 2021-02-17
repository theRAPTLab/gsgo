import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

class PlayButton extends React.Component {
  componentDidMount() {}
  componentWillUnmount() {}
  render() {
    const { isRunning, onClick, classes } = this.props;
    let label = isRunning ? 'STOP' : 'PLAY';
    let css = isRunning ? classes.buttonOn : classes.button;
    return (
      <button type="button" className={css} onClick={onClick}>
        {label}
      </button>
    );
  }
}

export default withStyles(useStylesHOC)(PlayButton);
