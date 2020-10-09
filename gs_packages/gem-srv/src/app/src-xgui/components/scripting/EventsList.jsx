import React from "react";
import DISPATCHER from "../../dispatcher";

class EventsList extends React.Component {
  constructor() {
    super();
    this.OnAddEvent = this.OnAddEvent.bind(this);
  }

  OnAddEvent() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddEvent,
    });
  }

  render() {
    const { events, selectedEvent, OnSelect } = this.props;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "10px",
        }}
      >
        <div className="syslabel">INTERACTIONS</div>
        <div className="propertylist">
          {events.map((event) => (
            <div
              className={`propertylist-item ${
                selectedEvent && selectedEvent.id === event.id && "selected"
              }`}
              style={{ display: "flex" }}
              onClick={() => OnSelect(event.id)}
              key={event.id}
            >
              <div>{event.label}</div>
            </div>
          ))}
        </div>
        <button onClick={this.OnAddEvent}>+ Interaction</button>
      </div>
    );
  }
}

export default EventsList;
