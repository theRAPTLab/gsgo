/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Global Style Objects for all Wizard React Elements

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BG_COL = '#ddd';
const PAD = '10px';

/// LAYOUT CSS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sGrid = {
  display: 'grid',
  width: '100vw',
  height: '100vh',
  gridTemplateRows: 'auto 1fr auto',
  gridTemplateColumns: '50% auto' // force
};
export const sHead = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};
export const sLeft = {
  gridColumn: '1 / 2',
  // extra styling
  boxSizing: 'border-box',
  overflowY: 'hidden',
  overflowX: 'none',
  // grid
  display: 'grid',
  gridTemplateRows: '1fr auto' // view+editor stack
};
export const sRight = {
  gridColumn: '2 / 3',
  // extra styling
  whiteSpace: 'pre',
  overflowY: 'scroll',
  overflowX: 'none'
};
export const sFoot = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};

/// GRID LAYOUT CSS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sButtonGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '10px'
};
export const sButtonBreak = {
  gridColumnStart: 1
};

/// LEFT: SCRIPT VIEW /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptView = {
  overflowY: 'scroll',
  overflowX: 'none',
  whiteSpace: 'nowrap'
};

/// LEFT: SCRIPT UNIT EDITOR //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptUnitEditor = {
  backgroundColor: 'rgba(255, 166, 0, 0.10)',
  padding: '10px'
};

/// RIGHT: SCRIPT TEXT EDITOR /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptText = {
  fontSize: '12px',
  lineHeight: 1,
  whiteSpace: 'pre-line',
  // background appearance
  margin: 0,
  borderRadius: 0,
  backgroundColor: '#2d2d2d'
};

/// ERROR BOX STYLING CSS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sError = {
  textAlign: 'right',
  backgroundColor: 'red',
  color: 'white'
};

/// UPPER RIGHT BUTTON CONSOLE STYLING CSS ////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sButtonConsole = {
  position: 'absolute',
  right: '8px',
  top: '8px',
  height: '50px',
  display: 'inline-flex',
  flexDirection: 'row',
  gap: '8px'
};
/// INPUT ELEMENT STYLING /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const buttonStyle = {
  whiteSpace: 'nowrap',
  margin: 0
};
