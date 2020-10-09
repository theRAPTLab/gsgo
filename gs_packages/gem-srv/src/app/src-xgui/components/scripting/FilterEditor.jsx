import React from "react";
import PropTypes from "prop-types";
import Expression from "./Expression";
import { DATATYPE } from "../../constants";
import DISPATCHER from "../../dispatcher";

const DBG = false;
const PR = "FilterEditor: ";

class FilterEditor extends React.Component {
  constructor() {
    super();
    this.Delete = this.Delete.bind(this);
  }

  Delete() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.DeleteFilter,
      params: {
        filterId: this.props.filter.id,
        eventId: this.props.eventId,
      },
    });
  }

  render() {
    const { filter } = this.props;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "2px",
          padding: "5px",
          backgroundColor: "red",
        }}
      >
        <Expression expression={filter} dataType={DATATYPE.BOOL} />
        <button className="close-btn" onClick={this.Delete}>
          X
        </button>
      </div>
    );
  }
}

FilterEditor.propTypes = {
  filter: PropTypes.object,
};

export default FilterEditor;
