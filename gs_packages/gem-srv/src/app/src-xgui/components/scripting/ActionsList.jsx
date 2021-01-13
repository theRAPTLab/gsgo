import React from "react";
import PropTypes from "prop-types";
import ActionEditor from "./ActionEditor";

class ActionsList extends React.Component {
  render() {
    const { actions, eventId } = this.props;
    if (actions === undefined || actions.length < 1) return "";
    return (
      <>
        {actions.map((a) => (
          <ActionEditor action={a} eventId={eventId} key={a.id} />
        ))}
      </>
    );
  }
}

ActionsList.propTypes = {
  actions: PropTypes.array,
  eventId: PropTypes.string,
};

export default ActionsList;
