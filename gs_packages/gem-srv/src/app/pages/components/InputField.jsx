/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Generic User Input Field

  Intended for use inside an InstanceEditor.

  type = 'string' || 'number'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class InputField extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentValue: ''
    };
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveData = this.saveData.bind(this);
    this.onClick = this.onClick.bind(this);
  }
  componentDidMount() {
    const { value } = this.props;
    this.setState({
      currentValue: value
    });
  }
  componentWillUnmount() {
    const { isEditable } = this.props;
    if (isEditable) this.saveData();
  }
  onChange(e) {
    this.setState({
      currentValue: e.currentTarget.value,
      isDirty: true
    });
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
    // Other clicks will propagage to InstanceEditor where it will exit edit mode
  }
  /**
   *
   * @param {boolean} exitEdit Tell InstanceEditor to exit edit mode.
   *                           Used to handle exiting edit on "Enter"
   */
  saveData(exitEdit = false) {
    const { isDirty, currentValue } = this.state;
    const { onSave } = this.props;
    if (!isDirty) return;
    const updata = {
      instanceName: currentValue,
      exitEdit
    };
    onSave(updata);
  }
  render() {
    const { index, propName, value, type, isEditable, classes } = this.props;
    const { currentValue } = this.state;
    let jsx;
    if (isEditable) {
      // Show Form
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: '80px auto 15px' }}>
          <div className={classes.instanceEditorLabel}>{propName} </div>
          <input
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
            onBlur={this.onBlur}
            onClick={this.onClick}
            type={type}
            value={currentValue}
            className={classes.instanceEditorField}
          />
        </div>
      );
    } else {
      // Show Static Value
      jsx = (
        <>
          <div className={classes.inspectorLabel}>{propName}:&nbsp;</div>
          <div className={classes.inspectorData}>{value}&nbsp; </div>
        </>
      );
    }
    return jsx;
  }
}

export default withStyles(useStylesHOC)(InputField);
