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
  propName: string;
  methodName: string;
  args: string[];
  // type: string;
  // propMethods: string[];
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
    // this.getType = this.getType.bind(this);
    this.saveData = this.saveData.bind(this);
  }
  componentDidMount() {
    // const { methodsMap } = this.props;
    // const { propName } = this.state;
    // // const type = this.getType(propName);
    // this.setState({
    //   // type,
    //   propMethods: methodsMap.get(type)
    // });
  }
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
    const { methodsMap } = this.props;
    // const type = this.getType(value);
    this.setState(
      {
        propName: value
        // type,
        // propMethods: methodsMap.get(type)
      },
      () => this.saveData()
    );
  }
  onSelectMethod(value) {
    this.setState({ methodName: value }, () => this.saveData());
  }
  // getType(propName) {
  //   // type should be dynamically calculated with each render
  //   // in case propName changes to a different type
  //   const { propMap } = this.props;
  //   const prop = propMap.get(propName);

  //   // console.error('getType', propName, propMap, prop);
  //   // const type = prop ? prop.type : undefined;

  //   // graceful fallback if type is not either
  //   // a. a defined prop
  //   // b. a pre-defined prop (x,y) in TRANSPILIER.ExtractBlueprintProperties
  //   let type;
  //   if (prop && prop.type) {
  //     type = prop.type;
  //   } else {
  //     // Try to determine the prop directly?
  //   }
  //   return type;
  // }
  /**
   *
   * @param {boolean} exitEdit Tell InstanceEditor to exit edit mode.
   *                           Used to handle exiting edit on "Enter"
   */
  saveData(exitEdit = false) {
    const updata = {
      index: this.index,
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
    // const { propName, methodName, args, type, propMethods } = this.state;
    const { propName, methodName, args } = this.state;

    let propNames = [...propMap.values()];

    // GVarElement takes care of this mapping so no need to do it here
    // propNames = propNames.map(p => p.name);

    console.log(
      'propName',
      propName,
      'propNames',
      propNames,
      'propMethod/methodName',
      methodName,
      'propMethodMap',
      methodsMap
    );

    // const argsjsx = (
    //   <>
    //     {args.map((arg, i) => (
    //       <InputElement
    //         state={this.state}
    //         type={type}
    //         onChange={this.onInputElementChange}
    //         onSave={this.saveData}
    //         index={index}
    //         argindex={i}
    //         key={i}
    //       />
    //     ))}
    //   </>
    // );

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
          {propName}:&nbsp;{args[0]}&nbsp;{' '}
        </>
      );
    } else if (isInstanceEditor) {
      // InstanceEditor
      jsx = (
        <div style={{ display: 'grid', gridTemplateColumns: '80px auto 15px' }}>
          <GVarElement
            state={this.state}
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
          {/* <div className={classes.instanceEditorLabel}>{propName}</div>
          {argsjsx} */}
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
            {/* <SelectElement
              state={this.state}
              value={propName}
              options={propNames}
              selectMessage="-- Select a property... --"
              onChange={this.onSelectPropName}
              index={index}
            />
            <SelectElement
              state={this.state}
              value={methodName}
              options={propMethods}
              selectMessage="-- Select a method... --"
              onChange={this.onSelectMethod}
              index={index}
            />
            {argsjsx} */}
          </div>
          {deletablejsx}
        </div>
      );
    }
    return jsx;
  }
} // end script element

// ORIG CLASS
//
// class PropElement extends React.Component<MyProps, MyState> {
//   index: number; // ui index
//   keyword: string; // keyword
//   serialize: (state: MyState) => TScriptUnit;
//   constructor(props: MyProps) {
//     super(props);
//     const { index, state, serialize } = props;
//     this.index = index;
//     this.state = { ...state }; // copy state prop
//     this.serialize = serialize;
//     this.onChange = this.onChange.bind(this);
//     this.onKeyDown = this.onKeyDown.bind(this);
//     this.onBlur = this.onBlur.bind(this);
//     this.saveData = this.saveData.bind(this);
//     this.onClick = this.onClick.bind(this);
//     this.onDeleteLine = this.onDeleteLine.bind(this);
//   }
//   componentWillUnmount() {
//     const { isEditable } = this.props;
//     if (isEditable) this.saveData();
//   }
//   onChange(e) {
//     this.setState({
//       args: [e.currentTarget.value],
//       isDirty: true
//     });
//   }
//   onKeyDown(e) {
//     if (e.key === 'Enter') this.saveData(true);
//   }
//   onBlur() {
//     this.saveData();
//   }
//   onClick(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     // Stop click here when user clicks inside form to edit.
//     // Other clicks will propagage to InstanceEditor where it will exit edit mode
//   }
//   onDeleteLine(e) {
//     e.preventDefault(); // prevent click from deselecting instance
//     e.stopPropagation();
//     const updata = { index: this.index };
//     UR.RaiseMessage('SCRIPT_LINE_DELETE', updata);
//   }
//   /**
//    *
//    * @param {boolean} exitEdit Tell InstanceEditor to exit edit mode.
//    *                           Used to handle exiting edit on "Enter"
//    */
//   saveData(exitEdit = false) {
//     const { isDirty } = this.state;
//     if (!isDirty) return;
//     const updata = {
//       index: this.index,
//       scriptUnit: this.serialize(this.state),
//       exitEdit
//     };
//     UR.RaiseMessage('SCRIPT_UI_CHANGED', updata);
//   }
//   render() {
//     const { index, type, isEditable, isDeletable, classes } = this.props;
//     const { propName, methodName, args } = this.state;
//     let jsx;
//     if (isEditable) {
//       // Show Form
//       jsx = (
//         <div style={{ display: 'grid', gridTemplateColumns: '80px auto 15px' }}>
//           <div className={classes.instanceEditorLabel}>{propName}</div>
//           <input
//             onChange={this.onChange}
//             onKeyDown={this.onKeyDown}
//             onBlur={this.onBlur}
//             onClick={this.onClick}
//             type={type}
//             value={args[0]}
//             className={classes.instanceEditorField}
//           />
//           {isDeletable && (
//             <div className={classes.instanceEditorLine}>
//               <button
//                 type="button"
//                 className={classes.buttonMini}
//                 onClick={this.onDeleteLine}
//               >
//                 <DeleteIcon fontSize="small" />
//               </button>
//             </div>
//           )}
//         </div>
//       );
//     } else {
//       // Show Static Value
//       jsx = (
//         <>
//           {propName}:&nbsp;{args[0]}&nbsp;{' '}
//         </>
//       );
//     }
//     return jsx;
//   }
// } // end script element

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
    const { propName, methodName, type, propMethods, args } = state;
    const scriptArr = [this.keyword, propName, methodName, ...args];
    const scriptText = TextifyScriptUnitValues(scriptArr);
    const scriptUnits = ScriptifyText(scriptText);
    return scriptUnits;
  }

  /** return rendered component representation */
  jsx(
    index: number,
    unit: TScriptUnit,
    children?: any[] // options
  ): any {
    const expUnit = JSXFieldsFromUnit(unit);
    const [kw, ref, methodName, ...args] = expUnit;
    const state = {
      propName: ref,
      methodName,
      args,
      type: '', // set by PropElement
      propMethods: [] // set by PropElement
    };
    const isEditable = children ? children.isEditable : false;
    const isDeletable = children ? children.isDeletable : false;
    const isInstanceEditor = children ? children.isInstanceEditor : false;
    const propMap = children ? children.propMap : new Map();
    const property = propMap.get(ref);
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
    if (!isInstanceEditor) {
      // Script Editor, add line numbers
      const retval = super.jsx(index, unit, jsx);
      return retval;
    }
    return jsx;

    // Orig Method wraps a line number around the property
    // The `super.jsx` call does the wrapping.
    // return super.jsx(
    //   index,
    //   unit,
    //   <PropElement
    //     index={index}
    //     state={state}
    //     isEditable={isEditable}
    //     serialize={this.serialize}
    //   />
    // );
  }
} // end of UseFeature

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
RegisterKeyword(prop);
