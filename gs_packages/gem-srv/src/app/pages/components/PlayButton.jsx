import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

class PlayButton extends React.Component {
  componentDidMount() {}
  componentWillUnmount() {}
  render() {
    const { isRunning, onClick, classes } = this.props;
    let label = isRunning ? 'STOP ROUND' : 'START ROUND';
    let css = isRunning ? classes.buttonOn : classes.button;
    return (
      <button
        type="button"
        className={css}
        onClick={onClick}
        style={{ width: '100%' }}
      >
        {label}
      </button>
    );
  }
}

export default withStyles(useStylesHOC)(PlayButton);
