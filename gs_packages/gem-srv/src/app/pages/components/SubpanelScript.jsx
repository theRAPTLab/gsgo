/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
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
import * as TRANSPILER from 'script/transpiler';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

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
      isDeletingProperty: false
    };
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.OnSave = this.OnSave.bind(this);
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
    console.warn('got script data update', data);
    // Update the script
    const { script } = this.props;
    const { isEditable } = this.state;
    if (isEditable) {
      // 1. Convert full script text to array
      const scriptTextLines = script.split('\n');
      // 2. Convert the updated line to text
      const updatedLineText = TRANSPILER.TextifyScript(data.scriptUnit);
      // 3. Replace the updated line in the script array
      scriptTextLines[data.index] = updatedLineText;
      // 4. Convert the script array back to script text
      const updatedScript = scriptTextLines.join('\n');

      if (data.exitEdit) {
        this.DoDeselect();
      }

      console.error('updated script is', updatedScript);

      this.setState({ script: updatedScript }, () => this.OnSave());
    }
  }

  OnSave() {
    const { script } = this.state;
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
      isDeletingProperty
    } = this.state;
    const { id, script, onChange, classes } = this.props;
    const source = TRANSPILER.ScriptifyText(script);

    // Construct list of selectable agent properties
    const propMap = TRANSPILER.ExtractBlueprintPropertiesMap(script);

    // Construct list of featProps for script UI menu
    // HACK: Rounds are run by the Global Agent, which only has the Population
    // feature available
    const featPropMap = TRANSPILER.ExtractFeatPropMap(['Population']);

    const jsx = TRANSPILER.RenderScript(source, {
      isEditable,
      isDeletable: isDeletingProperty,
      isInstanceEditor: true,
      propMap,
      featPropMap
    });

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
          <div>{jsx}</div>
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(SubpanelScript);
