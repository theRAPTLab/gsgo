/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generic User Select Field

  Intended for use with a class-keyword

  type = 'string' || 'number'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/helpers/page-xui-styles';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// NOTE: `state` is passed down from keyword
//        But `isDirty` is a local state only.
class SelectElement extends React.Component<any, any> {
  index: number; // ui index
  keyword: string; // keyword
  constructor(props: any) {
    super(props);
    const { index, state } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
    this.stopEvent = this.stopEvent.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.saveData = this.saveData.bind(this);
  }
  componentWillUnmount() {
    const { isEditable } = this.props;
    if (isEditable) this.saveData();
  }
  stopEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    // Stop click here when user clicks inside form to edit.
    // Otherwise clicks will propagage to InstanceEditor where it will exit edit mode
  }
  stopPropagation(e) {
    // Stop click here when user clicks inside form to edit.
    // Otherwise clicks will propagage to InstanceEditor where it will exit edit mode
    // Special handling for pointerDown since the select needs
    // pointerDown to open the menu
    e.stopPropagation();
  }
  handleChange(e) {
    const { onChange } = this.props;
    onChange(e.target.value);
  }
  saveData() {
    const { onChange } = this.props;
    onChange();
  }
  render() {
    const { index, value, options, selectMessage, type, classes } = this.props;
    return (
      <select
        value={value}
        onChange={this.handleChange}
        onClick={this.stopEvent}
        onPointerDown={this.stopPropagation}
      >
        <option value="" disabled>
          {selectMessage}
        </option>
        {options &&
          options.map(p => (
            <option value={p} key={p}>
              {p}
            </option>
          ))}
      </select>
    );
  }
}

export default withStyles(useStylesHOC)(SelectElement);
