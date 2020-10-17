import React from 'react';
import AgentsList from './AgentsList';
import AgentEditor from './AgentEditor';
import APP from '../../app-logic';
import DISPATCHER from '../../dispatcher';

class AgentsPanel extends React.Component {
  constructor() {
    super();
    this.AddAgent = this.AddAgent.bind(this);
    this.DoMinimize = this.DoMinimize.bind(this);
    // REGISTER as a Listener
    APP.Subscribe(this);
  }

  AddAgent() {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.AddAgent,
      params: {}
    });
  }

  DoMinimize() {
    // Deselecting will minimize the AgentPanel
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.SelectAgent,
      params: {
        agentId: undefined
      }
    });
  }

  componentWillUnmount() {
    APP.Unsubscribe(this);
  }

  render() {
    const { agents, selectedAgent } = this.props;
    const selectedAgentId = selectedAgent ? selectedAgent.id : undefined;
    return (
      <div
        className="agentspanel"
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignContent: 'center',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex' }}>
            <div className="syslabel" style={{ flexGrow: 1 }}>
              AGENT TEMPLATES
            </div>
            {selectedAgent && <button onClick={this.DoMinimize}>&lt;</button>}
          </div>
          <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
            <div
              style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <AgentsList
                agents={agents}
                selectedAgentId={selectedAgentId}
                type="agent"
              />
              <div className="agent-addbtn" onClick={this.AddAgent}>
                +
              </div>
            </div>
            {selectedAgent && <AgentEditor agent={selectedAgent} />}
          </div>
        </div>
      </div>
    );
  }
}

export default AgentsPanel;
