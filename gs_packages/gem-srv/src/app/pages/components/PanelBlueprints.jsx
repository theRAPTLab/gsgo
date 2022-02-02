/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
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
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelBlueprints extends React.Component {
  constructor() {
    super();
    const { bpidList } = UR.ReadFlatStateGroups('blueprints');
    this.state = {
      title: '',
      bpidList
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

  OnBlueprintClick(scriptId) {
    const { projId, enableAdd } = this.props;
    if (enableAdd) {
      // Panel is in MissionEdit: Add Instance
      UR.RaiseMessage('LOCAL:INSTANCE_ADD', { projId, blueprintName: scriptId });
    } else {
      // Panel is in MissionRun: Open script in a new window
      window.open(
        `/app/scripteditor?project=${projId}&script=${scriptId}`,
        '_blank'
      );
    }
  }

  OnNewBlueprint() {
    const { projId } = this.props;
    window.open(`/app/scripteditor?project=${projId}&script=${''}`, '_blank');
  }

  urStateUpdated(stateObj, cb) {
    const { bpidList } = stateObj;
    if (bpidList) {
      this.setState({ bpidList });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const { title, bpidList } = this.state;
    const { projId, id, isActive, enableAdd, classes } = this.props;
    if (!bpidList) return ''; // not loaded yet

    const instructions = enableAdd
      ? 'Click to add a character'
      : 'Click to edit a character type script in a new window';
    const onPanelClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    // Hide special blueprints
    const hide = ['Cursor'];
    const filteredBpidList = bpidList.filter(bp => !hide.includes(bp.label));

    // sort alphabetically
    const sortedBlueprints = filteredBpidList.sort((a, b) => {
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
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
              {sortedBlueprints.map(a => (
                <div
                  style={{
                    flex: '0 1 auto',
                    height: '20px',
                    overflow: 'hide'
                  }}
                  className={classes.instanceListItem}
                  onClick={() => this.OnBlueprintClick(a.id)}
                  key={a.label}
                >
                  {enableAdd ? (
                    <AddIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  ) : (
                    <EditIcon style={{ fontSize: 10, marginRight: '0.3em' }} />
                  )}
                  &nbsp;{a.label}
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
