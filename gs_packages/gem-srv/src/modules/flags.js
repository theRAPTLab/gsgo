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

export default FLAGS;
