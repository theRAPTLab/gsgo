import React from "react";
import PropTypes from "prop-types";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";

class AgentsList extends React.Component {
  constructor() {
    super();

    this.OnSelect = this.OnSelect.bind(this);
    this.DoToggleHidden = this.DoToggleHidden.bind(this);
  }

  OnSelect(agent, type) {
    let action;
    console.log("selected", agent);
    switch (type) {
      case "agent":
        action = DISPATCHER.ACTION.SelectAgent;
        break;
      case "instance":
        action = DISPATCHER.ACTION.SelectInstance;
        break;
      default:
        break;
    }
    DISPATCHER.Do({
      action,
      params: {
        agentId: agent.id,
      },
    });
  }

  DoToggleHidden(e) {
    const instanceId = e.target.id;
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.ToggleInstanceVisibility,
      params: {
        instanceId,
        checked: e.target.checked,
      },
    });
  }

  render() {
    const { agents, selectedAgentId, type } = this.props;
    if (agents === undefined) return "";
    return (
      <>
        {agents.map((agent) => (
          <div
            className={`agent-bar ${
              selectedAgentId && selectedAgentId === agent.id ? "selected" : ""
            }`}
            style={{ display: "flex", alignItems: "center" }}
            key={agent.id}
            onClick={() => this.OnSelect(agent, type)}
          >
            {type === "instance" && (
              <input
                type="checkbox"
                id={agent.id}
                checked={!agent.hidden}
                onChange={this.DoToggleHidden}
              />
            )}
            <div
              className={`agent 
                ${agent.type === "annotation" ? "annotation" : ""} 
                ${agent.type === "world" ? "world" : ""} 
                ${agent.type === "timer" ? "timer" : ""} 
                ${
                  selectedAgentId && selectedAgentId === agent.id
                    ? "selected"
                    : ""
                }
              `}
            >
              {type == "instance"
                ? APP.GetInstanceLabel(agent.id)
                : APP.GetAgentLabel(agent.id)}
            </div>
          </div>
        ))}
      </>
    );
  }
}

AgentsList.propTypes = {
  agents: PropTypes.array,
  selectedAgentId: PropTypes.string,
  type: PropTypes.string, // "instance" || "agent"
};

export default AgentsList;
