/// DEFAULT SPRITE NAME ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// the sprite is loaded in as-load-sprites constructor
const DEFAULT_SPRITE = 'unknown'; // show a question mark
// const DEFAULT_SPRITE = 'turtle'; // zero angle points right
// const DEFAULT_SPRITE = ''; // don't show a sprite

/// VISUAL EFFECT FLAGS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const FLAGS = {};
// Bitwise flags used for dobj and vobj selection status
FLAGS.SELECTION = {
  SELECTED: 1,
  HOVERED: 2,
  GROUPED: 4,
  CAPTIVE: 8,
  GLOWING: 16,
  LARGEMETER: 32
};
FLAGS.POSITION = {
  OUTSIDE_LEFT: 1,
  INSIDE_LEFT: 2,
  MIDDLE: 4,
  INSIDE_RIGHT: 8,
  OUTSIDE_RIGHT: 16
};

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default FLAGS;
export { DEFAULT_SPRITE };
