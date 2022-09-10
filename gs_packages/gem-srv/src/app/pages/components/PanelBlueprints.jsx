/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Lists all the blueprints available in a model
  * Used in Main > MissionRun to see which blueprints have been defined
    (click to open the script)
  * Used with Main > MissionMapEdit to create new instances
    (click to create new instance)
  * Used with Viewer to display blueprints for editing

  PanelBlueprints relies on its parent to set the list of blueprints
  because it is used both locally (on Main) and over the network
  (on Viewer). It doesn't know where to get the updated data from.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import UR from '@gemstep/ursys/client';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelBlueprints extends React.Component {
  constructor() {
    super();
    const { bpNamesList } = UR.ReadFlatStateGroups('blueprints');
    this.state = {
      title: '',
      bpNamesList
    };
    this.OnBlueprintClick = this.OnBlueprintClick.bind(this);
    this.OnNewBlueprint = this.OnNewBlueprint.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
  }

  componentDidMount() {
    const { enableAdd } = this.props;
    const title = enableAdd ? 'Add Characters' : 'Character Type Scripts';
    this.setState({ title });
    UR.SubscribeState('blueprints', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('blueprints', this.urStateUpdated);
  }

  OnBlueprintClick(bpName) {
    const { projId, enableAdd } = this.props;
    if (enableAdd) {
      // Panel is in SETUP mode: Add Instance
      UR.RaiseMessage('LOCAL:INSTANCE_ADD', { projId, blueprintName: bpName });
    } else {
      // Panel is in RUN mode: Open script in a new window
      const w = window.innerWidth * 0.9;
      const h = window.innerHeight * 0.9;
      window.open(
        `/app/scripteditor?project=${projId}&script=${bpName}`,
        bpName,
        `innerWidth=${w}, innerHeight=${h}`
      );
    }
  }

  OnNewBlueprint() {
    const { projId } = this.props;
    window.open(`/app/scripteditor?project=${projId}&script=${''}`, '_blank');
  }

  urStateUpdated(stateObj, cb) {
    const { bpNamesList } = stateObj;
    if (bpNamesList) {
      this.setState({ bpNamesList });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title, bpNamesList } = this.state;
    const { projId, id, isActive, enableAdd, classes } = this.props;
    if (!bpNamesList) return ''; // not loaded yet

    const instructions = enableAdd
      ? 'Click to add a character'
      : 'Click to edit a character type script in a new window';
    const onPanelClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    // Hide special blueprints
    const hide = ['Cursor'];
    if (enableAdd) hide.push('global'); // Do not allow 'global' instance to be created
    const filteredbpNamesList = bpNamesList.filter(bp => !hide.includes(bp));

    // sort alphabetically
    const sortedBlueprints = filteredbpNamesList.sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

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
            display: 'grid',
            height: '100%',
            gridTemplateRows: 'auto',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>{instructions}</span>
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
              }}
            >
              {sortedBlueprints.map(bpName => (
                <div
                  style={{
                    flex: '0 1 auto',
                    height: '20px',
                    overflow: 'hide'
                  }}
                  className={classes.instanceListItem}
                  onClick={() => this.OnBlueprintClick(bpName)}
                  key={bpName}
                >
                  {enableAdd ? (
                    <AddIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  ) : (
                    <EditIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  )}
                  &nbsp;{bpName}
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              alignSelf: 'flex-end',
              flex: '0 1 auto',
              height: '20px',
              overflow: 'hide'
            }}
            className={classes.instanceListItem}
            onClick={this.OnNewBlueprint}
            key="add"
          >
            <AddIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
            &nbsp;New Character Type
          </div>
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelBlueprints);
