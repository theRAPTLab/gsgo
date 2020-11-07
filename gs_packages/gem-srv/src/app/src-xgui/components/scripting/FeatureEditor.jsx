/*
    Features

    "Features" are very complex.

    The basic data structure is:
        {
          type: "uniquename",
          commands: {
            command1: {...},
            command2: {...},
          },
          settings: [
            ...{}
          ],
          actions: [
            ...{}
          ]
          runtime: [
            ...{}
          ]
        }

    commands
        "commands" are the core functions built-into the feature
        and exposed to the user via custom code.  "settings" and
        "actions" determine which of these commands are exposed
        to agent defintion, default preference setting, scripting,
        or the runtime interface.

    settings (agent blueprint editor)
        "settings" are the default feature values that the
        user should define for each agent.  This is used by
        the AgentEditor to determine which commands need a
        default value.
        * Not all "commands" need to have a default setting.

    actions (scripting interface)
        "actions" expose commands to the scripting interface.
        e.g. if you want users to be able to define a
        script action "showCostume", then the "showCostume"
        command needs to be listed in actions.
        e.g. a setting like "setCostume" is only used
        in the agent blueprint definition, so it is not
        exposed to scripting.

    runtime (instance editing)
        "runtime" exposes commands that users will want to
        set for instances.  e.g. selecting a flower costume,
        selecting the movement.
        * Note that some settings like costume might be
          exposed to runtime for some instances, but not relevant
          for others.  e.g. flower costumes might be set for
          instances, but bee costumes are controlled by script.
          However, the costume will still be settable because
          that's built into the feature.
        * e.g. "setCostume" is never exposed at runtime.





    Users will interact with features in five
    areas:

    1. Adding a feature to an Agent (e.g. add costume)
    2. Adding feature parameters to an Agent (e.g. costume images)
    3. Setting default parameters for an Agent (e.g. default costume)
    4. Triggering a feature from an action in an event for an Agent
       (e.g. select "Flying" costume)
    5. Setting a parameter for an Agent Instance. (e.g. set movement
       to "useFakeTrack", e.g. set a flower to use a specific
       costume)

    Feature definitions are scattered in multiple places because of this:
    1. `operations.js` -- Defines the features that are available for
       adding to an agent.  We would expect any custom feature to
       have an entry in operations (or something like it) that
       defines the core features of each feature.

       OP.features =
          { type, actions, parameters }

    2. For a complex feature like costume, there is an additional layer
       of functionality that needs to be defined.  e.g. a FileList
       for selecting costume image files and mapping them to labels.

    3. `datastore.js` -- Defines the features that are added to agents,
       along with any parameters and defaults:

       DB.AGENTS[1] =
          {
            id: "a1", label: "Bee", ...
            features: [
              { id, label, type, parameters, defaultvalue },
              ...
            ]
          }

    4. `datastore.js` -- Datastore also defines the specific feature
        settings of indivudal instances (`type` is probably
        redundant, but helpful for readability):

       DB.INSTANCES[1] =
          {
            id: "a1", label: "Bee", ...
            features: [
              { id, type, value },
              ...
            ]
          }

    5. `datastore.js` -- Datastore also defines the features that
       are triggered by specific actions.

       DB.ACTIONS[5] =
          {
            id: "act5", source, op, value
          }

       e.g.
          {
            id: "act6",
            source: {
              agentId: "a1", // "bee"
            },
            op: "touches",
            value: {
              source: {
                agentId: "a2", // "flower"
              },
              op: "showCostume",
              target: "beeLanded",
            },
          },

*/

import React from 'react';
import PropTypes from 'prop-types';
import FilesList from './FilesList';
import APP from '../../app-logic';
import { DATATYPE } from '../../constants';

class FeatureEditor extends React.Component {
  constructor() {
    super();

    this.OnLabelChange = this.OnLabelChange.bind(this);
    this.OnTypeSelect = this.OnTypeSelect.bind(this);
    this.OnDefaultValueSelect = this.OnDefaultValueSelect.bind(this);
    this.RenderSettings = this.RenderSettings.bind(this);
  }

  OnLabelChange(e) {
    console.log('changed', e.target.value);
    const feature = Object.assign(this.props.feature, {
      label: e.target.value
    });
    this.props.OnChange(feature);
  }

  OnTypeSelect(e) {
    console.log('selected', e.target.value);
    const feature = Object.assign(this.props.feature, {
      type: e.target.value
    });
    this.props.OnChange(feature);
  }

  OnDefaultValueSelect(e) {
    console.log('selected', e.target.value);
    const feature = Object.assign(this.props.feature, {
      value: e.target.value
    });
    this.props.OnChange(feature);
  }

  OnCostumesChanged(data) {
    console.log('costumes', data);
    alert('Costume saving not implemented');
  }

  RenderFilesList(setting, feature) {
    const items = APP.GetFeatureCommandOptions(
      feature.type,
      setting.command,
      this.props.agentId
    );
    return (
      <div key={setting.command}>
        <div className="editorItem">
          <div className="editorLabel">
            {APP.GetFeatureCommandLabel(feature.type, setting.command)}
          </div>
        </div>
        <FilesList items={items} OnChange={this.OnCostumesChanged} />
      </div>
    );
  }

  RenderMenu(setting, feature) {
    return (
      <div key={setting.command}>
        <div className="editorItem">
          <div className="editorLabel">
            {APP.GetFeatureCommandLabel(feature.type, setting.command)}
          </div>
          <div className="editorValue">
            <select value={feature.value} onChange={this.OnDefaultValueSelect}>
              {APP.GetFeatureCommandOptions(
                feature.type,
                setting.command,
                this.props.agentId,
                this.props.agentType
              ).map((o, index) => (
                <option value={o.id} key={index}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  RenderSettings(settingsOptions, feature) {
    return settingsOptions.map(setting => {
      const featureDef = APP.GetFeatureDef(feature.type);
      if (this.props.agentType === DATATYPE.INSTANCE) {
        // only show the setting if it's in runtime for instances
        const runtime = featureDef.runtime;
        if (!runtime.includes(setting.command)) return;
      }
      switch (setting.type) {
        case 'FilesList':
          return this.RenderFilesList(setting, feature);
        case 'Menu':
        default:
          return this.RenderMenu(setting, feature);
      }
    });
  }

  render() {
    const { feature, agentType, agentId } = this.props;
    if (feature === undefined) return '';

    const featureTypes = APP.GetFeatureTypes();
    const featureSettingsOptions = APP.GetFeatureSettingsOptions(feature.type);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          margin: '10px'
        }}
      >
        <div className="syslabel">EDIT FEATURE</div>
        <br />
        <div className="editorItem">
          <div className="editorLabel">Feature Name</div>
          {agentType === 'instance' ? (
            <div className="editorValue">{feature.label}</div>
          ) : (
            <input
              className="editorValue"
              value={feature.label}
              onChange={this.OnLabelChange}
            />
          )}
        </div>
        <div className="editorItem">
          <div className="editorLabel">Type</div>
          <div className="editorValue">
            {agentType === 'instance' ? (
              <div className="editorValue">{feature.type}</div>
            ) : (
              <select value={feature.type} onChange={this.OnTypeSelect}>
                {featureTypes.map((type, index) => (
                  <option value={type} key={index}>
                    {type}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <br />
        {/* Feature Settings */}
        <div className="syslabel">SETTINGS</div>
        <div className="editorItem">
          <div className="editorLabel syslabel">COMMAND</div>
          <div className="editorValue syslabel">
            {agentType === 'instance' ? 'VALUE' : 'DEFAULT VALUE'}
          </div>
        </div>
        {this.RenderSettings(featureSettingsOptions, feature)}
      </div>
    );
  }
}

FeatureEditor.propTypes = {
  feature: PropTypes.object,
  agentType: PropTypes.string,
  agentId: PropTypes.string
};

export default FeatureEditor;
