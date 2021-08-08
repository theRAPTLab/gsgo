/// MODULE DECLARATION ////////////////////////////////////////////////////////
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

FLAGS.METER = {
  OUTSIDE_LEFT: 1,
  INSIDE_LEFT: 2,
  MIDDLE: 4,
  INSIDE_RIGHT: 8,
  OUTSIDE_RIGHT: 16
};

export default FLAGS;
