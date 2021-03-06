/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

InstanceEditor

Shows instance init scripts.
* Used to define instances in a map.
* Allows properties to be edited.

props.instance = instance specification: {name, blueprint, init}
  e.g. {name: "fish01", blueprint: "Fish", init: "prop x setTo -220↵prop y setTo -220"}


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { GetAgentByName } from 'modules/datacore/dc-agents';
import * as TRANSPILER from 'script/transpiler';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'EDITOR',
      isEditable: false
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.GetAgentId = this.GetAgentId.bind(this);
    this.OnScriptUpdate = this.OnScriptUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.OnEditEnable = this.OnEditEnable.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.HandleMessage('INSTANCE_EDIT_ENABLE', this.OnEditEnable);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.UnandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.UnhandleMessage('INSTANCE_EDIT_ENABLE', this.OnEditEnable);
  }

  GetInstanceName() {
    const { instance } = this.props;
    return instance ? instance.name : '';
  }

  GetAgentId() {
    const { instance } = this.props;
    const agent = GetAgentByName(instance.name);
    return agent.id;
  }

  OnScriptUpdate(data) {
    // Update the script
    const { instance } = this.props;
    const { isEditable } = this.state;
    const instanceName = this.GetInstanceName();
    if (isEditable) {
      // 1. Convert init script text to array
      const scriptTextLines = instance.init.split('\n');
      // 2. Convert the updated line to text
      const updatedLineText = data.scriptUnit.join(' ');
      // 3. Replace the updated line in the script array
      scriptTextLines[data.index] = updatedLineText;
      // 4. Convert the script array back to script text
      const updatedScript = scriptTextLines.join('\n');

      UR.RaiseMessage('NET:INSTANCE_UPDATE_INIT', {
        modelId: 'aquatic',
        instanceName,
        updatedData: {
          init: updatedScript
        }
      });
    }
  }

  /**
   * User clicked on instance in "Map Instances" panel, wants to edit
   * @param {*} e
   */
  OnInstanceClick(e) {
    const { modelId, isEditable } = this.state;
    // just pass it up to Map Editor so it's centralized?
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId });
  }

  /**
   * Enables or disables editing based on 'data' passed
   * @param {object} data { agentId }
   */
  OnEditEnable(data) {
    const agentId = this.GetAgentId();
    const { modelId } = this.state;
    let { isEditable } = this.state;
    // Is this message for us?
    if (data.agentId === agentId) {
      // YES!  Enable!
      isEditable = true;
    } else if (isEditable) {
      // NOT for us, so disable
      isEditable = false;
      // And also deselect
      UR.RaiseMessage('NET:INSTANCE_DESELECT', { modelId, agentId });
    }
    this.setState({ isEditable });
  }

  render() {
    const { title, isEditable } = this.state;
    const { id, instance, classes } = this.props;
    const instanceName = instance.name;
    let jsx = '';
    if (instance) {
      const source = TRANSPILER.ScriptifyText(instance.init);
      jsx = TRANSPILER.RenderScript(source, { isEditable });
    }
    return (
      <div
        style={{
          backgroundColor: '#000',
          margin: '0.5em 0 0.5em 0.5em',
          padding: '3px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        onClick={this.OnInstanceClick}
      >
        <div>
          <div className={classes.inspectorData}>{instanceName}</div>
          <div>{jsx}</div>
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(InstanceEditor);
