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
import UR from '@gemstep/ursys/client';
import Keyword from 'lib/class-keyword-collapsible';
import { DerefProp, JSXFieldsFromUnit } from 'lib/class-keyword';
// import Keyword, { DerefProp, JSXFieldsFromUnit } from 'lib/class-keyword';
import { IAgent, IState, TOpcode, TScriptUnit } from 'lib/t-script';
import { RegisterKeyword } from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** implement interactive react component for this keyword, saving information
 *  in the local state.
 *
 *  WIP: Currently this component can only handle setTo method.
 */
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = {
  propName: string;
  methodName: string;
  args: string[];
  isDirty: boolean;
};
type MyProps = {
  index: number;
  state: MyState;
  isEditable: boolean;
  isDeletable: boolean;
  serialize: (state: MyState) => TScriptUnit;
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
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.saveData = this.saveData.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onDeleteLine = this.onDeleteLine.bind(this);
  }
  componentWillUnmount() {
    const { isEditable } = this.props;
    if (isEditable) this.saveData();
  }
  onChange(e) {
    this.setState({
      args: [e.currentTarget.value],
      isDirty: true
    });
  }
  onKeyDown(e) {
    if (e.key === 'Enter') this.saveData(true);
  }
  onBlur() {
    this.saveData();
  }
  onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    // Stop click here when user clicks inside form to edit.
    // Other clicks will propagage to InstanceEditor where it will exit edit mode
  }
  onDeleteLine() {
    const updata = { index: this.index };
    UR.RaiseMessage('SCRIPT_LINE_DELETE', updata);
  }
  /**
   *
   * @param {boolean} exitEdit Tell InstanceEditor to exit edit mode.
   *                           Used to handle exiting edit on "Enter"
   */
  saveData(exitEdit = false) {
    const { isDirty } = this.state;
    if (!isDirty) return;
    const updata = {
      index: this.index,
      scriptUnit: this.serialize(this.state),
      exitEdit
    };
    UR.RaiseMessage('SCRIPT_UI_CHANGED', updata);
  }
  render() {
    const { index, isEditable, isDeletable, classes } = this.props;
    const { propName, methodName, args } = this.state;
    let jsx;
    // HACK force number for now
    // In the future check for argument type
    const type = 'number';
    if (isEditable) {
      // Show Form
      jsx = (
        <div>
          {isDeletable && (
            <div className={classes.instanceEditorLine}>
              <button
                type="button"
                className={classes.buttonMini}
                onClick={this.onDeleteLine}
              >
                x
              </button>
            </div>
          )}
          <div className={classes.instanceEditorLabel}>{propName}</div>
          <div className={classes.instanceEditorLine}>
            <input
              onChange={this.onChange}
              onKeyDown={this.onKeyDown}
              onBlur={this.onBlur}
              onClick={this.onClick}
              type={type}
              value={args[0]}
              className={classes.instanceEditorField}
            />
          </div>
        </div>
      );
    } else {
      // Show Static Value
      jsx = (
        <>
          {propName}:&nbsp;{args[0]}&nbsp;{' '}
        </>
      );
    }
    return jsx;
  }
} // end script element
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
      args,
      isDirty: false
    };
    const isEditable = children ? children.isEditable : false;
    const isDeletable = children ? children.isDeletable : false;
    const StyledPropElement = withStyles(useStylesHOC)(PropElement);
    return (
      <StyledPropElement
        index={index}
        key={index}
        state={state}
        isEditable={isEditable}
        isDeletable={isDeletable}
        serialize={this.serialize}
      />
    );

    // Orig Method wraps a line number around the property
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
