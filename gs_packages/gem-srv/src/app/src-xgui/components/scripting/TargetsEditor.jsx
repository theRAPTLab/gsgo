/*

    Comparisons are implicitly with the same type of object.
    So we can make some inferences about what to show based on the 
    the nature of the object.
    
    targetTypes -- The data type of the object to be compared to the source
        agent
        number
        string
        boolean
        dict

    targetOptions
    
    Select Value / Agent
    if agent, Property

    1. Select target option (either input or agent / property selector)
    2. Set target selector (input or agent/property selector)

    Result:
      <value> <input>
      -- or --
      <agent> <property>
      
      
    e.g. "value"
        Option    Selection
        ------    ---------
      * value     [ input ]
        Bee
        Flower
        Hive
        World

    e.g. "agent"
        Option    Selection
        ------    ---------
        value     none
      * Bee
        Flower
        Hive
        World

    e.g. "agent property" with targetType = "number"
        Option    Selection
        ------    ---------
        value     x
      * Bee       y
        Flower    nectarLevel
        Hive      evertyLevel
        World

*/

import React from "react";
import APP from "../../app-logic";
import Menu from "./Menu";
import AgentPropertySelector from "./AgentPropertySelector";

const TARGETOPTION_AGENT = { id: "agent", label: "agent" };
const TARGETOPTION_AGENTPROPERTY = { id: "agentprop", label: "agent property" };
const TARGETOPTION_VALUE = { id: "value", label: "value" };

class TargetsEditor extends React.Component {
  constructor() {
    super();

    this.state = {
      optype: "agent",
      selectedTargetOption: undefined,
      selectedTarget: undefined,
      selectedTargetAgentPropertyId: undefined,
    };

    this.GetTargetOptions = this.GetTargetOptions.bind(this);
    this.OnTargetOptionSelect = this.OnTargetOptionSelect.bind(this);
    this.OnTargetSelect = this.OnTargetSelect.bind(this);
    this.OnTargetAgentPropertySelect = this.OnTargetAgentPropertySelect.bind(
      this
    );
    this.RenderTargetSelector = this.RenderTargetSelector.bind(this);
  } // constructor

  GetTargetOptions(targetType) {
    console.log("getting target options for ", targetType);
    let targetOptions = [];
    switch (targetType) {
      case "agent":
        targetOptions = APP.GetModelAgents();
        break;
      case "number":
        targetOptions = [TARGETOPTION_VALUE, ...APP.GetModelAgents()];
        break;
      case "string":
        targetOptions = [TARGETOPTION_VALUE, ...APP.GetModelAgents()];
        break;
    }
    return targetOptions;
  }

  OnTargetOptionSelect(e) {
    this.setState({ selectedTargetOption: e.target.value });
  }

  OnTargetSelect(e) {
    console.log("selected", e.target.value);
  }

  OnTargetAgentPropertySelect(e) {
    console.log("selected agent property", e.target.value);
  }

  RenderTargetSelector(selectedTargetOption) {
    // if "value" then show input
    // if "agent-template" is selected then show agent properties
    let jsx;
    if (this.props.targetType === undefined) {
      // source or operation was deselected
    } else if (this.props.targetType === "agent") {
      // Agent is already rendered, no second selection needed
    } else if (selectedTargetOption === "value") {
      // user has selected "value"
      jsx = <input type="text" value={this.props.filter.target.value} />;
    } else {
      // user has selected a specific "agent"
      // and the targetType is "number" or "string"
      // So show value or viable agent properties
      if (selectedTargetOption === undefined) {
        jsx = "";
      } else {
        const agentId = Number(selectedTargetOption);
        jsx = (
          <AgentPropertySelector
            agentId={agentId}
            selectedPropertyId={this.props.filter.target.id} // {this.state.selectedTargetAgentPropertyId}
            type={this.props.targetType}
            OnChange={this.OnTargetAgentPropertySelect}
          />
        );
      }
    }
    return jsx;
  }

  // REVIEW: Do we really want to save this as a local state?
  // should it be centralized?
  componentDidMount() {
    this.setState({ selectedTargetOption: this.props.filter.target.id });
  }

  render() {
    const { selectedTargetOption } = this.state;
    const { targetType, filter } = this.props;

    const targetOptions = this.GetTargetOptions(targetType);
    const targetSelector = this.RenderTargetSelector(selectedTargetOption);

    return (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <Menu
          options={targetOptions}
          selectedOptionId={selectedTargetOption}
          OnSelect={this.OnTargetOptionSelect}
        />
        {targetSelector}
      </div>
    );
  }
}

export default TargetsEditor;
