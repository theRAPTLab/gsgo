import { v4 as UUID } from 'uuid';
import DB from './datastore';
import OP from './operations';
import { DATATYPE, VMTYPE } from './constants';

const DBG = false;
const PR = 'app-logic: ';

const MOD = {};

let DATA = {};
let UISTATE = {
  isLoggedIn: true, // bypassing app login, should be false
  agentIsBeingEdited: true,

  selectedAppTab: undefined,
  selectedModelId: undefined,
  selectedAgentId: undefined,
  selectedInstanceId: undefined
};

/// BROADCASTER ///////////////////////////////////////////////////////////////
let listeners = [];
MOD.Subscribe = listener => {
  listeners.push(listener);
};
MOD.Unsubscribe = listener => {
  listeners = listeners.filter(l => l !== listener);
};
MOD.RequestUpdateBroadcast = () => {
  MOD.BroadcastDATA();
  MOD.BroadcastUI();
};
MOD.BroadcastDATA = () => {
  if (DBG) console.log(PR, 'Broadcast data', DB);
  listeners.forEach(listener => {
    if (listener.HandleDATAUpdate) listener.HandleDATAUpdate(DB);
  });
};
MOD.BroadcastUI = () => {
  if (DBG) console.log(PR, 'Broadcast UISTATE', UISTATE);
  listeners.forEach(listener => {
    if (listener.HandleUIUpdate) listener.HandleUIUpdate(UISTATE);
  });
};

/// LOGIN /////////////////////////////////////////////////////////////////////
MOD.SetLogin = () => {
  UISTATE.isLoggedIn = true;
};
MOD.GetLogin = () => {
  if (DBG) console.log(PR, 'isLoggedIn', UISTATE.isLoggedIn);
  return UISTATE.isLoggedIn;
};

/// DISPATCHER HANDLERS ///////////////////////////////////////////////////////
///
///

/// UI STATE HANDLERS ---------------------------------------------------------
MOD.SelectAppTab = tabId => {
  UISTATE.selectedAppTab = tabId;
  MOD.BroadcastUI();
};
MOD.SelectModelId = modelId => {
  if (DBG) console.log(PR, 'Select Model Id', modelId);
  UISTATE.selectedModelId = modelId;
  MOD.BroadcastUI();
  MOD.BroadcastDATA();
};
MOD.GetSelectedModelId = () => {
  return UISTATE.selectedModelId;
};
MOD.SelectAgentId = agentId => {
  if (DBG) console.log(PR, 'Select Agent Id', agentId);
  // REVIEW: ADD: OD.ClearEditSelections();
  UISTATE.selectedAgentId = agentId;
  MOD.BroadcastUI();
};
MOD.SelectInstanceId = agentId => {
  console.log(PR, 'Select Instance Id', agentId);
  // REVIEW: ADD: OD.ClearEditSelections();
  UISTATE.selectedInstanceId = agentId;
  MOD.BroadcastUI();
};

/// DATA METHODS //////////////////////////////////////////////////////////////
///
/// These are the equivalent of database calls?
///
MOD.LoadDB = data => {
  DB.MODELS = data.MODELS;
  DB.AGENTS = data.AGENTS;
  DB.INSTANCES = data.INSTANCES;
  DB.EVENTS = data.EVENTS;
  DB.EXPRESSIONS = data.EXPRESSIONS;
  DB.SOURCES = data.SOURCES;
  MOD.BroadcastDATA();
};
/// MODELS --------------------------------------------------------------------
MOD.GetModels = () => {
  return DB.MODELS;
};
MOD.GetModel = modelId => {
  if (DBG) console.log(PR, 'GetModel', modelId);
  return DB.MODELS.find(m => m.id === modelId);
};
MOD.GetModelName = () => {
  const model = MOD.GetModel(UISTATE.selectedModelId);
  return model ? model.label : '';
};
/**
 *
 * @param {Object} params { modelId, label, decription }
 */
MOD.UpdateModel = params => {
  const model = MOD.GetModel(params.modelId);
  model.label = params.label || model.label;
  model.description = params.description || model.description;
  DB.MODELS = DB.MODELS.map(m => (m.id === model.id ? model : m));
  MOD.BroadcastDATA();
};
/// AGENTS --------------------------------------------------------------------
/**
 *
 * @param {String} modelId Leave undefined to retrieve ALL agents from
 *                         all models
 */
MOD.GetAllAgents = modelId => {
  if (DBG) console.log(PR, 'GetAllAgents', modelId);
  if (modelId) {
    return DB.AGENTS.filter(a => a.modelId === modelId);
  } else {
    return DB.AGENTS;
  }
};
MOD.GetModelAgents = () => {
  return MOD.GetAllAgents(UISTATE.selectedModelId);
};
/**
 *
 * @param {String} agentId
 */
MOD.GetAgent = agentId => {
  if (DBG) console.log(PR, 'GetAgent:', agentId);
  return DB.AGENTS.find(a => a.id === agentId);
};
MOD.UpdateAgent = agent => {
  if (DBG) console.log(PR, 'UpdateAgent:', agent);
  DB.AGENTS = DB.AGENTS.map(a => (a.id === agent.id ? agent : a));
  MOD.BroadcastDATA();
};
// NOT CURRENTLY USED
// REVIEW: Move update from AgentEditor to here?
// MOD.UpdateFeature = (feature, agentId) => {
//   if (DBG) console.log(PR, "UpdateFeature:", feature);
//   const agent = MOD.GetAgent(agentId);
//   agent.features = agent.features.map((f) =>
//     f.id === feature.id ? feature : f
//   );
//   MOD.UpdateAgent(agent);
// };
MOD.GetAgentProperties = (agentId, dataType) => {
  const agent = MOD.GetAgent(agentId);
  if (
    dataType === undefined ||
    dataType === DATATYPE.BOOL ||
    dataType === DATATYPE.ACTION
  ) {
    return agent ? agent.properties : [];
  } else {
    return agent.properties.filter(p => p.type === dataType);
  }
};
MOD.GetAgentPropertiesForAgentEditing = agentId => {
  const agent = MOD.GetAgent(agentId);
  const options = [
    MOD.NewProperty({
      id: 'label',
      label: 'label',
      type: 'string',
      isBuiltIn: true,
      value: agent.label
    })
  ];
  return options;
};
// Maps "label"
MOD.GetUserPropertiesForAgentEditing = (agentId, dataType) => {
  return MOD.GetAgentProperties(agentId, dataType);
};
// Adds "self"
MOD.GetAgentPropertiesForScripting = (agentId, dataType) => {
  const properties = MOD.GetAgentProperties(agentId, dataType);
  const options = [MOD.NewPropertySelf()].concat(properties);
  return options;
};
MOD.GetAgentProperty = (agentId, propertyLabel) => {
  if (agentId === undefined) return '';
  const agent = MOD.GetAgent(agentId);
  if (agent === undefined) return '';
  const valueProp = agent.properties.find(p => p.label === propertyLabel);
  return valueProp ? valueProp.value : 'Label not found';
};
/**
 * Handle special built-in property "label".
 * All agents should have this property.
 * @param {String} agentId
 */
MOD.GetAgentLabel = agentId => {
  if (agentId === undefined) return '';
  const agent = MOD.GetAgent(agentId);
  if (agent === undefined) return '';
  return agent.label ? agent.label : 'Label not found';
};
MOD.GetAllInstances = modelId => {
  if (DBG) console.log(PR, 'GetAllInstances', modelId);
  if (modelId) {
    return DB.INSTANCES.filter(a => a.modelId === modelId);
  } else {
    return DB.INSTANCES;
  }
};
MOD.GetModelInstances = () => {
  if (DBG) console.log(PR, 'GetModelInstances');
  return MOD.GetAllInstances(UISTATE.selectedModelId);
};
MOD.GetScriptControlledInstances = () => {
  if (DBG) console.log(PR, 'GetScriptControlledInstances');
  const instances = MOD.GetModelInstances();
  return instances.filter(i => {
    const feature = i.features.find(p => p.type === 'movement');
    return feature ? feature.value === 'script' : true; // default to script controlled if feature is not set yet
  });
};
MOD.GetNonScriptControlledInstances = () => {
  if (DBG) console.log(PR, 'GetNonScriptControlledInstances');
  const instances = MOD.GetModelInstances();
  return instances.filter(i => {
    const feature = i.features.find(p => p.type === 'movement');
    return feature ? feature.value !== 'script' : false;
  });
};
MOD.GetInstance = instanceId => {
  if (DBG) console.log(PR, 'GetInstance:', instanceId);
  return DB.INSTANCES.find(a => a.id === instanceId);
};
MOD.UpdateInstance = instance => {
  if (DBG) console.log(PR, 'UpdateInstance:', instance);
  DB.INSTANCES = DB.INSTANCES.map(i => (i.id === instance.id ? instance : i));
  MOD.BroadcastDATA();
};
MOD.UpdateInstanceAgentId = (instanceId, agentId) => {
  console.log(PR, 'UpdateInstanceAgentId:', instanceId, agentId);
  const instance = MOD.GetInstance(instanceId);
  instance.agentId = agentId;
  // copy features over

  MOD.UpdateInstance(instance);
};
MOD.GetInstanceProperties = instanceId => {
  const instance = MOD.GetInstance(instanceId);
  return instance ? instance.properties : [];
};
/**
 * This retrieves the array of features from the Agent Blueprint!
 * Then loads the saved instance overrides
 * @param {String} instanceId
 */
MOD.GetInstanceFeatures = instanceId => {
  const instance = MOD.GetInstance(instanceId);
  const agent = MOD.GetAgent(instance.agentId);
  // Load saved values
  const features = agent ? agent.features : [];
  const loadedFeatures = features.map(f => {
    // find correspondinging instance feature
    const instanceFeature = instance.features.find(i => i.type === f.type);
    if (instanceFeature) {
      f.value = instanceFeature.value;
    }
    return f;
  });
  return loadedFeatures;
};
MOD.GetInstanceLabel = instanceId => {
  if (instanceId === undefined) return '';
  const instance = MOD.GetInstance(instanceId);
  if (instance === undefined) return '';
  const labelProp = instance.properties.find(p => p.label === 'label');
  return labelProp ? labelProp.value : 'Label not found';
};
MOD.GetInstanceProperty = (instanceId, propertyLabel) => {
  if (instanceId === undefined) return '';
  const instance = MOD.GetInstance(instanceId);
  if (instance === undefined) return '';
  const valueProp = instance.properties.find(p => p.label === propertyLabel);
  return valueProp ? valueProp.value : 'Label not found';
};
MOD.ToggleInstanceVisiblity = params => {
  const instance = MOD.GetInstance(params.instanceId);
  instance.hidden = !params.checked;
  MOD.UpdateInstance(instance);
};

/// EVENTS --------------------------------------------------------------------
MOD.GetAgentEvents = agentId => {
  if (DBG) console.log(PR, 'GetAgentEvents:', agentId);
  return DB.EVENTS.filter(e => e.agentId === agentId);
};
MOD.GetEvent = eventId => {
  if (DBG) console.log(PR, 'GetEvent:', eventId);
  return DB.EVENTS.find(e => e.id === eventId);
};
MOD.UpdateEvent = event => {
  if (DBG) console.log(PR, 'UpdateEvent:', event);
  DB.EVENTS = DB.EVENTS.map(e => (e.id === event.id ? event : e));
  MOD.BroadcastDATA();
};

/// FILTERS -------------------------------------------------------------------
MOD.GetFilter = filterId => {
  if (DBG) console.log(PR, 'GetFilter:', filterId);
  const filter = DB.FILTERS.find(f => f.id === filterId);
  return filter;
};
MOD.DeleteFilter = params => {
  if (DBG) console.log(PR, 'DeleteFilter:', params.filterId);
  // remove filter from Expressions
  DB.EXPRESSIONS = DB.EXPRESSIONS.filter(f => f.id !== params.filterId);
  // remove filter from agent's event
  const event = MOD.GetEvent(params.eventId);
  event.filters = event.filters.filter(fid => fid !== params.filterId);
  MOD.UpdateEvent(event);
};
/// ACTIONS -------------------------------------------------------------------
MOD.GetAction = actionId => {
  if (DBG) console.log(PR, 'GetActions:', actionId);
  return DB.ACTIONS.find(a => a.id === actionId);
};
/**
 * Retrives both feature actions and generic actions
 * @param {String} agentId Source of action
 */
MOD.GetActionOptions = sourceId => {
  const source = MOD.GetSource(sourceId);
  if (source.value.agentId === undefined) return [];

  const agent = MOD.GetAgent(source.value.agentId);

  // 1. get agent-specific feature actions
  let options = [];
  const features = agent.features;
  features.forEach(f => {
    // each feature has multiple actions available as defined by the system
    const featureDefs = OP['features'];
    const featureDef = featureDefs.find(fdef => fdef.type === f.type);
    if (featureDef === undefined) return; // feature type hasn't been defined yet.
    const fActions = featureDef.actions;
    // look up commands for each option
    options = options.concat(
      ...fActions.map(a => {
        const commandKey = a.command; // "setMovement"
        const command = featureDef.commands[commandKey];
        return command.options;
      })
    );
  });

  // 2. add generic actions
  options = options.concat(OP['actions']);

  // 3. filter by selected sourceType
  //    e.g. if agent, show agent-enabled feature actions
  const property = agent.properties.find(p => p.id === source.value.propertyId);
  if (property)
    options = options.filter(a => {
      const result =
        a.sourceTypes.includes(property.type) || a.sourceTypes.includes('*');
      return result;
    });

  return options;
};
MOD.DeleteAction = params => {
  if (DBG) console.log(PR, 'DeleteAction:', params.actionId);
  // remove filter from Expressions
  DB.EXPRESSIONS = DB.EXPRESSIONS.filter(a => a.id !== params.actionId);
  // remove filter from agent's event
  const event = MOD.GetEvent(params.eventId);
  event.actions = event.actions.filter(aid => aid !== params.actionId);
  MOD.UpdateEvent(event);
};

/// FEATURES ------------------------------------------------------------------
MOD.GetFeatureTypes = () => {
  const featureOps = OP['features'];
  return featureOps.map(f => f.type);
};
MOD.GetFeatureDef = type => {
  if (type === undefined) return undefined;
  const featureDefs = OP['features'];
  return featureDefs.find(f => f.type === type);
};
/**
 * Used to populate menus
 * @param {String} type feature type
 * @returns {Array} [ { command, label, defaultValue }, ...]
 */
MOD.GetFeatureSettingsOptions = type => {
  if (type === undefined) return [];
  const feature = MOD.GetFeatureDef(type);
  if (feature && feature.settings) {
    return feature.settings;
  } else {
    return [];
  }
};
MOD.GetFeatureCommand = (type, command) => {
  const feature = MOD.GetFeatureDef(type);
  return feature.commands[command];
};
MOD.GetFeatureCommandLabel = (type, command) => {
  const com = MOD.GetFeatureCommand(type, command);
  return com.label;
};
MOD.GetFeatureCommandOptions = (type, command, agentId, featureType) => {
  // Get Agent Overrides first
  const agentOptions = MOD.GetFeatureCommandOptionOverrides(
    type,
    command,
    agentId,
    featureType
  );
  if (agentOptions) return agentOptions;
  // Else get system feature definition options
  const com = MOD.GetFeatureCommand(type, command);
  return com ? com.options : undefined;
};
/**
 * Returns any agent-specific command options, e.g. costumes
 * There are two possible overrides here:
 * 1. The agent definition might have options (e.g. costume)
 * 2. The feature definition might also have a redirect
 *    where options come from the definition of another command,
 *    e.g. with costumes, the options come from the definition
 *    for "showCostume" but are set by "setCostume"
 * @param {String} type feature type
 * @param {String} command command id
 * @param {String} agentId host agent
 * @param {String} featureType "instance" or "agent"
 */
MOD.GetFeatureCommandOptionOverrides = (type, command, agentId, featureType) => {
  // First, which command do we use for the options source?
  const featureDefCommand = MOD.GetFeatureCommand(type, command);
  // use a different command's settings for the options?  or default to command
  const commandSource = featureDefCommand.optionsSourceCommand || command;
  const id =
    featureType === DATATYPE.INSTANCE
      ? MOD.GetInstance(agentId).agentId
      : agentId;
  const agent = MOD.GetAgent(id);
  const agentFeature =
    agent && agent.features
      ? agent.features.find(f => f.type === type)
      : undefined;
  if (agentFeature && agentFeature.commands) {
    const agentCommand = agentFeature.commands[commandSource];
    return agentCommand ? agentCommand.options : undefined;
  } else {
    return undefined;
  }
};

/// BASE COMPONENTS -----------------------------------------------------------

/// BASE COMPONENTS: EXPRESSION
MOD.GetExpression = expressionId => {
  const exp = DB.EXPRESSIONS.find(e => e.id === expressionId);
  return exp;
};
MOD.UpdateExpression = updatedExpression => {
  DB.EXPRESSIONS = DB.EXPRESSIONS.map(e =>
    e.id === updatedExpression.id ? updatedExpression : e
  );
  MOD.BroadcastDATA();
};
MOD.UpdateExpressionOpId = params => {
  const exp = MOD.GetExpression(params.data.expressionId);
  exp.opId = params.selectedOption.id;
  // Create a new target if one doesn't exist
  if (exp.targetId === undefined) {
    const target = MOD.NewExpression();
    exp.targetId = target.id;
  }
  console.log('updating expression op', exp);
  MOD.UpdateExpression(exp);
};

/// BASE COMPONENTS: SOURCE
MOD.GetSource = sourceId => {
  if (DBG) console.log(PR, 'GetSource:', sourceId);
  return DB.SOURCES.find(s => s.id === sourceId);
};
MOD.UpdateSource = updatedSource => {
  DB.SOURCES = DB.SOURCES.map(s =>
    s.id === updatedSource.id ? updatedSource : s
  );
  MOD.BroadcastDATA();
};
MOD.UpdateSourceAgentId = params => {
  const source = MOD.GetSource(params.data.sourceId);
  let agentId = params.selectedOption.id;
  if (agentId === DATATYPE.VALUE) {
    // special handling: user selected "Enter value..."
    // and have input a value form field,
    // so clear agentId.
    source.value.inputValue = '0'; // set a default value
    source.vmtype = VMTYPE.SOURCEOBJECT.VALUE;
  } else {
    source.value.agentId = agentId;

    // if the original source vmtype was value, then we need to
    // change the vm type.  Default to agent because property
    // needs to be selected with a second step.
    if (source.vmtype === VMTYPE.SOURCEOBJECT.VALUE) {
      source.vmtype = VMTYPE.SOURCEOBJECT.AGENT;
    }
  }
  MOD.UpdateSource(source);
};
MOD.UpdateSourcePropertyId = params => {
  const propertyId = params.selectedOption.id;
  const source = MOD.GetSource(params.data.sourceId);
  source.value = {
    agentId: params.data.agentId,
    propertyId
  };
  if (propertyId === '0') {
    // special self handler
    source.vmtype = VMTYPE.SOURCEOBJECT.AGENT;
  } else {
    source.vmtype = VMTYPE.SOURCEOBJECT.AGENTPROPERTY;
  }
  MOD.UpdateSource(source);
};
MOD.UpdateSourceValue = params => {
  const source = MOD.GetSource(params.sourceId);
  source.value.inputValue = params.value;
  MOD.UpdateSource(source);
};

/// CONSTRUCTORS --------------------------------------------------------------
MOD.AddModel = () => {
  if (DBG) console.log(PR, 'AddModel');
  const model = {
    id: UUID(),
    label: 'Untitled',
    creationDate: new Date(),
    modificationDate: new Date()
  };
  DB.MODELS.push(model);
  MOD.BroadcastDATA();
};
MOD.AddAgent = () => {
  if (DBG) console.log(PR, 'AddAgent');
  const agent = {
    id: UUID(),
    modelId: UISTATE.selectedModelId,
    label: 'Untitled',
    properties: [],
    features: []
  };
  DB.AGENTS.push(agent);
  MOD.BroadcastDATA();
};
MOD.AddInstance = () => {
  if (DBG) console.log(PR, 'AddInstance');
  const instance = {
    id: UUID(),
    agentId: undefined,
    modelId: UISTATE.selectedModelId,
    label: 'Untitled',
    properties: [],
    features: []
  };

  // Add built-in agent properties
  const label = MOD.NewProperty({
    label: 'label',
    type: DATATYPE.STRING,
    value: 'Untitled'
  });
  instance.properties.push(label);

  const x = MOD.NewProperty({
    label: 'x',
    type: DATATYPE.NUMBER,
    value: 0
  });
  instance.properties.push(x);

  const y = MOD.NewProperty({
    label: 'y',
    type: DATATYPE.NUMBER,
    value: 0
  });
  instance.properties.push(y);

  // Add special features
  instance.movement = 'script';
  DB.INSTANCES.push(instance);
  MOD.BroadcastDATA();
};
MOD.NewProperty = data => {
  if (data === undefined) data = {};
  return {
    id: data.id || UUID(),
    label: data.label || 'Untitled',
    type: data.type || DATATYPE.NUMBER, // default to number
    value: data.value, // allow undefined
    isBuiltIn: data.isBuiltIn || false
  };
};
MOD.NewPropertySelf = () => {
  return MOD.NewProperty({
    id: 'self',
    label: 'self',
    type: 'agent',
    value: 'self'
  });
};
MOD.AddProperty = agentId => {
  if (DBG) console.log(PR, 'AddProperty');
  const agent = MOD.GetAgent(agentId);
  agent.properties.push(MOD.NewProperty());
  MOD.UpdateAgent(agent);
};
/**
 * Add Feature to Agent Blueprint
 */
MOD.AddFeature = agentId => {
  if (DBG) console.log(PR, 'AddFeature');
  const agent = MOD.GetAgent(agentId);
  const id = UUID();
  agent.features.push({
    id,
    label: 'Untitled',
    type: undefined, // REVIEW: Need a default or left blank on save?
    value: undefined,
    properties: undefined
  });
  MOD.UpdateAgent(agent);
};
MOD.AddEvent = () => {
  if (DBG) console.log(PR, 'AddEvent');
  const id = UUID();
  DB.EVENTS.push({
    id,
    agentId: UISTATE.selectedAgentId,
    label: 'Untitled',
    filters: [],
    actions: []
  });
  MOD.BroadcastDATA();
};
MOD.NewExpression = () => {
  if (DBG) console.log(PR, 'AddExpression');
  const source = MOD.NewSource();
  const id = UUID();
  const expression = {
    id,
    sourceId: source.id,
    opId: undefined,
    targetId: undefined
  };
  DB.EXPRESSIONS.push(expression);
  return expression;
  // NOTE: No BroadcastDATA
};
MOD.NewSource = () => {
  const id = UUID();
  const source = {
    id,
    vmtype: VMTYPE.SOURCEOBJECT.AGENT,
    value: {
      agentId: undefined,
      propertyId: undefined,
      inputValue: undefined
    }
  };
  DB.SOURCES.push(source);
  return source;
  // NOTE: No BroadcastDATA
};
MOD.AddFilter = eventId => {
  if (DBG) console.log(PR, 'AddFilter');
  const expression = MOD.NewExpression();
  const event = MOD.GetEvent(eventId);
  event.filters.push(expression.id);
  MOD.BroadcastDATA();
};
MOD.AddAction = eventId => {
  if (DBG) console.log(PR, 'AddAction');
  const expression = MOD.NewExpression();
  const event = MOD.GetEvent(eventId);
  event.actions.push(expression.id);
  MOD.BroadcastDATA();
};

/// UTILITIES /////////////////////////////////////////////////////////////////
///
///

/**
 * Valid Types: string, number, agent
 * @param {String} sourceId id of the source object to look up
 * @param {String} defaultDataType type of the value object if data type has been externally defined.
 */
MOD.DetermineSourceDataType = (sourceId, defaultDataType) => {
  let sourceType;
  const source = MOD.GetSource(sourceId);
  switch (source.vmtype) {
    case VMTYPE.SOURCEOBJECT.VALUE:
      sourceType = defaultDataType;
      break;
    case VMTYPE.SOURCEOBJECT.AGENT:
      sourceType = VMTYPE.SOURCEOBJECT.AGENT;
      break;
    case VMTYPE.SOURCEOBJECT.AGENTPROPERTY: {
      const agent = MOD.GetAgent(source.value.agentId);
      const property = agent.properties.find(
        p => p.id === source.value.propertyId
      );
      // If the user selected a different agent, sometimes the current propertyId
      // may no longer be valid. Deselect if that happens.
      sourceType = property ? property.type : undefined;
      break;
    }
    default:
      throw 'Could not determine source data type for ' + sourceId + ':' + source;
  }
  return sourceType;
};

/// MODULE EXPORT /////////////////////////////////////////////////////////////
export default MOD;
