/*

      ActionEditor
      
      1. Select an agent
      2. Agent selection determines the actions that are availabe.
      
 */

import React from "react";
import PropTypes from "prop-types";
import Expression from "./Expression";
import { DATATYPE } from "../../constants";
import DISPATCHER from "../../dispatcher";

const DBG = true;
const PR = "ActionEditor: ";

class ActionEditor extends React.Component {
  constructor() {
    super();
    this.Delete = this.Delete.bind(this);
  }

  Delete() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.DeleteAction,
      params: {
        actionId: this.props.action.id,
        eventId: this.props.eventId,
      },
    });
  }

  render() {
    const { action } = this.props;
    if (action === undefined) return "";
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2px",
          padding: "5px",
          backgroundColor: "orange",
        }}
      >
        <Expression expression={action} dataType={DATATYPE.ACTION} />
        <button className="close-btn" onClick={this.Delete}>
          X
        </button>
      </div>
    );
  }
}

ActionEditor.propTypes = {
  action: PropTypes.object,
  eventId: PropTypes.string,
};

export default ActionEditor;
