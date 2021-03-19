/* eslint-disable @typescript-eslint/no-shadow */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ANSI TERMINAL color codes and utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const IS_NODE = typeof window === 'undefined';
const IS_MOBILE =
  !IS_NODE &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
if (IS_MOBILE) {
  console.log('PROMPTS: DETECTED MOBILE BROWSER');
} else if (!IS_NODE) console.log('PROMPTS: DETECTED DESKTOP BROWSER');
else console.log('PROMPTS       DETECTED NODE');

const DEFAULT_PADDING = IS_NODE
  ? 10 // nodejs
  : 0; // not nodejs
const DEFAULT_COLOR = 'TagNull';
const CSS_PAD = 'padding:3px 5px;border-radius:2px';
const CSS_TAB = '4px';

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
  TagGreen: '\x1b[42;30m',
  TagCyan: '\x1b[46;37m',
  TagBlue: '\x1b[44;37m',
  TagPurple: '\x1b[45;37m',
  TagPink: '\x1b[105;1m',
  TagGray: '\x1b[100;37m',
  TagNull: '\x1b[2;37m'
};

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
  TagGray: `color:#fff;background-color:#999;${CSS_PAD}`,
  TagNull: `color:#999;border:1px solid #ddd;${CSS_PAD}`,
  // COLOR BACKGROUND DARK (BROWSER ONLY)
  TagDkRed: `color:white;background-color:red;${CSS_PAD}`,
  TagDkGreen: `color:white;background-color:green;${CSS_PAD}`,
  TagDkBlue: `color:white;background-color:blue;${CSS_PAD}`,
  TagDkOrange: `color:white;background-color:orange;${CSS_PAD}`
};

TERM_COLORS.TagSystem = TERM_COLORS.TagGray;
TERM_COLORS.TagUR = TERM_COLORS.TagBlue;
TERM_COLORS.TagNetwork = TERM_COLORS.TagCyan;
TERM_COLORS.TagApp = TERM_COLORS.TagPink;
TERM_COLORS.TagTest = TERM_COLORS.TagRed;
TERM_COLORS.TagDebug = TERM_COLORS.TagRed;
TERM_COLORS.TagData = TERM_COLORS.TagGreen;
TERM_COLORS.TagInput = TERM_COLORS.TagBlue;

CSS_COLORS.TagSystem = CSS_COLORS.TagGray;
CSS_COLORS.TagUR = `color:#fff;background-color:CornflowerBlue;${CSS_PAD}`;
CSS_COLORS.TagUR2 = `color:#fff;background-color:Navy;${CSS_PAD}`;
CSS_COLORS.TagNetwork = CSS_COLORS.TagCyan;
CSS_COLORS.TagApp = CSS_COLORS.TagPink;
CSS_COLORS.TagTest = CSS_COLORS.TagRed;
CSS_COLORS.TagDebug = `color:#fff;background-color:IndianRed;${CSS_PAD}`;
CSS_COLORS.TagData = CSS_COLORS.TagDkOrange;
CSS_COLORS.TagInput = CSS_COLORS.TagDkOrange;
CSS_COLORS.TagHook = `color:#fff;background-color:MediumSlateBlue;${CSS_PAD}`;
CSS_COLORS.TagOnPhase = `color:#fff;background-color:MediumVioletRed;${CSS_PAD}`;
CSS_COLORS.TagRainbow = `color:#fff;background:linear-gradient(
  45deg,
  rgba(255, 0, 0, 1) 0%,
  rgba(255, 154, 0, 1) 10%,
  rgba(208, 222, 33, 1) 20%,
  rgba(79, 220, 74, 1) 30%,
  rgba(63, 218, 216, 1) 40%,
  rgba(47, 201, 226, 1) 50%,
  rgba(28, 127, 238, 1) 60%,
  rgba(95, 21, 242, 1) 70%,
  rgba(186, 12, 248, 1) 80%,
  rgba(251, 7, 217, 1) 90%,
  rgba(255, 0, 0, 1) 100%
);${CSS_PAD}`;

// div console
const HTCONSOLES = {};

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
/** add a color to the PROMPT_DICT for a particular PREFIX */
function m_SetPromptColors(match, color = DEFAULT_COLOR) {
  if (typeof match !== 'string') throw Error('match prompt must be string');
  match = match.trim();
  if (match === '') throw Error('match prompt cannot be empty');
  let colorTable = IS_NODE ? TERM_COLORS : CSS_COLORS;
  let validColor = false;
  validColor = colorTable[color] !== undefined;
  if (!validColor) throw Error(`prompt color ${color} is not defined`);
  // turn on color prompt
  PROMPT_DICT[match] = [true, color];
  return colorTable;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Based on current detected enviroment, return either ANSI terminal or
 *  css based color markers for use in debugging messages. If tagColor is
 *  defined and corresponds to color definition, it is used to set the color.
 *  This is so users can set their own color prompts without editing
 *  PROMPTS_DICT structure.
 */
function m_GetEnvColor(prompt, tagColor) {
  const colorTable = m_SetPromptColors(prompt, tagColor);
  const [dbg_mode, defcol] = PROMPT_DICT[prompt.trim()] || [SHOW, DEFAULT_COLOR];
  const ucolor = colorTable[tagColor];
  const dcolor = colorTable[defcol];
  const color = ucolor || dcolor;
  const reset = colorTable.Reset;
  return [dbg_mode, color, reset];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns an array suitable for destructuring inside console.log() in
 *  either Node or the browser with color
 */
function m_MakeColorArray(prompt, colorName) {
  const [dbg, color, reset] = m_GetEnvColor(prompt, colorName);
  // return empty array if debugging disabled in browser
  // or debugging is enabled but it's node (de morgan's law)
  if (!(dbg || IS_NODE)) return [];
  return IS_NODE
    ? [`${color}${padString(prompt)}${reset}   `] // server
    : [`%c${padString(prompt)}%c `, color, reset]; // browser
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns an environment-specific color wrapper function suitable for use
 *  in debug output
 */
function m_MakeColorPromptFunction(prompt, colorName, resetName = 'Reset') {
  return IS_NODE
    ? (str, ...args) => {
        if (args === undefined) args = '';
        console.log(
          `${TERM_COLORS[colorName]}${padString(prompt)}${TERM_COLORS.Reset}${
            TERM_COLORS[resetName]
          }    ${str}`,
          ...args
        );
      }
    : (str, ...args) => {
        if (args === undefined) args = '';
        console.log(
          `%c${padString(prompt)}%c%c ${str}`,
          CSS_COLORS.Reset,
          CSS_COLORS[resetName],
          ...args
        );
      };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetDivText(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.log(`GetDivText: element ${id} does not exist`);
    return undefined;
  }
  const text = el.textContent;
  if (text === undefined) {
    console.log(`HTMLTextOut: element ${id} does not have textContent`);
    return {};
  }
  el.style.whiteSpace = 'pre';
  el.style.fontFamily = 'monospace';
  return { element: el, text };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HTMLTextJumpRow(row, lineBuffer, id) {
  const { element, text } = m_GetDivText(id);
  if (text === undefined) return lineBuffer;
  // convert content to line buffer
  if (lineBuffer.length === 0) {
    console.log(`initializing linebuffer from element id='${id}'`);
    lineBuffer = text.split('\n'); // creates a NEW array
  }
  // handle line underflow in buffer if row exceeds line buffer
  if (row > lineBuffer.length - 1) {
    const count = row + 1 - lineBuffer.length;
    for (let i = count; i > 0; i--) lineBuffer.push('');
  }
  return lineBuffer;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_HTMLTextPrint(str = '', lineBuffer, id) {
  const { element, text } = m_GetDivText(id);
  if (!text) return lineBuffer;
  // append text
  lineBuffer.push(str);
  element.textContent = lineBuffer.join('\n');
  return lineBuffer;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Function to modify the text area of a passed HTML element. Always return
 *  lineBuffer so we can reassign the reference, as the array often changes.
 */
function m_HTMLTextPlot(str = '', lineBuffer, id, row = 0, col = 0) {
  const { element, text } = m_GetDivText(id);
  if (!element) return lineBuffer;
  if (text === undefined) {
    console.log(`HTMLTextOut: element ${id} does not have textContent`);
    return lineBuffer;
  }
  // ensure row exists
  lineBuffer = m_HTMLTextJumpRow(row, lineBuffer, id);
  // fetch line
  let line = lineBuffer[row];
  if (line === undefined) {
    console.log(`HTMLTextOut: unexpected line error for line ${row}`);
    return lineBuffer;
  }
  // handle column underflow in line if col exceeds line length
  if (col + str.length > line.length + str.length) {
    for (let i = 0; i < col + str.length - line.length; i++) line += ' ';
  }
  // insert str into line
  let p1 = line.substr(0, col);
  let p3 = line.substr(col + str.length, line.length - (col + str.length));
  lineBuffer[row] = `${p1}${str}${p3}`;
  // write buffer back out
  element.textContent = lineBuffer.join('\n');
  return lineBuffer;
}

/// API METHODS ///////////////////////////////////////////////////////////////
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** allow modification of the PROMPT_DICT
 */
function makeStyleFormatter(prompt, tagColor) {
  let outArray = m_MakeColorArray(prompt, tagColor);
  if (outArray.length === 0) return () => [];
  if (IS_MOBILE) outArray = [`${prompt}:`];
  return (str, ...args) => [...outArray, str, ...args];
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function colorTagString(str, tagColor) {
  return m_MakeColorArray(str, tagColor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return function to directly print to console instead of returning an array.
 *  This works better for NodeJS since the empty [] still results in output
 *  unlike the browser. Use makeStyleFormatter for browsers
 */
function makeTerminalOut(prompt, tagColor = DEFAULT_COLOR) {
  const wrap = m_MakeColorPromptFunction(prompt, tagColor);
  wrap.warn = m_MakeColorPromptFunction(prompt, 'TagGreen', 'Green');
  wrap.error = m_MakeColorPromptFunction(prompt, 'TagRed', 'Red');
  return wrap;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Return function to print a string, given a DIV id and optional row/column.
 */
function makeHTMLConsole(divId, row = 0, col = 0) {
  const ERP = makeStyleFormatter('makeHTMLConsole', 'Red');
  let buffer = [];
  if (typeof divId !== 'string') throw Error('bad id');
  if (!document.getElementById(divId)) {
    console.log(...ERP(`id '${divId}' doesn't exist`));
    return {
      print: () => {},
      plot: () => {},
      clear: () => {},
      gotoRow: () => {}
    };
  }
  let hcon;
  if (HTCONSOLES[divId]) {
    hcon = HTCONSOLES[divId];
  } else {
    hcon = {
      buffer: [],
      plot: (str, y = row, x = col) => {
        buffer = m_HTMLTextPlot(str, buffer, divId, y, x);
      },
      print: str => {
        buffer = m_HTMLTextPrint(str, buffer, divId);
      },
      clear: (startRow = 0, endRow = buffer.length) => {
        buffer.splice(startRow, endRow);
      },
      gotoRow: row => {
        buffer = m_HTMLTextJumpRow(row, buffer, divId);
      }
    };
    HTCONSOLES[divId] = hcon;
  }
  return hcon;
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
  makeHTMLConsole,
  printTagColors,
  colorTagString
};
