/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import UR from '@gemstep/ursys/client';
import * as DATACORE from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelBlueprints extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Blueprints',
      modelId: ''
    };
    this.OnBlueprintClick = this.OnBlueprintClick.bind(this);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search.substring(1));
    const modelId = params.get('model');
    this.setState({ modelId });
  }

  OnBlueprintClick(scriptId) {
    const { modelId } = this.state;
    window.location = `/app/scripteditor?model=${modelId}&script=${scriptId}`;
  }

  render() {
    const { title } = this.state;
    const { id, isActive, agents, classes } = this.props;

    const onPanelClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      // Placeholder for now
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
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {agents.map(a => (
                <div
                  style={{
                    flex: '0 1 auto',
                    height: '20px'
                  }}
                  className={classes.instanceListItem}
                  onClick={() => this.OnBlueprintClick(a.id)}
                  key={a.label}
                >
                  {a.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelBlueprints);
