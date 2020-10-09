/*
    SourceSelector
    
    dataType
        "boolean":    Can be <Agent> || <AgentProperty>
                      If the expression dataType is boolean, then 
                      this is the root source node of an expression.
                      and must be an agent or agent property

        "string":     Can be <Value> || <Agent> || <AgentProperty>
        "number":     If the expression dataTyep is NOT boolean, then
        "agent":      this is the target of an expression, so the 
                      user can select an input Value or agent/property.

*/
import React from "react";
import PropTypes from "prop-types";
import Menu from "./Menu";
import APP from "../../app-logic";
import DISPATCHER from "../../dispatcher";
import { DATATYPE, VMTYPE } from "../../constants";

const DBG = true;
const PR = "SourceSelector: ";

class SourceSelector extends React.Component {
  constructor() {
    super();
    this.DoSaveValue = this.DoSaveValue.bind(this);
  }

  DoSaveValue(e) {
    DISPATCHER.Do({
      action: DISPATCHER.ACTION.UpdateSourceValue,
      params: {
        sourceId: this.props.sourceId,
        value: e.target.value,
      },
    });
  }

  render() {
    const { sourceId, dataType } = this.props;
    const source = APP.GetSource(sourceId);

    // REVIEW: Remove this check -- it should not be necessary?
    if (source === undefined) {
      throw "source undefined...this should not happen"
      source = APP.NewSource();
    }
    const selectedSourceId =
      source.vmtype === VMTYPE.SOURCEOBJECT.VALUE
        ? DATATYPE.VALUE
        : source.value.agentId;

    // `dataType` is the target data type of the whole expression
    // `sourceDataType` is the data type of the currently selected source
    const sourceDataType = APP.DetermineSourceDataType(sourceId, dataType);

    const valueOrAgentOptions = [{ id: DATATYPE.VALUE, label: "Value" }];
    valueOrAgentOptions.push(...APP.GetModelAgents());

    let propertyOptions = source.value.agentId
      ? APP.GetAgentPropertiesForScripting(source.value.agentId, dataType)
      : [];

    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* Agent-Only Source */}
        {(dataType === DATATYPE.BOOL ||
          dataType === DATATYPE.AGENT ||
          dataType === DATATYPE.ACTION) && (
          <Menu
            options={APP.GetModelAgents()}
            selectedOptionId={selectedSourceId}
            action={DISPATCHER.ACTION.UpdateSourceAgentId}
            actionParams={{ sourceId: sourceId }}
          />
        )}
        {/* Value or Agent Source */}
        {dataType !== DATATYPE.BOOL &&
          dataType !== DATATYPE.AGENT &&
          dataType !== DATATYPE.ACTION && (
            <Menu
              options={valueOrAgentOptions}
              selectedOptionId={selectedSourceId}
              action={DISPATCHER.ACTION.UpdateSourceAgentId}
              actionParams={{ sourceId: sourceId }}
            />
          )}
        {/* Property */}
        {source.vmtype !== VMTYPE.SOURCEOBJECT.VALUE &&
          selectedSourceId !== undefined && (
            <Menu
              options={propertyOptions}
              selectedOptionId={source.value.propertyId}
              action={DISPATCHER.ACTION.UpdateSourcePropertyId}
              actionParams={{
                sourceId: sourceId,
                agentId: source.value.agentId,
              }}
            />
          )}
        {/* Value */}
        {source.vmtype === VMTYPE.SOURCEOBJECT.VALUE && (
          <input
            type="text"
            value={source.value.inputValue}
            placeholder="Value"
            onChange={this.DoSaveValue}
          />
        )}
      </div>
    );
  }
}

SourceSelector.propTypes = {
  sourceId: PropTypes.string,
  dataType: PropTypes.string,
};

export default SourceSelector;
