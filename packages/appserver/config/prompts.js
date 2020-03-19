/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String Prompts for server console

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

let PROMPTS = {};

/// CONSTANTS /////////////////////////////////////////////////////////////////
/// detect node environment and set padsize accordingly
const IS_NODE =
  typeof process !== 'undefined' && process.release && process.release.name === 'node';
let PAD_SIZE = IS_NODE
  ? 13 // nodejs
  : 0; // not nodejs

const TERM = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  FgBlack: '\x1b[30m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
  FgMagenta: '\x1b[35m',
  FgCyan: '\x1b[36m',
  FgWhite: '\x1b[37m',
  BgBlack: '\x1b[40m',
  BgRed: '\x1b[41m',
  BgGreen: '\x1b[42m',
  BgYellow: '\x1b[43m',
  BgBlue: '\x1b[44m',
  BgMagenta: '\x1b[45m',
  BgCyan: '\x1b[46m',
  BgWhite: '\x1b[47m'
};

/// PROMPT STRING HELPERS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ return a string padded to work as a prompt for either browser or node
    console output
/*/ PROMPTS.Pad = (
  prompt = '',
  psize = PAD_SIZE
) => {
  let len = prompt.length;
  if (IS_NODE) return `${prompt.padEnd(psize, ' ')}-`;
  // must be non-node environment, so do dynamic string adjust
  if (!psize) return `${prompt}:`;
  // if this far, then we're truncating
  if (len >= psize) prompt = prompt.substr(0, psize - 1);
  else prompt.padEnd(psize, ' ');
  return `${prompt}:`;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ returns PAD_SIZE stars
/*/ PROMPTS.Stars = count => {
  if (count !== undefined) return ''.padEnd(count, '*');
  return ''.padEnd(PAD_SIZE, '*');
};

PROMPTS.TR = TERM.Reset;
PROMPTS.BR = TERM.Bright;
PROMPTS.CWARN = TERM.FgYellow;
PROMPTS.CCRIT = TERM.BgRed + TERM.FgWhite + TERM.Bright;
PROMPTS.CINFO = TERM.BgBlue + TERM.FgWhite;
PROMPTS.TERM_URSYS = TERM.FgBlue + TERM.Bright;
PROMPTS.TERM_DB = TERM.FgBlue; // server-database
PROMPTS.TERM_NET = TERM.FgBlue; // server-network
PROMPTS.TERM_EXP = TERM.FgMagenta; // server-express
PROMPTS.TERM_WPACK = TERM.FgGreen; // webpack configurations
PROMPTS.CW = TERM.FgGreen; // webpack configurations
PROMPTS.CY = TERM.FgYellow;
PROMPTS.TERM = TERM;

PROMPTS.CS = '\x1b[34m\x1b[1m';
PROMPTS.CW = '\x1b[32m';
PROMPTS.CR = '\x1b[0m';

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = PROMPTS;
