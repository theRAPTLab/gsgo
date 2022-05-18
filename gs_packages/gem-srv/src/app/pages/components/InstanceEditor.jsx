/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

InstanceEditor

Shows instance init scripts.
* Used to define instances in a map.
* Allows properties to be edited.

Limitations
* This really does not support nested script editing.
  Instance initScripts are supposed relativelys imple property setting.
  If more complex script editing is neeeded, this should probably use
  SubpanelScript.

props
* label -- a temporary label for displaying in list mode
           so we don't have to load/pass the full instance object
           when clicked and placed in edit mode, the label is properly
           read from a full instance state object.

props.instance = instance specification: {name, blueprint, initScript}
  e.g. {name: "fish01", blueprint: "Fish", initScript: "prop x setTo -220↵prop y setTo -220"}

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import clsx from 'clsx';
import UR from '@gemstep/ursys/client';
import DeleteIcon from '@material-ui/icons/Delete';
import VisibilityIcon from '@material-ui/icons/VisibilityOff';
import { Button, ClickAwayListener } from '@material-ui/core';
import { GetAllFeatures } from 'modules/datacore/dc-sim-data';
import * as ACBlueprints from 'modules/appcore/ac-blueprints';
import * as ACInstances from 'modules/appcore/ac-instances';
import * as TRANSPILER from 'script/transpiler-v2';
import { UpdateScript } from 'modules/sim/script/tools/script-to-jsx';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';
import InputField from './InputField';

/// CONSTANTS AND DECLARATIONS ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('InstEditor');
const DBG = false;

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class InstanceEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      instance: {},
      isEditable: false,
      isHovered: false,
      isSelected: false,
      isAddingProperty: false,
      isDeletingProperty: false,
      ignoreNextClickAway: false
    };
    this.GetInstanceName = this.GetInstanceName.bind(this);
    this.HandleScriptUpdate = this.HandleScriptUpdate.bind(this);
    this.HandleScriptLineDelete = this.HandleScriptLineDelete.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    this.GetSettableProperties = this.GetAddableProperties.bind(this);
    this.OnAddProperty = this.OnAddProperty.bind(this);
    this.OnEnableDeleteProperty = this.OnEnableDeleteProperty.bind(this);
    this.OnPropMenuSelect = this.OnPropMenuSelect.bind(this);
    this.OnDeleteInstance = this.OnDeleteInstance.bind(this);
    this.DoDeselect = this.DoDeselect.bind(this);
    this.HandleEditEnable = this.HandleEditEnable.bind(this);
    this.HandleEditDisable = this.HandleEditDisable.bind(this);
    this.HandleHoverOver = this.HandleHoverOver.bind(this);
    this.HandleHoverOut = this.HandleHoverOut.bind(this);
    this.HandleDeselect = this.HandleDeselect.bind(this);
    this.OnHoverOver = this.OnHoverOver.bind(this);
    this.OnHoverOut = this.OnHoverOut.bind(this);
    this.OnNameChange = this.OnNameChange.bind(this);
    this.OnInstanceSave = this.OnInstanceSave.bind(this);
    this.OnClickAway = this.OnClickAway.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);
    UR.HandleMessage('SCRIPT_UI_CHANGED', this.HandleScriptUpdate);
    UR.HandleMessage('SCRIPT_LINE_DELETE', this.HandleScriptLineDelete);
    UR.HandleMessage('INSTANCE_EDIT_ENABLE', this.HandleEditEnable);
    UR.HandleMessage('INSTANCE_EDIT_DISABLE', this.HandleEditDisable);
    UR.HandleMessage('SIM_INSTANCE_HOVEROVER', this.HandleHoverOver);
    UR.HandleMessage('SIM_INSTANCE_HOVEROUT', this.HandleHoverOut);
    UR.HandleMessage('NET:INSTANCE_DESELECT', this.HandleDeselect);
  }

  componentDidMount() {
    const { id } = this.props;
    const { currentInstance } = UR.ReadFlatStateGroups('instances');
    if (currentInstance && currentInstance.id === id) {
      this.setState({ instance: currentInstance });
    }
    UR.SubscribeState('instances', this.urStateUpdated);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('instances', this.urStateUpdated);
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
    return instance && instance.label ? instance.label : 'not loaded';
  }

  /**
   * URSYS Script update sent from prop.tsx
   * @param {*} data
   */
  HandleScriptUpdate(data) {
    const { isEditable } = this.state;
    if (isEditable) {
      if (data.exitEdit) {
        this.DoDeselect();
      }
      this.setState(
        state => {
          const { instance } = state;
          instance.initScript = UpdateScript(instance.initScript, data);
          return { instance };
        },
        () => this.OnInstanceSave()
      );
    }
  }

  HandleScriptLineDelete(data) {
    // Update the script
    const { isEditable } = this.state;
    if (isEditable) {
      this.setState(
        state => {
          const { instance } = state;
          // 1. Convert init script text to array
          const scriptTextLines = instance.initScript.split('\n');
          // 2. Remove the line
          scriptTextLines.splice(data.index, 1);
          // 3. Convert the script array back to script text
          const updatedScript = scriptTextLines.join('\n');
          instance.initScript = updatedScript;
          return { instance };
        },
        () => this.OnInstanceSave()
      );
    }
  }

  /**
   * User clicked on instance in "Map Instances" panel, wants to edit
   * @param {*} e
   */
  OnInstanceClick(e) {
    // Ignore clicks when editing. ClickAwayListener will handle closing.
    const { isEditable } = this.state;
    if (isEditable) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // just pass it up to Main (Map Editor) so it's centralized
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_CLICK', { agentId: id });
  }

  /// For adding new properties selection menu
  GetAddableProperties() {
    const { instance } = this.state;
    if (!instance) return [];
    // properties = [...{name, type, defaultvalue, isFeatProp }]
    let properties = ACBlueprints.GetBlueprintProperties(instance.bpid);
    // Remove properties that have already been set
    // 1. Get the list or properties
    const scriptUnits = TRANSPILER.TextToScript(instance.initScript);
    const initProperties = scriptUnits.map(unit => {
      if (
        unit[0] &&
        (unit[0].identifier === 'prop' || unit[0].identifier === 'featProp')
      ) {
        return unit[1].identifier;
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

  StopPropagation(e) {
    e.stopPropagation(); // prevent click from deselecting instance
  }

  OnPropMenuSelect(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    const selectedProp = e.target.value;
    if (selectedProp === '') return; // selected the help instructions

    this.setState(
      state => {
        const { instance } = state;
        const addableProperties = this.GetAddableProperties();
        const property = addableProperties.find(p => p.name === selectedProp);
        const keyword = property.isFeatProp ? 'featProp' : 'prop';
        const newScriptLine = `${keyword} ${property.name} setTo ${property.defaultValue}`;

        // 1. Convert init script text to array
        const scriptTextLines = instance.initScript
          ? instance.initScript.split('\n')
          : [];
        // 2. Add the updated line in the script array
        scriptTextLines.push(newScriptLine);
        // 4. Convert the script array back to script text
        const updatedScript = scriptTextLines.join('\n');

        instance.initScript = updatedScript;
        return { instance, isAddingProperty: false };
      },
      () => this.OnInstanceSave()
    );
  }

  OnDeleteInstance(e) {
    const { instance } = this.state;
    const { id } = this.props;
    e.preventDefault();
    e.stopPropagation();
    const bpid = instance.bpid;
    // Tell project-server to remove agent from stage
    UR.RaiseMessage('LOCAL:INSTANCE_DELETE', { bpid, id });
  }

  DoDeselect() {
    const { id } = this.props;
    let { isSelected, isEditable } = this.state;
    isEditable = false;
    isSelected = false;
    this.setState({ isEditable, isSelected });
    // And also deselect
    UR.RaiseMessage('NET:INSTANCE_DESELECT', { agentId: id });
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// URSYS Events
  ///
  /**
   * Enables or disables editing based on 'data' passed
   * @param {object} data { agentId }
   */
  HandleEditEnable(data) {
    const { id } = this.props;
    // Is this message for us?
    if (data.agentId === id) {
      // YES!  Enable!
      ACInstances.EditInstance(id);
      this.setState({
        isEditable: true,
        isSelected: true,
        ignoreNextClickAway: data.source === 'stage'
      });
      this.instance.scrollIntoView();
    } else {
      // always disable if message is not for us!
      this.DoDeselect();
    }
  }
  HandleEditDisable(data) {
    const { id } = this.props;
    // Is this message for us?
    if (data.agentId === id) {
      // YES!  Disable!
      this.DoDeselect();
    }
  }
  HandleHoverOver(data) {
    const { isEditable } = this.state;
    const { id } = this.props;
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hover if we're not editing?
    if (data.agentId === id && !isEditable) {
      this.setState({ isHovered: true });
    }
  }
  HandleHoverOut(data) {
    const { isEditable } = this.state;
    const { id } = this.props;
    // Changing the hover state here while the Instance is being
    // edited results in the whole instance being redrawn
    // leading to a loss of focus.
    // So we only set hoverout if we're not editing?
    if (data.agentId === id && !isEditable) {
      this.setState({ isHovered: false });
    }
  }
  HandleDeselect(data) {
    const { id } = this.props;
    if (data.agentId === id) {
      this.setState({
        isEditable: false,
        isSelected: false,
        isHovered: false,
        isAddingProperty: false
      });
    }
  }
  OnNameChange(data) {
    const { isEditable } = this.state;
    if (isEditable) {
      if (data.exitEdit) {
        // Handle "ENTER" being used to exit
        this.DoDeselect();
      }
      this.setState(
        state => {
          const { instance } = state;
          instance.label = data.value !== undefined ? data.value : instance.label;
          return { instance };
        },
        () => this.OnInstanceSave()
      );
    }
  }

  OnInstanceSave() {
    const { instance } = this.state;
    UR.WriteState('instances', 'currentInstance', instance);
  }

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// Local Events (on InstanceEditor container)
  ///
  OnHoverOver() {
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_HOVEROVER', { agentId: id });
  }
  OnHoverOut() {
    const { id } = this.props;
    UR.RaiseMessage('SIM_INSTANCE_HOVEROUT', { agentId: id });
  }
  OnClickAway(e) {
    const { id } = this.props;
    const { isEditable, ignoreNextClickAway } = this.state;
    if (ignoreNextClickAway) {
      // Requests to edit via clicking on the instance in the stage
      // (as opposed to the PanelMapInstances list) will trigger the
      // ClickAwayListener because the InstanceEditor is enabled and
      // rendered while the click from draggable bubbles its way
      // up triggering the ClickAwayListener.  We check for that in
      // HandleEditEnable and set the ignoreNextClickAway flag.
      // Stopping propagation at dragEnd doesn't work because it's the wrong
      // event and ClickAwayListener would trigger anyway.
      this.setState({ ignoreNextClickAway: false });
      return;
    }
    if (isEditable) this.DoDeselect(); // only deselect if already editing
  }
  urStateUpdated(stateObj, cb) {
    const { id } = this.props;
    const { currentInstance } = stateObj;
    if (currentInstance && currentInstance.id === id) {
      this.setState({ instance: currentInstance });
    }
    if (typeof cb === 'function') cb();
  }

  render() {
    const {
      instance,
      isEditable,
      isHovered,
      isSelected,
      isAddingProperty,
      isDeletingProperty
    } = this.state;
    const { id, label, classes } = this.props;

    if (DBG) console.log(...PR('render', id, instance));

    // if 'instance' data has been loaded (we're editing) then use that
    // otherwise, use the label passed by PanelMapInstances
    const inputLabel = (instance && instance.label) || label;

    if (!inputLabel) return 'not loaded yet';

    const addableProperties = this.GetAddableProperties();

    let scriptJSX = '';
    if (instance) {
      const source = TRANSPILER.TextToScript(instance.initScript);

      // initScripts really should not be defining new props
      // (leads to 'prop already added' errors)
      // but this code is ready for it
      const initPropMap = TRANSPILER.ExtractBlueprintPropertiesMap(
        instance.initScript
      );
      const blueprintName = instance.bpid;
      const propMap = new Map([
        ...ACBlueprints.GetBlueprintPropertiesMap(blueprintName),
        ...initPropMap
      ]);

      // MOVE this to ACBlueprint?
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

      scriptJSX = TRANSPILER.ScriptToJSX(source, {
        isEditable,
        isDeletable: isDeletingProperty,
        isInstanceEditor: true,
        propMap,
        featPropMap
      });
    }

    let propMenuJSX = '';
    if (isAddingProperty) {
      propMenuJSX = (
        <select
          onChange={this.OnPropMenuSelect}
          onClick={this.StopEvent}
          onPointerDown={this.StopPropagation}
        >
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

    const inputJSX = (
      <InputField
        propName="Name"
        value={inputLabel}
        type="string"
        isEditable={isEditable}
        onChange={this.OnNameChange}
      />
    );

    return (
      <div
        ref={c => {
          this.instance = c;
        }}
        className={clsx(classes.instanceSpec, {
          [classes.instanceSpecHovered]: isHovered,
          [classes.instanceSpecSelected]: isSelected
        })}
        onPointerEnter={this.OnHoverOver}
        onPointerLeave={this.OnHoverOut}
        onClick={this.OnInstanceClick}
      >
        {!isEditable ? (
          inputJSX
        ) : (
          <ClickAwayListener onClickAway={this.OnClickAway}>
            <div>
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
                <div className={classes.instanceEditorData}>{instance.bpid}</div>
              </div>
              {inputJSX}
              <div>
                {scriptJSX}⛔️ ben need to replace jsx() dependence to show props
                again ⛔️
              </div>
              <br />
              {isAddingProperty && isEditable && propMenuJSX}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={this.OnAddProperty}
                  onPointerDown={this.StopEvent}
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
                    onPointerDown={this.StopEvent}
                    type="button"
                    className={classes.buttonSmall}
                    title="Delete Property"
                    style={{}}
                  >
                    <VisibilityIcon fontSize="small" />
                  </button>
                )}
              </div>
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
            </div>
          </ClickAwayListener>
        )}
      </div>
    );
  }
}

export default withStyles(useStylesHOC)(InstanceEditor);
