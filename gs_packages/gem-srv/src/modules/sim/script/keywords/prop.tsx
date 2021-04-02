/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "prop" keyword object

  The prop keyword is used for referencing an agent instance's property
  in either short format or context format. Both forms invoke a named
  method followed by variable arguments.

  FORM 1: prop x methodName args
  FORM 2: prop agent.x methodName args
          prop Bee.x methodName args

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import DeleteIcon from '@material-ui/icons/DeleteForever';
import UR from '@gemstep/ursys/client';
import Keyword, { DerefProp, JSXFieldsFromUnit } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';
import InputElement from '../components/InputElement.tsx';

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
};
type MyProps = {
  index: number;
  state: MyState;
  type: string;
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
    this.saveData = this.saveData.bind(this);
  }
  onDeleteLine(e) {
    e.preventDefault(); // prevent click from deselecting instance
    e.stopPropagation();
    const updata = { index: this.index };
    UR.RaiseMessage('SCRIPT_LINE_DELETE', updata);
  }
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
      type,
      isEditable,
      isDeletable,
      isInstanceEditor,
      classes
    } = this.props;
    const { propName, methodName, args } = this.state;
    return (
      <>
        {!isEditable ? (
          <>
            {propName}:&nbsp;{args[0]}&nbsp;{' '}
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '80px auto 15px' }}>
            {isInstanceEditor ? (
              <div className={classes.instanceEditorLabel}>{propName}</div>
            ) : (
              <>prop {propName} setTo</>
            )}
            {args.map((arg, i) => (
              <InputElement
                state={this.state}
                type={type}
                onSave={this.saveData}
                index={index}
                argindex={i}
                key={i}
              />
            ))}
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
          </div>
        )}
      </>
    );
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

  constructor() {
    super('prop');
    this.args = ['refArg:object', 'methodName:string', '...args'];
    this.serialize = this.serialize.bind(this);
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
    const { propName, methodName, ...arg } = state;
    const args = Object.values(arg);
    return [this.keyword, propName, methodName, ...args];
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
      args
    };
    const isEditable = children ? children.isEditable : false;
    const isDeletable = children ? children.isDeletable : false;
    const isInstanceEditor = children ? children.isInstanceEditor : false;
    const typeMap = children ? children.typeMap : 'String';
    const StyledPropElement = withStyles(useStylesHOC)(PropElement);
    return (
      <StyledPropElement
        state={state}
        index={index}
        key={index}
        type={typeMap.get(ref)}
        isEditable={isEditable}
        isDeletable={isDeletable}
        isInstanceEditor={isInstanceEditor}
        serialize={this.serialize}
      />
    );

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
