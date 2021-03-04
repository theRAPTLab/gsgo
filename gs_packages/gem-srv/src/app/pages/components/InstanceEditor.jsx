/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

InstanceEditor

Shows instance init scripts.
* Used to define instances in a map.
* Allows properties to be edited.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
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
    this.OnScriptUpdate = this.OnScriptUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.OnEnableEdit = this.OnEnableEdit.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.HandleMessage('INSTANCE_EDITOR_EDIT_ENABLED', this.OnEnableEdit);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.UnandleMessage('SCRIPT_UI_CHANGED', this.OnScriptUpdate);
    UR.UnandleMessage('INSTANCE_EDITOR_EDIT_ENABLED', this.OnEnableEdit);
  }

  GetInstanceName() {
    const { instance } = this.props;
    return instance ? instance.name : '';
  }

  OnScriptUpdate(data) {
    // Update the script
    const { instance } = this.props;
    const { isEditable } = this.state;
    const instanceName = this.GetInstanceName();
    if (isEditable) {
      console.log('...InstanceEditor', instanceName, 'SCRIPT_UI_CHANGED', data);

      // Proper method, but unnecessary?
      // This transforms text back and forth to scriptUnits
      // but we might be able to just insert directly?
      // const source = TRANSPILER.ScriptifyText(instance.init);
      // console.error('source is', source);
      // // update the line
      // // HACK REVIEW: Should this be a transpiler.TextifyScript call?
      // const updatedLineText = data.scriptUnit.join(' ');
      // const updatedLineScriptUnit = TRANSPILER.ScriptifyText(updatedLineText);
      // console.error('compiled is', updatedLineScriptUnit);

      // Simple Method
      // REVIEW: This is probably wrong
      // 1. Convert init script text to array
      const scriptTextLines = instance.init.split('\n');
      // 2. Convert the updated line to text
      const updatedLineText = data.scriptUnit.join(' ');
      // 3. Replace the updated line in the script array
      scriptTextLines[data.index] = updatedLineText;
      // 4. Convert the script array back to script text
      const updatedScript = scriptTextLines.join('\n');
      console.log('...updated init', updatedScript);

      UR.RaiseMessage('NET:INSTANCE_UPDATE_INIT', {
        modelId: 'aquatic',
        instanceName,
        updatedData: {
          init: updatedScript
        }
      });
    }
  }

  OnInstanceClick(e) {
    const { isEditable } = this.state;
    const instanceName = this.GetInstanceName();
    if (!isEditable) {
      // User trying to select us for editing.
      // Tell other instances in edit mode to exit edit mode
      UR.RaiseMessage('INSTANCE_EDITOR_EDIT_ENABLED', { instanceName });
    }
    this.setState({ isEditable: !isEditable });
  }

  OnEnableEdit(data) {
    // Disable editing if we're not the one that was enabled
    const instanceName = this.GetInstanceName();
    if (data.instanceName !== instanceName) {
      this.setState({ isEditable: false });
    }
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
