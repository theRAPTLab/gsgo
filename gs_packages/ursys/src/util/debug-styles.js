/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ANSI TERMINAL color codes and utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IS_NODE =
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node';

const PAD_SIZE = IS_NODE
  ? 13 // nodejs
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
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
};

const CSS_COLORS = {
  Reset: 'color:auto;background-color:auto',
  Pad: 'padding:0 4px',
  Tab: '4px',
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
  BgPurple: 'color:#000;background-color:#fcf',
  BgRed: 'color:pink;background-color:#909',
  BgBlue: 'color:#000;background-color:#cdf',
  BgGreen: 'color:#000;background-color:#cfc',
  BgYellow: 'color:#000;background-color:#ffdd99',
  BgGray: 'color:#000;background-color:#c0c0c0',
  BgDkGreen: 'color:white;background-color:green',
  BgDkBlue: 'color:white;background-color:blue',
  BgDkRed: 'color:white;background-color:red'
};

const PROMPT_DICT = {
  'UR.NET': 'Blue'
};

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Pad string to fixed length, with default padding depending on
 *  whether the environment is node or browser
 */
function padPrompt(str, padding = PAD_SIZE) {
  let len = str.length;
  if (IS_NODE) return `${str.padEnd(padding, ' ')}`;
  // must be non-node environment, so do dynamic string adjust
  if (padding === 0) return `${str}`;
  // if this far, then we're truncating
  if (len >= padding) str = str.substr(0, padding - 1);
  else str.padEnd(padding, ' ');
  return `${str}:`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return a function that will prompt strings for you
 */
function makePrompt(prompt) {
  const defcol = PROMPT_DICT[prompt] || 'Reset';
  const color = defcol && IS_NODE ? TERM_COLORS[defcol] : CSS_COLORS[defcol];
  const reset = IS_NODE ? TERM_COLORS.Reset : CSS_COLORS.Reset;
  return IS_NODE
    ? str => [`${color}${padPrompt(prompt)}${reset} - ${str}`]
    : str => [`%c${padPrompt(prompt)}%c - ${str}`, color, reset];
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TERM: TERM_COLORS,
  CSS: CSS_COLORS,
  padPrompt,
  makePrompt
};
