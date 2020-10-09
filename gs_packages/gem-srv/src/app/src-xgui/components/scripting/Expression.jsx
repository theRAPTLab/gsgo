/*
    Expression
    
    Expressions take the form:
    
        {
          id, 
          sourceId,   // id to a source object
          opId,       // operator string
          targetId    // id to an expression object
        }

    
    dataType -- The Expression data type.
                The Expression should evaluate to this data type.
        
        "boolean":  Can be <Agent> || <AgentProperty>
        
        "string":     Can be <Value> || <Agent> || <AgentProperty>
        "number":
        "agent":
        
    sourceDataType -- The data type of the selected source object.
                Note that sourceDataType may not be the same as
                the expression dataType, e.g. for a boolean
                expression dataType, the sourceDataType might
                be a string.  In this case, then the target
                expression also needs to be a string.
*/
import React from "react";
import PropTypes from "prop-types";
import SourceSelector from "./SourceSelector";
import Menu from "./Menu";
import APP from "../../app-logic";
import OP from "../../operations";
import DISPATCHER from "../../dispatcher";
import { DATATYPE, VMTYPE } from "../../constants";

const DBG = true;
const PRD = "Expression";

class Expression extends React.Component {
  constructor() {
    super();
  }

  render() {
    const { expression, dataType } = this.props;
    let exp = expression;

    // Operator Options
    const sourceDataType = exp.sourceId
      ? APP.DetermineSourceDataType(exp.sourceId, dataType)
      : VMTYPE.SOURCEOBJECT.AGENT;
    let operatorOptions;
    if (dataType === DATATYPE.ACTION) {
      operatorOptions = APP.GetActionOptions(exp.sourceId);
    } else {
      operatorOptions = sourceDataType ? OP[sourceDataType] : [];
    }

    // Target Expression
    const targetExpression = exp.targetId
      ? APP.GetExpression(exp.targetId)
      : undefined;

    return (
      <div className="expression">
        {/* Source */}
        <SourceSelector sourceId={exp.sourceId} dataType={dataType} />
        {/* Operator */}
        {exp.sourceId && (
          <Menu
            options={operatorOptions}
            selectedOptionId={exp.opId}
            action={DISPATCHER.ACTION.UpdateExpressionOpId}
            actionParams={{ expressionId: exp.id }}
          />
        )}
        {/* Target Expression */}
        {exp.opId && (
          <Expression expression={targetExpression} dataType={sourceDataType} />
        )}
      </div>
    );
  }
}

Expression.propTypes = {
  expression: PropTypes.object,
  dataType: PropTypes.string,
};

export default Expression;
