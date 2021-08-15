/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "prop" keyword object

  The prop keyword is used for referencing an agent instance's property
  in either short format or context format. Both forms invoke a named
  method followed by variable arguments.

  FORM 1: prop x methodName args
  FORM 2: prop agent.x methodName args
          prop Bee.x methodName args

  In addition, it renders three views:

  1. Static Minimized View -- Just text.

        energyLevel: 5

  2. Instance Editor View -- A simplified view that only allows setting a
     parameter value via an input field.

        energyLevel [ 5 ] [ delete ]

  3. Script Wizard View -- A full edit view that allows different property
     selection as well as different method and value selection.

        prop [ energyLevel ] [ setTo ] [ 5 ]

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import DeleteIcon from '@material-ui/icons/VisibilityOff';
import UR from '@gemstep/ursys/client';
import Keyword, {
  DerefProp,
  JSXFieldsFromUnit,
  TextifyScriptUnitValues,
  ScriptifyText
} from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';
import { TextToScript } from 'modules/sim/script/tools//text-to-script';
import GVarElement from '../components/GVarElement';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state.
 *
 *  WIP: Currently this component can only handle setTo method.
 *
 *  NOTE: PropElement shares the same state as the `prop` keyword class
 *
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = {
  context: string;
  propName: string;
  methodName: string;
  args: string[];
  parentLineIndices: any;
};
type MyProps = {
  index: number;
  state: MyState;
  propMap: Map<any, any>;
  methodsMap: Map<string, string[]>;
  isEditable: boolean;
  isDeletable: boolean;
  isInstanceEditor: boolean;
  serialize: (state: MyState) => TScriptUnit;
  classes: Object;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PropElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  serialize: (state: MyState) => TScriptUnit;
  constructor(props: MyProps) {
    super(props);
    const { index, state, serialize } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
    this.serialize = serialize;
    this.onDeleteLine = this.onDeleteLine.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.onSelectPropName = this.onSelectPropName.bind(this);
    this.onSelectMethod = this.onSelectMethod.bind(this);
    this.saveData = this.saveData.bind(this);
  }
  componentDidMount() {}
  onDeleteLine(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    const updata = { index: this.index };
    UR.RaiseMessage('SCRIPT_LINE_DELETE', updata);
  }
  onValueChange() {
    UR.RaiseMessage('SCRIPT_IS_DIRTY');
  }
  onSelectPropName(value) {
    this.setState({ propName: value }, () => this.saveData());
  }
  onSelectMethod(value) {
    this.setState({ methodName: value }, () => this.saveData());
  }
  /**
   * @param {boolean} exitEdit Tell InstanceEditor to exit edit mode.
   *                           Used to handle exiting edit on "Enter"
   */
  saveData(exitEdit = false) {
    const { parentLineIndices } = this.state;
    const updata = {
      index: this.index,
      parentLineIndices,
      scriptUnit: this.serialize(this.state),
      exitEdit
    };
    UR.RaiseMessage('SCRIPT_UI_CHANGED', updata);
  }
  render() {
    const {
      index,
      propMap,
      methodsMap,
      isEditable,
      isDeletable,
      isInstanceEditor,
      classes
    } = this.props;
    const { context, propName, methodName, args } = this.state;

    let propNames = [...propMap.values()];

    const deletablejsx = (
      <>
        {isDeletable && (
          <div className={classes.instanceEditorLine}>
            <button
              type="button"
              className={classes.buttonMini}
              onClick={this.onDeleteLine}
            >
              <DeleteIcon fontSize="small" />
            </button>
          </div>
        )}
      </>
    );

    let jsx;
    if (!isEditable) {
      // Static Minimized View
      jsx = (
        <>
          {context ? `${context}.` : ''}
          {propName}:&nbsp;{args[0]}&nbsp;{' '}
        </>
      );
    } else if (isInstanceEditor) {
      // InstanceEditor
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 15px' }}>
          <GVarElement
            state={this.state}
            context={context}
            propName={propName}
            propNameOptions={propNames}
            propMethod={methodName}
            propMethodsMap={methodsMap}
            args={args}
            onSelectProp={this.onSelectPropName}
            onSelectMethod={this.onSelectMethod}
            onValueChange={this.onValueChange}
            onSaveData={this.saveData}
            index={index}
          />
          {deletablejsx}
        </div>
      );
    } else {
      // Script Wizard
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 15px' }}>
          <div
            style={{
              display: 'grid',
              gridAutoColumns: '1fr',
              gridAutoFlow: 'column'
            }}
          >
            prop
            <GVarElement
              state={this.state}
              context={context}
              propName={propName}
              propNameOptions={propNames}
              propMethod={methodName}
              propMethodsMap={methodsMap}
              args={args}
              onSelectProp={this.onSelectPropName}
              onSelectMethod={this.onSelectMethod}
              onValueChange={this.onValueChange}
              onSaveData={this.saveData}
              index={index}
            />
          </div>
          {deletablejsx}
        </div>
      );
    }
    return jsx;
  }
} // end script element

/// GEMSCRIPT KEYWORD DEFINITION //////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class prop extends Keyword {
  // base properties defined in KeywordDef
  type: string;

  constructor() {
    super('prop');
    this.args = ['refArg:object', 'methodName:string', '...args'];
    this.serialize = this.serialize.bind(this);
    this.type = '';
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, methodName, ...args] = unit;
    // create a function that will be used to dereferences the objref
    // into an actual call
    const deref = DerefProp(refArg);
    return [
      (agent: IAgent, state: IState) => {
        const p = deref(agent, state.ctx, methodName, ...args);
        p[methodName](...args);
      }
    ];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    // pull `type` and 'propMethods' out so it doesn't get mixed in with `...arg`
    const { context, propName, methodName, type, propMethods, args } = state;
    const refArg = context ? `${context}.${propName}` : propName;
    const scriptArr = [this.keyword, refArg, methodName, ...args];
    const scriptText = TextifyScriptUnitValues(scriptArr);
    const scriptUnits = TextToScript(scriptText);
    return scriptUnits;
  }

  /** return rendered component representation */
  jsx(
    index: number,
    unit: TScriptUnit,
    // REVIEW: Add 'options' here?
    children?: any[] // options
  ): any {
    const expUnit = JSXFieldsFromUnit(unit);
    const [kw, refArg, methodName, ...args] = expUnit;

    // Dereference Ref ("Costume" or "Moth.Costume")
    const ref = refArg.objref || [refArg];
    const len = ref.length;
    let propName = '';
    let context = '';
    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      propName = `${ref[0]}`;
      // context = `${ref[0]}`;
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      propName = `${ref[1]}`;
      context = `${ref[0]}`;
    }

    const state = {
      context,
      propName,
      methodName,
      args,
      type: '', // set by PropElement
      propMethods: [], // set by PropElement
      parentLineIndices: children ? children.parentLineIndices : undefined
    };
    const isEditable = children ? children.isEditable : false;
    const isDeletable = children ? children.isDeletable : false;
    const isInstanceEditor = children ? children.isInstanceEditor : false;
    const propMap = children ? children.propMap : new Map();
    const property = propMap.get(propName);
    this.type = property ? property.type : 'string';

    const StyledPropElement = withStyles(useStylesHOC)(PropElement);
    const jsx = (
      <StyledPropElement
        state={state}
        index={index}
        key={index}
        propMap={propMap}
        methodsMap={this.getMethodsMap()} // in class-keyword
        isEditable={isEditable}
        isDeletable={isDeletable}
        isInstanceEditor={isInstanceEditor}
        serialize={this.serialize}
      />
    );
    if (!isInstanceEditor || isEditable) {
      // Script Editor, add line numbers
      return super.jsx(index, unit, jsx);
    }
    return jsx;
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
