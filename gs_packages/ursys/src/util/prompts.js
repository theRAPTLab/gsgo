/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ANSI TERMINAL color codes and utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IS_NODE = typeof window === 'undefined';
const DEFAULT_PADDING = IS_NODE
  ? 10 // nodejs
  : 0; // not nodejs

const TERM_COLORS = {
  // TOUT = makeTerminalOut(str); TOUT('hi')
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  //
  Black: '\x1b[30m',
  White: '\x1b[37m',
  Red: '\x1b[31m',
  Yellow: '\x1b[33m',
  Green: '\x1b[32m',
  Cyan: '\x1b[36m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  //
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgYellow: '\x1b[43m',
  BgCyan: '\x1b[46m',
  BgGreen: '\x1b[42m',
  BgBlue: '\x1b[44m',
  BgPurple: '\x1b[45m',
  BgWhite: '\x1b[47m',
  //
  TagYellow: '\x1b[43;30m',
  TagRed: '\x1b[41;37m',
  TagGreen: '\x1b[42;37m',
  TagCyan: '\x1b[46;37m',
  TagBlue: '\x1b[43;37m',
  TagPurple: '\x1b[45;37m',
  TagPink: '\x1b[95;30m',
  TagGray: '\x1b[2;37m',
  TagNull: 'color:#999'
};

const CSS_PAD = 'padding:3px 5px;border-radius:2px';
const CSS_TAB = '4px';

// NAME LIST MUST MATCH TERM_COLORS!
const CSS_COLORS = {
  Reset: 'color:auto;background-color:auto',
  // COLOR FOREGROUND
  Black: 'color:black',
  White: 'color:white',
  Red: 'color:red',
  Yellow: 'color:orange',
  Green: 'color:green',
  Cyan: 'color:cyan',
  Blue: 'color:blue',
  Magenta: 'color:magenta',
  // COLOR BACKGROUND
  TagRed: `color:#000;background-color:#f66;${CSS_PAD}`,
  TagYellow: `color:#000;background-color:#fd4;${CSS_PAD}`,
  TagGreen: `color:#000;background-color:#5c8;${CSS_PAD}`,
  TagCyan: `color:#000;background-color:#2dd;${CSS_PAD}`,
  TagBlue: `color:#000;background-color:#2bf;${CSS_PAD}`,
  TagPurple: `color:#000;background-color:#b6f;${CSS_PAD}`,
  TagPink: `color:#000;background-color:#f9f;${CSS_PAD}`,
  TagGray: `color:#999;border:1px solid #ddd;${CSS_PAD}`,
  TagNull: 'color:#999',
  // COLOR BACKGROUND DARK
  TagDkRed: `color:white;background-color:red;${CSS_PAD}`,
  TagDkGreen: `color:white;background-color:green;${CSS_PAD}`,
  TagDkBlue: `color:white;background-color:blue;${CSS_PAD}`
};

/// OUTPUT CONTROL ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** define
 */
const SHOW = true;
const HIDE = false;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PROMPT_DICT = {
  // URSYS-RELATED MODULES
  'UR': [SHOW, 'TagRed'],
  // SERVERS
  'APPSRV': [SHOW, 'Yellow'],
  'GEMSRV': [SHOW, 'Yellow'],

  // SPECIAL
  '-': [SHOW, 'TagNull']
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Based on current detected enviroment, return either ANSI terminal or
 *  css based color markers for use in debugging messages. If tagColor is
 *  defined and corresponds to color definition, it is used to set the color.
 *  This is so users can set their own color prompts without editing
 *  PROMPTS_DICT structure.
 */
function m_GetEnvColor(prompt, tagColor) {
  const [dbg_mode, defcol] = PROMPT_DICT[prompt.trim()] || [SHOW, 'TagGray'];
  const ucolor = IS_NODE ? TERM_COLORS[tagColor] : CSS_COLORS[tagColor];
  const dcolor = IS_NODE ? TERM_COLORS[defcol] : CSS_COLORS[defcol];
  const color = ucolor || dcolor;
  const reset = IS_NODE ? TERM_COLORS.Reset : CSS_COLORS.Reset;
  return [dbg_mode, color, reset];
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Pad string to fixed length, with default padding depending on
 *  whether the environment is node or browser
 */
function padString(str, padding = DEFAULT_PADDING) {
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
/** Return a function that will prompt strings for you. The function will
 *  returns an array to destructure into console.log().
 *
 *  To create the function, provide a short PROMPT. This will be color coded
 *  according to the PROMPTS_DICT table, or gray otherwise. You can turn off the
 *  debug output for all PROMPTS in a category also for centralized debug
 *  statement control.
 *
 *  The prompt function accepts a string followed by any number of parameters.
 *  It returns an array of values that are destructured inside of console.log()
 *    const promptFunction = makeLoginHelper('APP');
 *    console.log(...promptFunction('huzzah'));
 *
 *  NOTE: This doesn't work as expected on NodeJS, because empty arrays
 *  render as linefeeds so we just output it regardless. If you want to
 *  disable output, use the makeTerminalOut() function instead.
 */
function makeStyleFormatter(prompt, tagColor) {
  const [dbg, color, reset] = m_GetEnvColor(prompt, tagColor);
  // return empty array if debugging disabled in browser
  // or debugging is enabled but it's node (de morgan's law)
  if (!(dbg || IS_NODE)) return () => [];
  // return the appropriate array to deconstructr
  const wrap = IS_NODE
    ? (str, ...args) => {
        return [`${color}${padString(prompt)}${reset}   ${str}`, ...args]; // server
      }
    : (str, ...args) => {
        return [`%c${padString(prompt)}%c ${str}`, color, reset, ...args]; // browser
      };
  return wrap;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Function to directly print to console instead of returning an array. This
 *  works better for NodeJS since the empty [] still results in output unlike
 *  the browser. Use makeStyleFormatter for browsers
 */
function makeTerminalOut(prompt, tagColor) {
  const [dbg, color, reset] = m_GetEnvColor(prompt, tagColor);
  if (!dbg) return () => {};
  const wrap = IS_NODE
    ? (str, ...args) => {
        console.log(`${color}${padString(prompt)}${reset} - ${str}`, ...args);
      }
    : (str, ...args) => {
        console.log(`%c${padString(prompt)}%c ${str}`, color, reset, ...args);
      };
  return wrap;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Print all Tag Colors
 */
function printTagColors() {
  const colortable = IS_NODE ? TERM_COLORS : CSS_COLORS;
  const colors = Object.keys(colortable).filter(element =>
    element.includes('Tag')
  );
  const reset = colortable.Reset;
  const out = 'dbg_colors';
  if (!IS_NODE) console.groupCollapsed(out);
  colors.forEach(key => {
    const color = colortable[key];
    const items = IS_NODE
      ? [`${padString(out)} - (node) ${color}${key}${reset}`]
      : [`(browser) %c${key}%c`, color, reset];
    console.log(...items);
  });
  if (!IS_NODE) console.groupEnd();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TERM: TERM_COLORS,
  CSS: CSS_COLORS,
  padString,
  makeStyleFormatter,
  makeTerminalOut,
  printTagColors
};
