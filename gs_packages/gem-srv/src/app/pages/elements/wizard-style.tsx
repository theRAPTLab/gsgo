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
  whiteSpace: 'pre',
  overflowY: 'scroll',
  overflowX: 'none',
  backgroundColor: '#2d2d2d'
};
export const sRight = {
  gridColumn: '2 / 3',
  // extra styling
  padding: PAD,
  overflowY: 'scroll',
  overflowX: 'none'
};
export const sRightGrid = {
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  height: '100%'
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

/// BOX STYLING CSS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sError = {
  textAlign: 'right',
  backgroundColor: 'red',
  color: 'white'
};
