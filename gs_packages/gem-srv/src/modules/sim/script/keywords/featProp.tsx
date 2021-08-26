/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "featProp" keyword object

  The featProp keyword is used for referencing an agent instance property
  that is controlled by a GFeature. There are two forms:

  FORM 1: featProp Costume.pose methodName args
  FORM 2: featProp agent.Costume.pose methodName args
          featProp Bee.Costume.pose methodName args

  In addition, it renders three views:

  1. Static Minimized View -- Just text.

        energyLevel: 5

  2. Instance Editor View -- A simplified view that only allows setting a
     parameter value via an input field.

        energyLevel [ 5 ] [ delete ]

  3. Script Wizard View -- A full edit view that allows different property
     selection as well as different method and value selection.

        featProp AgentWidget [ energyLevel ] [ setTo ] [ 5 ]


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import DeleteIcon from '@material-ui/icons/VisibilityOff';
import UR from '@gemstep/ursys/client';
import Keyword, {
  DerefFeatureProp,
  JSXFieldsFromUnit,
  TextifyScriptUnitValues,
  ScriptifyText
} from 'lib/class-keyword';
import GAgent from 'lib/class-gagent';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword, GetFeature } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';
import { TextToScript } from 'modules/sim/script/tools//text-to-script';
import InputElement from '../components/InputElement';
import SelectElement from '../components/SelectElement';
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
  featName: string;
  featPropName: string;
  methodName: string;
  args: string[];
  featPropMethods: string[];
  parentLineIndices: number;
  blockIndex: number;
};
type MyProps = {
  index: number;
  state: MyState;
  featPropMap: Map<any, any>;
  methodsMap: Map<string, string[]>;
  isEditable: boolean;
  isDeletable: boolean;
  isInstanceEditor: boolean;
  serialize: (state: MyState) => TScriptUnit;
  classes: Object;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class FeatPropElement extends React.Component<MyProps, MyState> {
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
    this.onSelectFeature = this.onSelectFeature.bind(this);
    this.onSelectPropName = this.onSelectPropName.bind(this);
    this.onSelectMethod = this.onSelectMethod.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
    this.saveData = this.saveData.bind(this);
  }
  componentDidMount() {}
  onDeleteLine(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    const updata = { index: this.index };
    UR.RaiseMessage('SCRIPT_LINE_DELETE', updata);
  }
  onSelectFeature(value) {
    this.setState({ featName: value, featPropName: '', methodName: '' }, () =>
      this.saveData()
    );
  }
  onSelectPropName(value) {
    this.setState({ featPropName: value }, () => this.saveData());
  }
  onSelectMethod(value) {
    this.setState({ methodName: value }, () => this.saveData());
  }
  onValueChange() {
    UR.RaiseMessage('SCRIPT_IS_DIRTY');
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
      featPropMap,
      isEditable,
      isDeletable,
      isInstanceEditor,
      methodsMap,
      classes
    } = this.props;
    const {
      context,
      featName,
      featPropName,
      methodName,
      args,
      featPropMethods
    } = this.state;

    // ERROR HANDLING
    // skip if not defined yet
    if (!featPropMap) {
      // REVIEW: This shouldn't happen anymore?  Remove?
      // -> Actually this catches bad calls
      console.error('undefined featPropMap...skipping featProp render');
      return '';
    }
    // catch bad featpropmethods
    if (!featPropMethods) {
      // REVIEW: This shouldn't happen anymore?  Remove?
      console.error('undefined featPropMethods...skipping featProp render');
      return '';
    }

    const featNames = [...featPropMap.keys()];
    const featProps = featPropMap.get(featName);
    const propNameOptions = featProps ? [...featProps.values()] : ['none found'];

    // Delete Button
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

    // JSX
    let jsx;
    if (!isEditable) {
      // Static Minimized View
      jsx = (
        <>
          {featName}:{context ? `${context}.` : ''}
          {featPropName}:&nbsp;{args[0]}&nbsp;{' '}
        </>
      );
    } else if (isInstanceEditor) {
      // InstanceEditor
      jsx = (
        <div
          style={{
            display: 'grid'
            // gridTemplateColumns: 'auto 15px',
            // gridAutoRows: '1fr'
          }}
        >
          <>
            {featName}&nbsp;
            {context ? `${context}.` : ''}
            <GVarElement
              state={this.state}
              context="" // not needed for featProp
              propName={featPropName}
              propNameOptions={propNameOptions}
              propMethod={methodName}
              propMethodsMap={methodsMap}
              args={args}
              onSelectProp={this.onSelectPropName}
              onSelectMethod={this.onSelectMethod}
              onValueChange={this.onValueChange}
              onSaveData={this.saveData}
              index={index}
            />
          </>
          {deletablejsx}
        </div>
      );
    } else {
      // Script Wizard
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 15px' }}>
          <div
            style={{
              display: 'grid'
            }}
          >
            featProp {context ? `${context}.` : ''}
            <SelectElement
              state={this.state}
              value={featName}
              options={featNames}
              selectMessage="-- Select a feature... --"
              onChange={this.onSelectFeature}
              index={index}
            />
            <GVarElement
              state={this.state}
              context="" // not needed for featProp
              propName={featPropName}
              propNameOptions={propNameOptions}
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
export class featProp extends Keyword {
  // base featProperties defined in KeywordDef

  constructor() {
    super('featProp');
    this.args = ['refArg:object', 'methodName:string', '...args'];
    this.serialize = this.serialize.bind(this);
  }

  /** create smc blueprint code objects */
  compile(unit: TScriptUnit): TOpcode[] {
    const [kw, refArg, featPropName, methodName, ...args] = unit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = refArg.objref || [refArg];
    const len = ref.length;

    // create a function that will be used to callReferences the objref
    // into an actual call
    let callRef;

    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      callRef = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        return agent.getFeatProp(ref[0], pName)[mName](...prms);
      };
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      /// e.g. 'agent.Costume' or 'Bee.Costume'
      callRef = (
        agent: IAgent,
        context: any,
        pName: string,
        mName: string,
        ...prms
      ) => {
        const c = context[ref[0]]; // GAgent context
        if (c === undefined) throw Error(`context missing '${ref[0]}'`);
        return c.getFeatProp(ref[1], pName)[mName](...prms);
      };
    } else {
      console.warn('error parse ref', ref);
      callRef = () => {};
    }
    return [
      (agent: IAgent, state: IState) => {
        return callRef(agent, state.ctx, featPropName, methodName, ...args);
      }
    ];

    // OLD broken method
    // const [kw, refArg, methodName, ...args] = unit;
    // const deref = DerefFeatureProp(refArg);
    // return [
    //   (agent: IAgent, state: IState) => {
    //     const p = deref(agent, state.ctx);
    //     console.error('p', p);
    //     p[methodName](...args);
    //   }
    // ];
  }

  /** return a state object that turn react state back into source */
  serialize(state: any): TScriptUnit {
    // ORIG
    // const { featPropName, methodName, ...args } = state;
    // return [this.keyword, featName, featPropName, methodName, ...args];

    const { featName, context, featPropName, methodName, args } = state;
    const refArg =
      context && context !== 'agent' ? `${context}.${featName}` : featName;
    const scriptArr = [this.keyword, refArg, featPropName, methodName, ...args];
    const scriptText = TextifyScriptUnitValues(scriptArr);
    const scriptUnits = TextToScript(scriptText);
    return scriptUnits;
  }

  /** return rendered component representation */
  jsx(
    index: number,
    unit: TScriptUnit,
    children?: any[] // options
  ): any {
    const expUnit = JSXFieldsFromUnit(unit);
    const [kw, refArg, featPropName, methodName, ...args] = expUnit;
    // ref is an array of strings that are fields in dot addressing
    // like agent.x
    const ref = refArg.objref || [refArg];
    const len = ref.length;

    let featName;
    let context;
    if (len === 1) {
      /** IMPLICIT REF *******************************************************/
      /// e.g. 'Costume' is interpreted as 'agent.Costume'
      context = 'agent';
      featName = ref[0];
    } else if (len === 2) {
      /** EXPLICIT REF *******************************************************/
      context = ref[0];
      featName = ref[1];
    }
    const state = {
      context,
      featName,
      featPropName, // feature prop name
      methodName,
      args,
      featPropMethods: [], // set by PropElement
      parentLineIndices: children ? children.parentLineIndices : undefined,
      blockIndex: children ? children.blockIndex : undefined
    };
    const isEditable = children ? children.isEditable : false;
    const isDeletable = children ? children.isDeletable : false;
    const isInstanceEditor = children ? children.isInstanceEditor : false;

    // Retrieve Feature Properties
    // featPropMap is a map of maps of maps
    // featPropMap: Map <featName, featProps>
    // featProps: Map <featPropName, propDef>
    // propDef: { name, type, defaultValue, isFeatProp }
    const featPropMap = children ? children.featPropMap : new Map();

    const StyledFeatPropElement = withStyles(useStylesHOC)(FeatPropElement);
    const jsx = (
      <StyledFeatPropElement
        state={state}
        index={index}
        key={index}
        featPropMap={featPropMap}
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

  // ORIG METHOD
  // jsx(index: number, unit: TScriptUnit, children?: any[]): any {
  //   const [kw, ref, propName, methodName, ...arg] = unit;
  //   return super.jsx(
  //     index,
  //     unit,
  //     <>
  //       featProp {ref}.{propName} {methodName}({arg.join(' ')})
  //     </>
  //   );
  // }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(featProp);
