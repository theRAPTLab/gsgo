/*

    Menu
    
    Adds a blank menu item as the default selection.
    
    DoSave returns the whole option object.
    
    actionParams
            parameters to be sent to the dispatcher

*/
import React from "react";
import PropTypes from "prop-types";
import DISPATCHER from "../../dispatcher";

class Menu extends React.Component {
  constructor() {
    super();
    this.DoSave = this.DoSave.bind(this);
  }

  DoSave(e) {
    const id = e.target.value;
    let option = this.props.options.find((o) => o.id === id);
    DISPATCHER.Do({
      action: this.props.action,
      params: {
        selectedOption: option,
        data: this.props.actionParams,
      },
    });
  }

  render() {
    const { options, selectedOptionId, action, actionParams } = this.props;
    if (options === undefined) return "";
    return (
      <select value={selectedOptionId} onChange={this.DoSave} size={1}>
        <option value="" key={-1}></option>
        {options.map((op) => (
          <option value={op.id} key={op.id}>
            {op.label}
          </option>
        ))}
      </select>
    );
  }
}

Menu.propTypes = {
  options: PropTypes.array, // {id, label}
  selectedOptionId: PropTypes.string,
  action: PropTypes.string,
  actionParams: PropTypes.object,
};

export default Menu;
