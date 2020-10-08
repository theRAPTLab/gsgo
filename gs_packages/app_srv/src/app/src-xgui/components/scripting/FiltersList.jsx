import React from "react";
import PropTypes from "prop-types";
import FilterEditor from "./FilterEditor";

class FiltersList extends React.Component {
  render() {
    const { filters, eventId } = this.props;
    return (
      <>
        {filters.map((f) => (
          <FilterEditor filter={f} eventId={eventId} key={f.id} />
        ))}
      </>
    );
  }
}

FiltersList.propTypes = {
  filters: PropTypes.array, // {id}
  eventId: PropTypes.string,
};

export default FiltersList;
