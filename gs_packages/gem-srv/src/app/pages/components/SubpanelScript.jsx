/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

SubpanelScript

A non-Paneled GEMSCRIPT script editor.
Used for editing snippets of GEMSCRIPT (not full Blueprints),
primarily introScript and endScripts for Rounds.

Usually hosted by `PanelRoundEditor`.

Update Cycle
1. prop.tsx / featProp.tsx will send individual script line
   changes via URSYS message SCRIPT_UI_CHANGED.
2. this.HandleScriptUpdate will insert the updated script line
   into the full script text
3. and then send the result to the parent via the props' onChange method.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import * as TRANSPILER from 'script/transpiler-v2';
import { GetAllFeatures } from 'modules/datacore/dc-sim-data';
import {
  ScriptToJSX,
  UpdateScript
} from 'modules/sim/script/tools/script-to-jsx';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import CodeEditor from './CodeEditor';

const DBG = true;

class SubpanelScript extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'EDITOR',
      isEditable: false,
      isHovered: false,
      isSelected: false,
      isAddingProperty: false,
      isDeletingProperty: false,
      isDirty: false,
      showConfirmSave: false
    };
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.SaveScript = this.SaveScript.bind(this);
    this.UpdateDirty = this.UpdateDirty.bind(this);
    this.OnEditRound = this.OnEditRound.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
  }

  /**
   * Individual script line update sent from prop.tsx or featProp.tsx
   * We need to fold the line back into the full text
   * @param {*} data
   */
  HandleScriptUpdate(data) {
    // Update the script
    const { script } = this.props;
    const { isEditable } = this.state;
    if (isEditable) {
      const updatedScript = UpdateScript(script, data);

      if (data.exitEdit) {
        this.DoDeselect();
      }

      console.error('updated script is', updatedScript);

      this.setState({ script: updatedScript }, () => this.SaveScript());
    }
  }

  SaveScript(data) {
    const { code: script } = data;
    const { id, onChange } = this.props;
    // emulate an event.  parent handler is `onFormInputUpdate`
    const event = {};
    event.target = {
      id,
      type: 'hack-not-checkbox', // so PathRoundEditor.onFormInputUpdate will use e.target.value rahter than e.target.checked
      value: script
    };
    onChange(event);
  }

  UpdateDirty(isDirty) {
    this.setState({ isDirty });
  }

  /**
   * Edit round -- User clicked on round in panel
   */
  OnEditRound(e) {
    this.setState(state => {
      return { isEditable: !state.isEditable };
    });
  }

  StopEvent(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// URSYS Events
  ///

  render() {
    const {
      title,
      isEditable,
      isHovered,
      isSelected,
      isAddingProperty,
      isDeletingProperty,
      isDirty,
      showConfirmSave
    } = this.state;
    const { id, script, onChange, classes } = this.props;
    return (
      <div
        className={clsx(classes.instanceSpec, {
          [classes.instanceSpecHovered]: isHovered,
          [classes.instanceSpecSelected]: isSelected
        })}
        onClick={this.OnEditRound}
        // onPointerEnter={this.OnHoverOver}
        // onPointerLeave={this.OnHoverOut}
      >
        <div>
          <CodeEditor
            code={script}
            showConfirmSave={showConfirmSave}
            onSave={this.SaveScript}
            onDirty={this.UpdateDirty}
          />
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(SubpanelScript);
