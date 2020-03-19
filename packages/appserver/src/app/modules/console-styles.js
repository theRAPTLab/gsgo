/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Defines constants for browser console window, as well as some string
  utilities

  Usage:
    import CCSS from 'App/modules/console-styles';
    const { Q, cssur, cssreset } = CCSS;
    let quoted = Q('string to be quoted');
    console.log('%cURSYS:%c ${quoted}',cssur,cssreset);
    // emits URSYS: 'string to be quoted'

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// BASE CONSTANTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PAD = `padding:0 4px`;
const TAB = `4`;
const redbg = `color:pink;background-color:#909`;
const blue = `color:blue`;
const red = `color:red`;
const purplebg = `color:#000;background-color:#fcf`;
const bluebg = `color:#000;background-color:#cdf`;
const greenbg = `color:#000;background-color:#cfc`;
const yellowbg = `color:black;background-color:#ffdd99`;
const dkgreenbg = `color:white;background-color:green`;
const dkbluebg = `color:white;background-color:blue`;
const dkredbg = `color:white;background-color:red`;
const reset = `color:auto;background-color:auto`;

/// STYLES
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const STYLES = {
  cssur: `${redbg};${PAD}`, // ursys system
  cssuri: `${purplebg};${PAD}`,
  cssinfo: `${bluebg};${PAD}`,
  cssreact: `${greenbg};${PAD}`,
  cssalert: `${yellowbg};${PAD}`,
  cssdraw: `${dkgreenbg};${PAD}`,
  cssdata: `${dkbluebg};;${PAD}`,
  cssreset: `${reset}`,
  csstab: `padding-left:${TAB}px`,
  csstab2: `padding-left:${TAB * 2}px`,
  cssmark: `dkredbg;${PAD}`
};

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns a quoted string
 */
STYLES.Q = (str, delim = '[') => {
  let end;
  switch (delim) {
    case '[':
      end = ']';
      break;
    case "'":
      end = "'";
      break;
    case '<':
      end = '>';
      break;
    default:
      delim = '???';
      end = '???';
      break;
  }
  return `${delim}${str}${end}`;
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default STYLES;
