import React from 'react';
import clsx from 'clsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelMessage extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    const {
      id,
      title = 'Messages',
      isActive,
      message,
      isError,
      classes
    } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Clicked Message Panel');
    };

    return (
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
        <div
          className={isError ? classes.panelMessageError : classes.panelMessage}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            fontSize: '12px'
          }}
        >
          <pre>{message}</pre>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelMessage);
