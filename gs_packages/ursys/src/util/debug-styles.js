/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ANSI TERMINAL color codes and utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IS_NODE = typeof window === 'undefined';
const DEFAULT_PADDING = IS_NODE
  ? 10 // nodejs
  : 0; // not nodejs

const TERM_COLORS = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  //
  Black: '\x1b[30m',
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',
  //
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgPurple: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m',
  //
  TagBlue: '\x1b[34m',
  TagGray: '\x1b[2m',
  TagYellow: '\x1b[33m'
};

const CSS_PAD = 'padding:3px 5px;border-radius:2px';
const CSS_TAB = '4px';

const CSS_COLORS = {
  Reset: 'color:auto;background-color:auto',
  //
  Black: 'color:black',
  Red: 'color:red',
  Green: 'color:green',
  Yellow: 'color:orange',
  Blue: 'color:blue',
  Magenta: 'color:magenta',
  Cyan: 'color:cyan',
  White: 'color:white',
  //
  TagRed: `color:pink;background-color:#909;${CSS_PAD}`,
  TagGreen: `color:#000;background-color:#cfc;${CSS_PAD}`,
  TagYellow: `color:#000;background-color:#fd9;${CSS_PAD}`,
  TagBlue: `color:#000;background-color:#5bf;${CSS_PAD}`,
  TagPurple: `color:#000;background-color:#fcf;${CSS_PAD}`,
  TagCyan: `color:#000;background-color:#2dd;${CSS_PAD}`,
  TagGray: `color:#999;border:1px solid #ddd;${CSS_PAD}`,
  //
  TagDkGreen: 'color:white;background-color:green',
  TagDkBlue: 'color:white;background-color:blue',
  TagDkRed: 'color:white;background-color:red'
};

const PROMPT_DICT = {
  'UNET': 'TagBlue',
  '_APP': 'TagCyan',
  'SESS': 'TagBlue'
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Pad string to fixed length, with default padding depending on
 *  whether the environment is node or browser
 */
function padPrompt(str, padding = DEFAULT_PADDING) {
  let len = str.length;
  if (IS_NODE) return `${str.padEnd(padding, ' ')}`;
  // must be non-node environment, so do dynamic string adjust
  if (padding === 0) return `${str}`;
  // if this far, then we're truncating
  if (len >= padding) str = str.substr(0, padding - 1);
  else str.padEnd(padding, ' ');
  return `${str}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a function that will prompt strings for you
 */
function makePrompt(prompt) {
  const defcol = PROMPT_DICT[prompt] || 'TagGray';
  const color = IS_NODE ? TERM_COLORS[defcol] : CSS_COLORS[defcol];
  const reset = IS_NODE ? TERM_COLORS.Reset : CSS_COLORS.Reset;
  return IS_NODE
    ? str => [`${color}${padPrompt(prompt)}${reset} - ${str}`]
    : str => [`%c${padPrompt(prompt)}%c ${str}`, color, reset];
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TERM: TERM_COLORS,
  CSS: CSS_COLORS,
  padPrompt,
  makePrompt
};
