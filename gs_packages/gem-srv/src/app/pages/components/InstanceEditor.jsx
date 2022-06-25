/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

InstanceEditor

Shows instance init scripts.
* Used to define instances in a map.
* Allows properties to be edited.

Limitations
* We are not supporting a full Wizard UI, but only
  a simple text code editor.

props
* label -- a temporary label for displaying in list mode
           so we don't have to load/pass the full instance object
           when clicked and placed in edit mode, the label is properly
           read from a full instance state object.

props.instance = instance specification: {name, blueprint, initScript}
  e.g. {name: "fish01", blueprint: "Fish", initScript: "prop x setTo -220↵prop y setTo -220"}

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import DeleteIcon from '@material-ui/icons/Delete';
import { Button, ClickAwayListener } from '@material-ui/core';
import * as ACInstances from 'modules/appcore/ac-instances';
import { UpdateScript } from 'modules/sim/script/tools/script-to-jsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import InputField from './InputField';
import CodeEditor from './CodeEditor';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('InstEditor');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      instance: {},
      isEditable: false,
      isHovered: false,
      isSelected: false,
      ignoreNextClickAway: false,
      showConfirmSave: false
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.OnDeleteInstance = this.OnDeleteInstance.bind(this);
    this.DoDeselect = this.DoDeselect.bind(this);
    this.DoSafeDeselect = this.DoSafeDeselect.bind(this);
    this.HandleEditEnable = this.HandleEditEnable.bind(this);
    this.HandleEditDisable = this.HandleEditDisable.bind(this);
    this.HandleHoverOver = this.HandleHoverOver.bind(this);
    this.HandleHoverOut = this.HandleHoverOut.bind(this);
    this.HandleDeselect = this.HandleDeselect.bind(this);
    this.OnHoverOver = this.OnHoverOver.bind(this);
    this.OnHoverOut = this.OnHoverOut.bind(this);
    this.OnNameChange = this.OnNameChange.bind(this);
    this.OnInstanceSave = this.OnInstanceSave.bind(this);
    this.OnClickAway = this.OnClickAway.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
    this.SaveInitScript = this.SaveInitScript.bind(this);
    this.UpdateDirty = this.UpdateDirty.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.HandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.HandleMessage('INSTANCE_EDIT_DISABLE', this.HandleEditDisable);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  componentDidMount() {
    const { id } = this.props;
    const { currentInstance } = UR.ReadFlatStateGroups('instances');
    if (currentInstance && currentInstance.id === id) {
      this.setState({ instance: currentInstance });
    }
    UR.SubscribeState('instances', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('instances', this.urStateUpdated);
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.UnhandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.UnhandleMessage('INSTANCE_EDIT_DISABLE', this.HandleEditDisable);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.UnhandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  GetInstanceName() {
    const { instance } = this.state;
    return instance && instance.label ? instance.label : 'not loaded';
  }

  /**
   * URSYS Script update sent from prop.tsx
   * @param {*} data
   */
  HandleScriptUpdate(data) {
    const { isEditable } = this.state;
    if (isEditable) {
      if (data.exitEdit) {
        this.DoSafeDeselect();
      }
      this.setState(
        state => {
          const { instance } = state;
          instance.initScript = UpdateScript(instance.initScript, data);
          return { instance };
        },
        () => this.OnInstanceSave()
      );
    }
  }

  /**
   * User clicked on instance in "Map Instances" panel, wants to edit
   * @param {*} e
   */
  OnInstanceClick(e) {
    // Ignore clicks when editing. ClickAwayListener will handle closing.
    const { isEditable } = this.state;
    if (isEditable) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // just pass it up to Main (Map Editor) so it's centralized
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId: id });
  }

  OnDeleteInstance(e) {
    const { instance } = this.state;
    const { id } = this.props;
    e.preventDefault();
    e.stopPropagation();
    const bpid = instance.bpid;
    // Tell project-server to remove agent from stage
    UR.RaiseMessage('LOCAL:INSTANCE_DELETE', { bpid, id });
  }

  DoDeselect() {
    const { id } = this.props;
    let { isSelected, isEditable } = this.state;
    isEditable = false;
    isSelected = false;
    this.setState({ isEditable, isSelected });
    // And also deselect
    UR.RaiseMessage('NET:INSTANCE_DESELECT', { agentId: id });
  }

  DoSafeDeselect() {
    // Only allow deselect if we're not dirty
    const { isEditable, isDirty } = this.state;
    // If we're dirty, we need to confirm save before deselecting
    if (isEditable && isDirty) {
      this.setState({ showConfirmSave: true });
    } else {
      // always disable if message is not for us!
      this.DoDeselect();
    }
  }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// URSYS Events
  ///
  /**
   * Enables or disables editing based on 'data' passed
   * @param {object} data { agentId }
   */
  HandleEditEnable(data) {
    const { id } = this.props;
    // Is this message for us?
    if (data.agentId === id) {
      // YES!  Enable!
      ACInstances.EditInstance(id);
      this.setState({
        isEditable: true,
        isSelected: true,
        ignoreNextClickAway: data.source === 'stage'
      });
      this.instance.scrollIntoView();
    } else {
      this.DoSafeDeselect();
    }
  }
  HandleEditDisable(data) {
    const { id } = this.props;
    // Is this message for us?
    if (data.agentId === id) {
      // YES!  Disable!
      this.DoSafeDeselect();
    }
  }
  HandleHoverOver(data) {
    const { isEditable } = this.state;
    const { id } = this.props;
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hover if we're not editing?
    if (data.agentId === id && !isEditable) {
      this.setState({ isHovered: true });
    }
  }
  HandleHoverOut(data) {
    const { isEditable } = this.state;
    const { id } = this.props;
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hoverout if we're not editing?
    if (data.agentId === id && !isEditable) {
      this.setState({ isHovered: false });
    }
  }
  HandleDeselect(data) {
    const { id } = this.props;
    const { isDirty } = this.state;
    if (data.agentId === id) {
      if (!isDirty) {
        this.setState({
          isEditable: false,
          isSelected: false,
          isHovered: false,
          isAddingProperty: false
        });
      }
    }
  }
  OnNameChange(data) {
    const { isEditable } = this.state;
    if (isEditable) {
      if (data.exitEdit) {
        // Handle "ENTER" being used to exit
        this.DoSafeDeselect();
      }
      this.setState(
        state => {
          const { instance } = state;
          instance.label = data.value !== undefined ? data.value : instance.label;
          return { instance };
        },
        () => this.OnInstanceSave()
      );
    }
  }

  OnInstanceSave() {
    const { instance } = this.state;
    UR.WriteState('instances', 'currentInstance', instance);
    this.setState({ showConfirmSave: false });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Local Events (on InstanceEditor container)
  ///
  OnHoverOver() {
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_HOVEROVER', { agentId: id });
  }
  OnHoverOut() {
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_HOVEROUT', { agentId: id });
  }
  OnClickAway(e) {
    const { id } = this.props;
    const { isEditable, isDirty, ignoreNextClickAway } = this.state;

    if (ignoreNextClickAway) {
      // Requests to edit via clicking on the instance in the stage
      // (as opposed to the PanelMapInstances list) will trigger the
      // ClickAwayListener because the InstanceEditor is enabled and
      // rendered while the click from draggable bubbles its way
      // up triggering the ClickAwayListener.  We check for that in
      // HandleEditEnable and set the ignoreNextClickAway flag.
      // Stopping propagation at dragEnd doesn't work because it's the wrong
      // event and ClickAwayListener would trigger anyway.
      this.setState({ ignoreNextClickAway: false });
      return;
    }
    if (isEditable && isDirty) {
      this.setState({ showConfirmSave: true });
    } else {
      this.DoSafeDeselect();
    }
  }

  urStateUpdated(stateObj, cb) {
    const { id } = this.props;
    const { currentInstance } = stateObj;
    if (currentInstance && currentInstance.id === id) {
      this.setState({ instance: currentInstance });
    }
    if (typeof cb === 'function') cb();
  }

  // Updates `instance` with the modified `initScript`
  /**
   * @param data { code }
   */
  SaveInitScript(data) {
    if (data && data.code) {
      this.setState(
        state => {
          const { instance } = state;
          instance.initScript = data.code;
          return { instance };
        },
        () => {
          this.OnInstanceSave();
        }
      );
    } else {
      // just close the dialog if it's open
      this.setState({ showConfirmSave: false });
    }
  }

  UpdateDirty(isDirty) {
    this.setState({ isDirty });
  }

  render() {
    const { instance, isEditable, isHovered, isSelected, showConfirmSave } =
      this.state;
    const { id, label, classes } = this.props;

    // if 'instance' data has been loaded (we're editing) then use that
    // otherwise, use the label passed by PanelMapInstances
    const inputLabel = (instance && instance.label) || label;
    if (!inputLabel) return 'not loaded yet';

    const initScript = instance ? instance.initScript : '';

    const nameInputJSX = (
      <InputField
        propName="Name"
        value={inputLabel}
        type="string"
        isEditable={isEditable}
        onChange={this.OnNameChange}
      />
    );

    return (
      <div
        ref={c => {
          this.instance = c;
        }}
        className={clsx(classes.instanceSpec, {
          [classes.instanceSpecHovered]: isHovered,
          [classes.instanceSpecSelected]: isSelected
        })}
        onPointerEnter={this.OnHoverOver}
        onPointerLeave={this.OnHoverOut}
        onClick={this.OnInstanceClick}
      >
        {!isEditable ? (
          nameInputJSX
        ) : (
          <ClickAwayListener onClickAway={this.OnClickAway}>
            <div>
              <div
                className={classes.instanceEditorLineItem}
                style={{ margin: '0.5em 0' }}
              >
                <div
                  className={classes.instanceEditorLabel}
                  style={{ fontSize: '10px' }}
                >
                  Character Type:
                </div>
                <div className={classes.instanceEditorData}>{instance.bpid}</div>
              </div>
              {nameInputJSX}
              <CodeEditor
                code={initScript}
                showConfirmSave={showConfirmSave}
                onSave={this.SaveInitScript}
                onDirty={this.UpdateDirty}
              />
              <div style={{ textAlign: 'center', marginTop: '0.5em' }}>
                <Button
                  type="button"
                  className={classes.buttonLink}
                  onClick={this.OnDeleteInstance}
                  startIcon={<DeleteIcon fontSize="small" />}
                >
                  DELETE CHARACTER
                </Button>
              </div>
            </div>
          </ClickAwayListener>
        )}
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(InstanceEditor);
