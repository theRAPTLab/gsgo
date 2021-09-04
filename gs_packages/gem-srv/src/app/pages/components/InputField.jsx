/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generic User Input Field

  Intended for use inside an InstanceEditor.

  type = 'string' || 'number'

  Input `value` is set via parent prop.value
  All changes are sent immediately with prop.onChange

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.onInputChange = this.onInputChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.sendExitSignal = this.sendExitSignal.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onInputChange(e) {
    const { onChange } = this.props;
    onChange({ value: e.currentTarget.value });
  }

  onKeyDown(e) {
    if (e.key === 'Enter') this.sendExitSignal();
  }

  onClick(e) {
    // Stop click here when user clicks inside form to edit.
    // Otherwose clicks will propagage to InstanceEditor where it will exit edit mode
    e.preventDefault();
    e.stopPropagation();
  }

  /** Tell InstanceEditor to exit edit mode.
   *  Used to handle exiting edit on "Enter"
   */
  sendExitSignal() {
    const { onChange } = this.props;
    onChange({ exitEdit: true });
  }
  render() {
    const {
      index,
      propName,
      value,
      type,
      isEditable,
      onChange,
      classes
    } = this.props;

    if (DBG) console.log('Clear eslint', index, onChange);

    let jsx;
    if (isEditable) {
      // Show Form
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: '80px auto 15px' }}>
          <div className={classes.instanceEditorLabel}>{propName} </div>
          <input
            onChange={this.onInputChange}
            onKeyDown={this.onKeyDown}
            onBlur={this.onBlur}
            onClick={this.onClick}
            type={type}
            value={value}
            className={classes.instanceEditorField}
          />
        </div>
      );
    } else {
      // Show Static Value
      jsx = (
        <>
          {/* <div className={classes.inspectorLabel}>{propName}:&nbsp;</div> */}
          <div className={classes.inspectorData}>{value}&nbsp; </div>
        </>
      );
    }
    return jsx;
  }
}

export default withStyles(useStylesHOC)(InputField);
