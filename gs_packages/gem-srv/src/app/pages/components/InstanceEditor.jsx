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
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import { GetAgentByName } from 'modules/datacore/dc-agents';
import * as TRANSPILER from 'script/transpiler';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';
import SimData from '../../data/sim-data';
import InputField from './InputField';

class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'EDITOR',
      modelId: undefined,
      agentId: undefined,
      isEditable: false,
      isHovered: false,
      isSelected: false
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.GetAgentId = this.GetAgentId.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.HandleEditEnable = this.HandleEditEnable.bind(this);
    this.HandleHoverOver = this.HandleHoverOver.bind(this);
    this.HandleHoverOut = this.HandleHoverOut.bind(this);
    this.HandleDeselect = this.HandleDeselect.bind(this);
    this.OnHoverOver = this.OnHoverOver.bind(this);
    this.OnHoverOut = this.OnHoverOut.bind(this);
    this.OnNameSave = this.OnNameSave.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.HandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  componentDidMount() {
    this.setState({ modelId: SimData.GetCurrentModelId() });
  }

  componentWillUnmount() {
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.UnhandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.UnhandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  GetInstanceName() {
    const { instance } = this.props;
    return instance ? instance.name : '';
  }

  GetAgentId() {
    // agentId is cached
    // We don't load it at componentDidMount because the agent
    // might not be defined yet.
    let { agentId } = this.state;
    if (!agentId) {
      const { instance } = this.props;
      const agent = GetAgentByName(instance.name);
      agentId = agent.id;
      this.setState({ agentId });
    }
    return agentId;
  }

  /**
   * Script update sent from prop.tsx
   * @param {*} data
   */
  HandleScriptUpdate(data) {
    // Update the script
    const { modelId, isEditable } = this.state;
    if (isEditable) {
      const { instance } = this.props;
      const instanceName = this.GetInstanceName();
      // 1. Convert init script text to array
      const scriptTextLines = instance.init.split('\n');
      // 2. Convert the updated line to text
      const updatedLineText = data.scriptUnit.join(' ');
      // 3. Replace the updated line in the script array
      scriptTextLines[data.index] = updatedLineText;
      // 4. Convert the script array back to script text
      const updatedScript = scriptTextLines.join('\n');

      if (data.exitEdit) {
        this.DoDeselect();
      }

      UR.RaiseMessage('NET:INSTANCE_UPDATE', {
        modelId,
        instanceId: instance.id,
        instanceName,
        instanceInit: updatedScript
      });
    }
  }

  /**
   * User clicked on instance in "Map Instances" panel, wants to edit
   * @param {*} e
   */
  OnInstanceClick(e) {
    const { isEditable } = this.state;
    if (isEditable) return; // Ignore click if editing
    // just pass it up to Map Editor so it's centralized?
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId });
  }

  DoDeselect() {
    let { modelId, isSelected, isEditable } = this.state;
    const agentId = this.GetAgentId();
    isEditable = false;
    isSelected = false;
    this.setState({ isEditable, isSelected });
    // And also deselect
    UR.RaiseMessage('NET:INSTANCE_DESELECT', { modelId, agentId });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// URSYS Events
  ///
  /**
   * Enables or disables editing based on 'data' passed
   * @param {object} data { agentId }
   */
  HandleEditEnable(data) {
    const agentId = this.GetAgentId();
    let { isEditable, isSelected } = this.state;
    // Is this message for us?
    if (data.agentId === agentId) {
      // YES!  Enable!
      isEditable = true;
      isSelected = true;
      this.setState({ isEditable, isSelected });
    } else {
      // always disable if message is not for us!
      this.DoDeselect();
    }
  }
  HandleHoverOver(data) {
    const { isEditable } = this.state;
    const agentId = this.GetAgentId();
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hover if we're not editing?
    if (data.agentId === agentId && !isEditable) {
      this.setState({ isHovered: true });
    }
  }
  HandleHoverOut(data) {
    const { isEditable } = this.state;
    const agentId = this.GetAgentId();
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hoverout if we're not editing?
    if (data.agentId === agentId && !isEditable) {
      this.setState({ isHovered: false });
    }
  }
  HandleDeselect(data) {
    const agentId = this.GetAgentId();
    if (data.agentId === agentId) {
      this.setState({ isEditable: false, isSelected: false, isHovered: false });
    }
  }
  OnNameSave(data) {
    // Update the script
    const { instance } = this.props;
    const { modelId, isEditable } = this.state;
    const instanceName = data.instanceName;
    if (isEditable) {
      if (data.exitEdit) {
        console.warn('EXITING DESELECTING');
        this.DoDeselect();
      }
      UR.RaiseMessage('NET:INSTANCE_UPDATE', {
        modelId,
        instanceId: instance.id,
        instanceName
      });
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Local Events (on InstanceEditor container)
  ///
  OnHoverOver() {
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_HOVEROVER', { agentId });
  }
  OnHoverOut() {
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_HOVEROUT', { agentId });
  }

  render() {
    const {
      title,
      modelId,
      isEditable,
      isHovered,
      isSelected,
      properties,
    } = this.state;
    const { id, instance, classes } = this.props;
    const instanceName = instance.name;
    let jsx = '';
    if (instance) {
      const source = TRANSPILER.ScriptifyText(instance.init);
      jsx = TRANSPILER.RenderScript(source, { isEditable });
    }

    return (
      <div
        className={clsx(classes.instanceSpec, {
          [classes.instanceSpecHovered]: isHovered,
          [classes.instanceSpecSelected]: isSelected
        })}
        onClick={this.OnInstanceClick}
        onPointerEnter={this.OnHoverOver}
        onPointerLeave={this.OnHoverOut}
      >
        <div>
          <InputField
            propName="Name"
            value={instanceName}
            type="string"
            isEditable={isEditable}
            onSave={this.OnNameSave}
          />
          <div>{jsx}</div>
          {/* ID display for debugging */}
          <div className={classes.inspectorLabel}>{instance.id}&nbsp;</div>{' '}
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(InstanceEditor);
