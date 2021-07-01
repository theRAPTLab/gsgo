/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Script UI for GVars

  Used by `prop.tsx` and `featProp.tsx`

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from 'app/pages/elements/page-xui-styles';
import InputElement from './InputElement';
import SelectElement from './SelectElement';

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PANELSCRIPT');
const DBG = false;

/// REACT COMPONENT ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyState = {};
type MyProps = {
  index: number; // script line number
  state: MyState;
  propName: string;
  propMethod: string;
  propNameOptions: any[];
  propMethodsMap: Map<string, string[]>; // key = method type, val = [methods]
  args: any[];
  onSelectProp: Function;
  onSelectMethod: Function;
  onValueChange: Function;
  onSaveData: Function;
  classes: Object;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class GVarElement extends React.Component<MyProps, MyState> {
  index: number; // ui index
  keyword: string; // keyword
  constructor(props: MyProps) {
    super(props);
    const { index, state } = props;
    this.index = index;
    this.state = { ...state }; // copy state prop
  }

  componentDidMount() {}

  render() {
    if (DBG) console.log(...PR('render'));
    const {
      propName,
      propNameOptions,
      propMethod,
      propMethodsMap,
      args,
      index,
      onSelectProp,
      onSelectMethod,
      onValueChange,
      onSaveData
    } = this.props;

    // get options for property names
    const propNames = propNameOptions.map(p => p.name);

    // get options for method names
    const selectedProp = propNameOptions.find(p => p.name === propName);
    const gVarType = selectedProp ? selectedProp.type : undefined;
    const propMethodOptions = gVarType ? propMethodsMap.get(gVarType) : undefined;

    return (
      <>
        <SelectElement
          state={this.state}
          value={propName}
          options={propNames}
          selectMessage="-- Select a property... --"
          onChange={onSelectProp}
          index={index}
        />
        <SelectElement
          state={this.state}
          value={propMethod}
          options={propMethodOptions}
          selectMessage="-- Select a method... --"
          onChange={onSelectMethod}
          index={index}
        />
        {args.map((arg, i) => (
          <InputElement
            state={this.state}
            type={gVarType}
            onChange={onValueChange}
            onSave={onSaveData}
            index={index}
            argindex={i}
            key={i}
          />
        ))}
      </>
    );
  }
}

export default withStyles(useStylesHOC)(GVarElement);
