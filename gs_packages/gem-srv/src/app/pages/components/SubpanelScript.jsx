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
import * as TRANSPILER from 'script/transpiler-v2';
import { GetAllFeatures } from 'modules/datacore/dc-sim-resources';
import {
  ScriptToJSX,
  UpdateScript
} from 'modules/sim/script/tools/script-to-jsx';

import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

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
    // Update the script
    const { script } = this.props;
    const { isEditable } = this.state;
    if (isEditable) {
      const updatedScript = UpdateScript(script, data);

      // WORKING VERSION
      // // 1. Convert init script text to script units
      // const origScriptUnits = TRANSPILER.TextToScript(script);
      // console.log('orig script', origScriptUnits);

      // // 2. Figure out which unit to replace
      // const line = data.index;
      // const parentLine = data.parentIndices;
      // let scriptUnits = [...origScriptUnits];
      // console.log('scriptUnits (should be same as prev)', scriptUnits);
      // if (parentLine !== undefined) {
      //   // Update is a nested line, replace the block
      //   console.log('updating nested line');

      //   // what if we don't know what the block is?
      //   // why don't we know the block?
      //   // featCall is not passin the options info to featProp?

      //   const blockPosition = data.blockIndex; // could be first block or second block <conseq> <alt>
      //   console.error('block is', blockPosition);
      //   const origBlock = scriptUnits[parentLine][blockPosition];
      //   console.log('...origBlock', origBlock);
      //   console.log('...line', line);
      //   const origBlockData = origBlock.block;
      //   origBlockData.splice(line, 1, ...data.scriptUnit);
      //   console.log('...updatedBlockData', origBlockData);
      //   scriptUnits[parentLine][blockPosition] = {
      //     block: origBlockData
      //   };
      // } else {
      //   // Update root level line
      //   scriptUnits[line] = data.scriptUnit;
      // }
      // console.log('updated ScriptUnits', scriptUnits, scriptUnits[1]);

      // // 3. Convert back to script text
      // const updatedScript = TRANSPILER.ScriptToText(scriptUnits);
      // console.log('updated script text', updatedScript);

      // ORIG
      // // 1. Convert full script text to array
      // const scriptTextLines = script.split('\n');
      // // 2. Convert the updated line to text
      // const updatedLineText = TRANSPILER.ScriptToText(data.scriptUnit);
      // // 3. Replace the updated line in the script array
      // scriptTextLines[data.index] = updatedLineText;
      // // 4. Convert the script array back to script text
      // const updatedScript = scriptTextLines.join('\n');

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
    const source = TRANSPILER.TextToScript(script);

    // Construct list of selectable agent properties
    const propMap = TRANSPILER.ExtractBlueprintPropertiesMap(script);

    // // ORIG => This doesn't load all the features?!?
    //              // Construct list of featProps for script UI menu
    //              // HACK: Rounds are run by the Global Agent, which only has the Population
    //              // feature available
    //              const featPropMap = TRANSPILER.ExtractFeatPropMap(['Population']);

    // Construct list of featProps for script UI menu
    const features = GetAllFeatures();
    const featNames = [...features.keys()];
    const featPropMap = TRANSPILER.ExtractFeatPropMap(featNames);

    const jsx = ScriptToJSX(source, {
      isEditable,
      isDeletable: isDeletingProperty,
      isInstanceEditor: false,
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
