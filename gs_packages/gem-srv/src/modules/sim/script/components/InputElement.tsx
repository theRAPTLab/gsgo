/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  WIP -- THIS DOES NOT WORK!!!

  Generic User Input Field

  Intended for use inside an InstanceEditor.

  type = 'string' || 'number'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';

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
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveData = this.saveData.bind(this);
    this.onClick = this.onClick.bind(this);
  }
  componentWillUnmount() {
    const { isEditable } = this.props;
    if (isEditable) this.saveData();
  }
  onChange(e) {
    const { args } = this.state;
    const { argindex } = this.props;
    args[argindex] = e.currentTarget.value;
    this.setState(
      {
        args,
        isDirty: true
      },
      () => {
        const { isDirty } = this.state;
        console.log('onChanged, dirty is', isDirty);
      }
    );
  }
  onKeyDown(e) {
    if (e.key === 'Enter') this.saveData(true);
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
  saveData() {
    const { onSave } = this.props;
    const { isDirty } = this.state;
    if (isDirty) onSave();
  }
  render() {
    const { index, argindex, type, classes } = this.props;
    const { args } = this.state;
    return (
      <input
        onChange={this.onChange}
        onKeyDown={this.onKeyDown}
        onBlur={this.onBlur}
        onClick={this.onClick}
        type={type}
        value={args[argindex]}
        className={classes.instanceEditorField}
      />
    );
  }
}

export default withStyles(useStylesHOC)(InputElement);
