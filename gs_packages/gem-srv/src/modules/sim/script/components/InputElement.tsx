/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generic User Input Field

  This is a user input field for an arbitrary argument in the keyword,
  referenced via `argindex`.
  Intended for use with a class-keyword.

  type = 'string' || 'number'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/helpers/page-xui-styles';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// NOTE: `state` is passed down from keyword
//        But `isDirty` is a local state only.
class InputElement extends React.Component<any, any> {
  index: number; // ui index
  keyword: string; // keyword
  constructor(props: any) {
    super(props);
    const { index, state } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
    this.onInputChange = this.onInputChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveData = this.saveData.bind(this);
    this.onClick = this.onClick.bind(this);
  }
  componentWillUnmount() {
    const { isDirty } = this.state;
    if (isDirty) {
      this.saveData();
    }
  }
  onInputChange(e) {
    const { args } = this.state;
    const { argindex, onChange } = this.props;
    args[argindex] = e.currentTarget.value;
    this.setState({
      args,
      isDirty: true
    });
    // Needed to trigger isDirty in PanelSimulation
    // otherwise, "SAVE To SERVER" is not available
    // until a saveData is triggered by blur or Enter
    onChange({ argindex, value: e.currentTarget.value });
  }
  onKeyDown(e) {
    if (e.key === 'Enter') this.saveData();
  }
  onBlur() {
    this.saveData();
  }
  onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    // Stop click here when user clicks inside form to edit.
    // Otherwise clicks will propagage to InstanceEditor where it will exit edit mode
  }
  stopPropagation(e) {
    // Special handling to prevent a mouseUp on InstanceEditor
    // from canceling edit.
    // This happens when the user clicks down on the InputElement
    // then drags, releasing the mouse outside of this field.
    e.stopPropagation();
  }
  saveData(forceSave = false) {
    const { args, isDirty } = this.state;
    const { argindex, onSave, type } = this.props;
    if (isDirty || forceSave) {
      if (type === 'string') {
        // wrap strings in quotes or the parameter will be treated as a token
        args[argindex] = `"${args[argindex]}"`;
      }
      if (type === 'number' && String(args[argindex]).startsWith('.')) {
        // add leading 0 if user entered ".n"
        args[argindex] = `0${args[argindex]}`;
      }
      this.setState(
        { isDirty: false },
        () => onSave() // don't setState({args}) or the quotes will be added to the input element
      );
    }
  }
  render() {
    const { index, argindex, type, classes } = this.props;
    const { args } = this.state;
    return (
      <input
        onChange={this.onInputChange}
        onKeyDown={this.onKeyDown}
        onBlur={this.onBlur}
        onClick={this.onClick}
        onPointerDown={this.stopPropagation}
        type={type}
        value={args[argindex]}
        className={classes.instanceEditorField}
      />
    );
  }
}

export default withStyles(useStylesHOC)(InputElement);
