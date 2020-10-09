import APP from "./app-logic";

const DISPATCHER = {};

const ACTION = {};
ACTION.SelectAppTab = "SelectAppTab";

ACTION.AddModel = "AddModel";
ACTION.SelectModelId = "SelectModel";
ACTION.UpdateModel = "UpdateModel";

ACTION.AddAgent = "AddAgent";
ACTION.SelectAgent = "SelectAgent";
ACTION.UpdateAgent = "UpdateAgent";

ACTION.AddInstance = "AddInstance";
ACTION.SelectInstance = "SelectInstance";
ACTION.UpdateInstance = "UpdateInstance";
ACTION.UpdateInstanceAgentId = "UpdateInstanceAgentId";

ACTION.AddProperty = "AddProperty";

ACTION.AddFeature = "AddFeature";
ACTION.UpdateFeature = "UpdateFeature";

ACTION.AddEvent = "AddEvent";
ACTION.UpdateEvent = "UpdateEvent";

ACTION.AddFilter = "AddFilter";
ACTION.DeleteFilter = "DeleteFilter";

ACTION.AddAction = "AddAction";
ACTION.DeleteAction = "DeleteAction";

ACTION.UpdateExpressionOpId = "UpdateExpressionOpId";

ACTION.UpdateSource = "UpdateSource";
ACTION.UpdateSourceAgentId = "UpdateSourceAgentId";
ACTION.UpdateSourcePropertyId = "UpdateSourcePropertyId";
ACTION.UpdateSourceValue = "UpdateSourceValue";

ACTION.ToggleInstanceVisibility = "ToggleInstanceVisiblity";

DISPATCHER.ACTION = ACTION;

/**
 *
 * @param {Object} data {action, params}
 */
DISPATCHER.Do = (data) => {
  if (data.action === undefined)
    throw "No action defined for " + JSON.stringify(data) + " request!";

  switch (data.action) {
    case ACTION.SelectAppTab:
      APP.SelectAppTab(data.params.tabId);
      break;
    case ACTION.AddModel:
      APP.AddModel();
      break;
    case ACTION.SelectModelId:
      APP.SelectModelId(data.params.modelId);
      break;
    case ACTION.UpdateModel:
      APP.UpdateModel(data.params);
      break;
    case ACTION.AddAgent:
      APP.AddAgent();
      break;
    case ACTION.SelectAgent:
      APP.SelectAgentId(data.params.agentId);
      break;
    case ACTION.UpdateAgent:
      APP.UpdateAgent(data.params.agent);
      break;
    case ACTION.AddInstance:
      APP.AddInstance();
      break;
    case ACTION.SelectInstance:
      APP.SelectInstanceId(data.params.agentId);
      break;
    case ACTION.UpdateInstance:
      APP.UpdateInstance(data.params.agent);
      break;
    case ACTION.UpdateInstanceAgentId:
      APP.UpdateInstanceAgentId(
        data.params.data.instanceId,
        data.params.selectedOption.id
      );
      break;
    case ACTION.AddProperty:
      APP.AddProperty(data.params.agentId);
      break;
    case ACTION.AddFeature:
      APP.AddFeature(data.params.agentId);
      break;
    case ACTION.UpdateFeature:
      APP.UpdateFeature(data.params.feature);
      break;
    case ACTION.AddEvent:
      APP.AddEvent();
      break;
    case ACTION.UpdateEvent:
      APP.UpdateEvent(data.params.event);
      break;
    case ACTION.AddFilter:
      APP.AddFilter(data.params.eventId);
      break;
    case ACTION.DeleteFilter:
      APP.DeleteFilter(data.params);
      break;
    case ACTION.AddAction:
      APP.AddAction(data.params.eventId);
      break;
    case ACTION.DeleteAction:
      APP.DeleteAction(data.params);
      break;
    case ACTION.UpdateExpressionOpId:
      APP.UpdateExpressionOpId(data.params);
      break;
    case ACTION.UpdateSource:
      APP.UpdateSource(data.params);
      break;
    case ACTION.UpdateSourceAgentId:
      APP.UpdateSourceAgentId(data.params);
      break;
    case ACTION.UpdateSourcePropertyId:
      APP.UpdateSourcePropertyId(data.params);
      break;
    case ACTION.UpdateSourceValue:
      APP.UpdateSourceValue(data.params);
      break;
    case ACTION.ToggleInstanceVisibility:
      APP.ToggleInstanceVisiblity(data.params);
      break;
    default:
      throw "No matching action found for " + data.action;
  }
};

export default DISPATCHER;
