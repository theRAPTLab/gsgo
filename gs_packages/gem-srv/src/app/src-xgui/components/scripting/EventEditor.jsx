/*


    Component Hierarchy
    
    EventEditor
    --  FiltersEditor
        --  FilterEditor
            ...
        --  FilterEditor
            --  ExpressionComparison
                ==> summary
                --  AgentPropertySelector
                --  Menu (Comparator)
                --  Menu (Target Expression) ||
                    ExpressionNumber
                    --  Menu (agent/value)
                    --  AgentAndPropertySelector ||
                        Value
                    --  Menu (operator)
                    --  ExpressionNumber


*/
import React from "react";
import PropTypes from "prop-types";
import FiltersList from "./FiltersList";
import ActionsList from "./ActionsList";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";

class EventEditor extends React.Component {
  constructor() {
    super();
    this.DoSave = this.DoSave.bind(this);
    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.OnAddFilter = this.OnAddFilter.bind(this);
    this.OnAddAction = this.OnAddAction.bind(this);
  }

  DoSave(label) {
    let updatedEvent = this.props.event;
    updatedEvent.label = label;
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateEvent,
      params: {
        event: updatedEvent,
      },
    });
  }

  OnLabelChange(e) {
    console.log("typed", e.target.value);
    this.DoSave(e.target.value);
  }

  OnAddFilter() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddFilter,
      params: {
        eventId: this.props.event.id,
      },
    });
  }

  OnAddAction() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddAction,
      params: {
        eventId: this.props.event.id,
      },
    });
  }

  componentDidMount() {
    this.setState({ interactionType: this.props.event.type });
  }

  render() {
    const { agentId, event } = this.props;
    if (event === undefined) return "";
    const filters = event.filters.map((fid) => APP.GetExpression(fid));
    const actions = event.actions.map((aid) => APP.GetExpression(aid));

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "10px",
        }}
      >
        <div className="syslabel">EDIT INTERACTION</div>
        <br />
        <div className="editorItem">
          <div className="editorLabel">ID</div>
          <div className="editorValue">{event.id}</div>
        </div>
        <div className="editorItem">
          <div className="editorLabel">Interaction Name</div>
          <input
            className="editorValue"
            value={event.label}
            onChange={this.OnLabelChange}
          />
        </div>
        <div className="editorItem">
          <div className="editorLabel">Interaction Script</div>
        </div>
        <div className="editorItem">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ width: "5em" }}>WHEN</h3>
            <FiltersList filters={filters} eventId={event.id} />
            <button onClick={this.OnAddFilter}>+ Selector</button>
            <h3 style={{ width: "5em" }}>DO</h3>
            <ActionsList actions={actions} eventId={event.id}/>
            <button onClick={this.OnAddAction}>+ Action</button>
          </div>
        </div>
      </div>
    );
  }
}

EventEditor.propTypes = {
  agentId: PropTypes.string,
  event: PropTypes.object,
};

export default EventEditor;
