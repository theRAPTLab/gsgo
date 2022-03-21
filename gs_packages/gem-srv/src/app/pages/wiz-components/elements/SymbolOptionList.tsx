/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\



\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const sTopAlign = { verticalAlign: 'top' };

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SymbolOptionList(props) {
  const { label, items, unitText } = props;
  const [sel, setSel] = React.useState(unitText);
  const changeValue = e => {
    e.preventDefault();
    e.stopPropagation();
    setSel(e.value);
  };
  let options = items.map(i => {
    return (
      <option key={i} value={i}>
        {i}
      </option>
    );
  });
  return (
    <label>
      {label}
      <select value={sel} onChange={changeValue}>
        {options}
      </select>
    </label>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SymbolOptionList;
