/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

InstanceEditor

Shows instance init scripts.
* Used to define instances in a map.
* Allows properties to be edited.

props.instance = instance specification: {name, blueprint, initScript}
  e.g. {name: "fish01", blueprint: "Fish", initScript: "prop x setTo -220↵prop y setTo -220"}


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import VisibilityIcon from '@material-ui/icons/VisibilityOff';
import UR from '@gemstep/ursys/client';
import { GetAgentByName } from 'modules/datacore/dc-agents';
import { GetAllFeatures } from 'modules/datacore/dc-features';
import {
  GetBlueprintProperties,
  GetBlueprintPropertiesMap
} from 'modules/datacore/dc-project';
import * as TRANSPILER from 'script/transpiler-v2';
import {
  ScriptToJSX,
  UpdateScript
} from 'modules/sim/script/tools/script-to-jsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';
import InputField from './InputField';

const DBG = true;

class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'EDITOR',
      agentId: undefined,
      isEditable: false,
      isHovered: false,
      isSelected: false,
      isAddingProperty: false,
      isDeletingProperty: false
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.GetBlueprintName = this.GetBlueprintName.bind(this);
    this.GetAgentId = this.GetAgentId.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.HandleScriptLineDelete = this.HandleScriptLineDelete.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.GetSettableProperties = this.GetAddableProperties.bind(this);
    this.OnAddProperty = this.OnAddProperty.bind(this);
    this.OnEnableDeleteProperty = this.OnEnableDeleteProperty.bind(this);
    this.OnPropMenuSelect = this.OnPropMenuSelect.bind(this);
    this.OnDeleteInstance = this.OnDeleteInstance.bind(this);
    this.HandleEditEnable = this.HandleEditEnable.bind(this);
    this.HandleEditDisable = this.HandleEditDisable.bind(this);
    this.HandleHoverOver = this.HandleHoverOver.bind(this);
    this.HandleHoverOut = this.HandleHoverOut.bind(this);
    this.HandleDeselect = this.HandleDeselect.bind(this);
    this.OnHoverOver = this.OnHoverOver.bind(this);
    this.OnHoverOut = this.OnHoverOut.bind(this);
    this.OnNameSave = this.OnNameSave.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.HandleMessage('SCRIPT_LINE_DELETE', this.HandleScriptLineDelete);
    UR.HandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.HandleMessage('INSTANCE_EDIT_DISABLE', this.HandleEditDisable);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.UnhandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.UnhandleMessage('SCRIPT_LINE_DELETE', this.HandleScriptLineDelete);
    UR.UnhandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.UnhandleMessage('INSTANCE_EDIT_DISABLE', this.HandleEditDisable);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.UnhandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.UnhandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  GetInstanceName() {
    const { instance } = this.props;
    return instance ? instance.name : '';
  }

  GetBlueprintName() {
    const { instance } = this.props;
    return instance ? instance.blueprint : '';
  }

  GetAgentId() {
    // agentId is cached
    // We don't load it at componentDidMount because the agent
    // might not be defined yet.
    let { agentId } = this.state;
    if (!agentId) {
      const { instance } = this.props;
      if (!instance) throw new Error('InstanceEditor instance not defined yet');
      agentId = instance.id; // instance id should match agent id
      this.setState({ agentId });
    }
    return agentId;
  }

  /**
   * Script update sent from prop.tsx
   * @param {*} data
   */
  HandleScriptUpdate(data) {
    // Update the script
    const { modelId } = this.props;
    const { isEditable } = this.state;
    if (isEditable) {
      const { instance } = this.props;
      const instanceName = this.GetInstanceName();

      const updatedScript = UpdateScript(instance.initScript, data);

      // WORKING VERSION
      // // 1. Convert init script text to script units
      // const origScriptUnits = TRANSPILER.TextToScript(instance.initScript);
      // console.log('orig script', origScriptUnits);

      // // 2. Figure out which unit to replace
      // const line = data.index;
      // const parentLine = data.parentIndices;
      // let scriptUnits = [...origScriptUnits];
      // console.log('scriptUnits (should be same as prev)', scriptUnits);
      // if (parentLine !== undefined) {
      //   // Update is a nested line, replace the block
      //   console.log('updating nested line');
      //   const blockPosition = data.blockIndex; // could be first block or second block <conseq> <alt>
      //   console.error('block is', blockPosition);
      //   const origBlock = scriptUnits[parentLine][blockPosition];
      //   console.log('...origBlock', origBlock);
      //   console.log('...line', line);
      //   const origBlockData = origBlock.block;
      //   origBlockData.splice(line, 1, ...data.scriptUnit);
      //   console.log('...updatedBlockData', origBlockData);
      //   scriptUnits[parentLine][blockPosition] = {
      //     block: origBlockData
      //   };

      //   // WORKING without blockIndex
      //   // // Update is a nested line, replace the block
      //   // console.log('updating nested line');
      //   // // Find the block component
      //   // const lineToUpdate = scriptUnits[parentLine];
      //   // const blockPosition = lineToUpdate.findIndex(l => l.block);
      //   // console.error('block is', blockPosition);
      //   // const origBlock = scriptUnits[parentLine][blockPosition];
      //   // console.log('...origBlock', origBlock);
      //   // console.log('...line', line);
      //   // const origBlockData = origBlock.block;
      //   // origBlockData.splice(line, 1, ...data.scriptUnit);
      //   // console.log('...updatedBlockData', origBlockData);
      //   // scriptUnits[parentLine][blockPosition] = { block: origBlockData };
      // } else {
      //   // Update root level line
      //   scriptUnits[line] = data.scriptUnit;
      // }
      // console.log('updated ScriptUnits', scriptUnits, scriptUnits[1]);

      // // 3. Convert back to script text
      // const updatedScript = TRANSPILER.ScriptToText(scriptUnits);
      // console.log('updated script text', updatedScript);

      // ORIG
      // 1. Convert init script text to array
      const scriptTextLines = instance.initScript.split('\n');
      // 2. Convert the updated line to text
      const updatedLineText = TRANSPILER.TextifyScript(data.scriptUnit);
      // console.log('script text', scriptTextLines);
      // // 3. Replace the updated line in the script array
      // scriptTextLines[data.index] = updatedLineText;
      // // 4. Convert the script array back to script text
      // const updatedScript = scriptTextLines.join('\n');

      if (data.exitEdit) {
        this.DoDeselect();
      }

      UR.RaiseMessage('NET:INSTANCE_UPDATE', {
        modelId,
        instanceId: instance.id,
        instanceName,
        instanceInit: updatedScript
      });
    }
  }

  HandleScriptLineDelete(data) {
    // Update the script
    const { modelId } = this.props;
    const { isEditable } = this.state;
    if (isEditable) {
      const { instance } = this.props;
      const instanceName = this.GetInstanceName();
      // 1. Convert init script text to array
      const scriptTextLines = instance.initScript.split('\n');
      // 2. Remove the line
      scriptTextLines.splice(data.index, 1);
      // 3. Convert the script array back to script text
      const updatedScript = scriptTextLines.join('\n');

      UR.RaiseMessage('NET:INSTANCE_UPDATE', {
        modelId,
        instanceId: instance.id,
        instanceName,
        instanceInit: updatedScript
      });
    }
  }

  /**
   * User clicked on instance in "Map Instances" panel, wants to edit
   * @param {*} e
   */
  OnInstanceClick(e) {
    // just pass it up to Map Editor so it's centralized?
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId });
  }

  GetAddableProperties() {
    const { modelId, instance } = this.props;
    const blueprintName = this.GetBlueprintName();

    if (!modelId || !instance) return [];

    // properties = [...{name, type, defaultvalue, isFeatProp }]
    let properties = GetBlueprintProperties(blueprintName);
    // Remove properties that have already been set
    // 1. Get the list or properties
    const scriptUnits = TRANSPILER.TextToScript(instance.initScript);
    const initProperties = scriptUnits.map(unit => {
      if (unit[0] && (unit[0].token === 'prop' || unit[0].token === 'featProp')) {
        return unit[1].token;
      }
      return undefined;
    });
    // 2. Remove already set properties
    properties = properties.filter(p => !initProperties.includes(p.name));

    return properties;
  }

  OnAddProperty(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    this.setState(state => ({
      isAddingProperty: !state.isAddingProperty
    }));
  }

  OnEnableDeleteProperty(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    // enable deletion
    this.setState(state => ({
      isDeletingProperty: !state.isDeletingProperty
    }));
  }

  StopEvent(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
  }

  OnPropMenuSelect(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    const selectedProp = e.target.value;
    if (selectedProp === '') return; // selected the help instructions

    const { modelId } = this.props;
    const addableProperties = this.GetAddableProperties();
    const { instance } = this.props;
    const property = addableProperties.find(p => p.name === selectedProp);
    const keyword = property.isFeatProp ? 'featProp' : 'prop';
    const newScriptLine = `${keyword} ${property.name} setTo ${property.defaultValue}`;

    const instanceName = this.GetInstanceName();
    // 1. Convert init script text to array
    const scriptTextLines = instance.initScript
      ? instance.initScript.split('\n')
      : [];
    // 2. Add the updated line in the script array
    scriptTextLines.push(newScriptLine);
    // 4. Convert the script array back to script text
    const updatedScript = scriptTextLines.join('\n');

    UR.RaiseMessage('NET:INSTANCE_UPDATE', {
      modelId,
      instanceId: instance.id,
      instanceName,
      instanceInit: updatedScript
    });

    this.setState({ isAddingProperty: false });
  }

  OnDeleteInstance() {
    const { modelId, instance } = this.props;
    UR.RaiseMessage('NET:INSTANCE_DELETE', {
      modelId,
      instanceDef: instance
    });
  }

  DoDeselect() {
    const { modelId } = this.props;
    let { isSelected, isEditable } = this.state;
    const agentId = this.GetAgentId();
    isEditable = false;
    isSelected = false;
    this.setState({ isEditable, isSelected });
    // And also deselect
    UR.RaiseMessage('NET:INSTANCE_DESELECT', { modelId, agentId });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// URSYS Events
  ///
  /**
   * Enables or disables editing based on 'data' passed
   * @param {object} data { agentId }
   */
  HandleEditEnable(data) {
    const agentId = this.GetAgentId();
    let { isEditable, isSelected } = this.state;
    // Is this message for us?
    if (data.agentId === agentId) {
      // YES!  Enable!
      isEditable = true;
      isSelected = true;
      this.setState({ isEditable, isSelected });
      this.instance.scrollIntoView();
    } else {
      // always disable if message is not for us!
      this.DoDeselect();
    }
  }
  HandleEditDisable(data) {
    const agentId = this.GetAgentId();
    // Is this message for us?
    if (data.agentId === agentId) {
      // YES!  Disnable!
      this.DoDeselect();
    }
  }
  HandleHoverOver(data) {
    const { isEditable } = this.state;
    const agentId = this.GetAgentId();
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hover if we're not editing?
    if (data.agentId === agentId && !isEditable) {
      this.setState({ isHovered: true });
    }
  }
  HandleHoverOut(data) {
    const { isEditable } = this.state;
    const agentId = this.GetAgentId();
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hoverout if we're not editing?
    if (data.agentId === agentId && !isEditable) {
      this.setState({ isHovered: false });
    }
  }
  HandleDeselect(data) {
    const agentId = this.GetAgentId();
    if (data.agentId === agentId) {
      this.setState({
        isEditable: false,
        isSelected: false,
        isHovered: false,
        isAddingProperty: false
      });
    }
  }
  OnNameSave(data) {
    // Update the script
    const { modelId, instance } = this.props;
    const { isEditable } = this.state;
    const instanceName = data.instanceName;
    if (isEditable) {
      if (data.exitEdit) {
        console.warn('EXITING DESELECTING');
        this.DoDeselect();
      }
      UR.RaiseMessage('NET:INSTANCE_UPDATE', {
        modelId,
        instanceId: instance.id,
        instanceName
      });
    }
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Local Events (on InstanceEditor container)
  ///
  OnHoverOver() {
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_HOVEROVER', { agentId });
  }
  OnHoverOut() {
    const agentId = this.GetAgentId();
    UR.RaiseMessage('SIM_INSTANCE_HOVEROUT', { agentId });
  }

  render() {
    const {
      title,
      isEditable,
      isHovered,
      isSelected,
      isAddingProperty,
      isDeletingProperty
    } = this.state;
    const { id, modelId, instance, classes } = this.props;
    const instanceName = instance.name;

    const addableProperties = this.GetAddableProperties();

    let jsx = '';
    if (instance) {
      const source = TRANSPILER.TextToScript(instance.initScript);

      // initScripts really should not be defining new props
      // (leads to 'prop already added' errors)
      // but this code is ready for it
      const initPropMap = TRANSPILER.ExtractBlueprintPropertiesMap(
        instance.initScript
      );
      const blueprintName = this.GetBlueprintName();
      const propMap = new Map([
        ...GetBlueprintPropertiesMap(blueprintName),
        ...initPropMap
      ]);

      // Construct list of featProps for script UI menu
      // This is complicated.
      // In order to get a list of feature properties, we have to
      // get the featProps from existing features
      // AND compile initscript to retrieve any features added there.
      // And then combine the two featPropMaps.

      // 1. Get featPropMap from current features
      const features = GetAllFeatures();
      const featNames = [...features.keys()];
      const bpFeatPropMap = TRANSPILER.ExtractFeatPropMap(featNames);

      // 2. Get featPropMap from initScript
      const initFeatPropMap = TRANSPILER.ExtractFeatPropMapFromScript(
        instance.initScript
      );

      // 3. Combine the two maps
      //    We can do this because initScript should not be defining
      //    new features, so the two sets of feature keys are unique.
      const featPropMap = new Map([...bpFeatPropMap], [initFeatPropMap]);

      jsx = TRANSPILER.ScriptToJSX(source, {
        isEditable,
        isDeletable: isDeletingProperty,
        isInstanceEditor: true,
        propMap,
        featPropMap
      });
    }

    let propMenuJsx = '';
    if (isAddingProperty) {
      propMenuJsx = (
        <select onChange={this.OnPropMenuSelect} onClick={this.StopEvent}>
          <option value="">-- Select a property... --</option>
          {addableProperties.map(p => (
            <option value={p.name} key={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      );
    }

    const disableAddProperties = this.GetAddableProperties().length < 1;

    return (
      <div
        ref={c => {
          this.instance = c;
        }}
        className={clsx(classes.instanceSpec, {
          [classes.instanceSpecHovered]: isHovered,
          [classes.instanceSpecSelected]: isSelected
        })}
        onClick={this.OnInstanceClick}
        onPointerEnter={this.OnHoverOver}
        onPointerLeave={this.OnHoverOut}
      >
        <div>
          {isEditable && (
            <div
              className={classes.instanceEditorLineItem}
              style={{ margin: '0.5em 0' }}
            >
              <div
                className={classes.instanceEditorLabel}
                style={{ fontSize: '10px' }}
              >
                Character Type:
              </div>
              <div className={classes.instanceEditorData}>
                {instance.blueprint}
              </div>
            </div>
          )}
          <InputField
            propName="Name"
            value={instanceName}
            type="string"
            isEditable={isEditable}
            onSave={this.OnNameSave}
          />
          {isEditable && (
            <>
              <div>{jsx}</div>
              <br />
              {isAddingProperty && isEditable && propMenuJsx}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={this.OnAddProperty}
                  type="button"
                  className={classes.buttonSmall}
                  title="Add Property"
                  disabled={disableAddProperties}
                >
                  {isAddingProperty ? 'HIDE PROPERTY MENU' : 'SHOW PROPERTY'}
                </button>
                {!isAddingProperty && (
                  <button
                    onClick={this.OnEnableDeleteProperty}
                    type="button"
                    className={classes.buttonSmall}
                    title="Delete Property"
                    style={{}}
                  >
                    <VisibilityIcon fontSize="small" />
                  </button>
                )}
              </div>
            </>
          )}
          {isEditable && (
            <div style={{ textAlign: 'center', marginTop: '1em' }}>
              <Button
                type="button"
                className={classes.buttonLink}
                onClick={this.OnDeleteInstance}
                startIcon={<DeleteIcon fontSize="small" />}
              >
                DELETE CHARACTER
              </Button>
            </div>
          )}
          {/* ID display for debugging
          <div className={classes.inspectorLabel}>{instance.id}&nbsp;</div>{' '}
           */}
        </div>
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(InstanceEditor);
