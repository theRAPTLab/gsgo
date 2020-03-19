const blessed = require('blessed');
const fs = require('fs');
const tty = require('tty');

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

function Init() {
  const ttyFd = fs.openSync('/dev/tty', 'r+');

  const program = blessed.program({
    input: tty.ReadStream(ttyFd),
    output: tty.WriteStream(ttyFd)
  });

  // Create a screen object.
  const screen = blessed.screen({
    program,
    smartCSR: true
  });

  // Create a box perfectly centered horizontally and vertically.
  const box = blessed.box({
    top: '0',
    left: '0',
    width: '100%',
    height: 3,
    content: '{bold}MEME DEVELOPER PANEL{/bold} - CTRL-C TO EXIT',
    tags: true,
    padding: {
      top: 1,
      left: 2,
      right: 2,
      bottom: 1
    },
    style: {
      fg: 'white',
      bg: '#505050',
      border: {
        fg: '#f0f0f0'
      },
      hover: {
        bg: 'green'
      }
    }
  });

  // Append our box to the screen.
  screen.append(box);

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    return process.exit(0);
  });

  // Focus our element.
  box.focus();

  // Render the screen.
  screen.render();
}

module.exports = { Init, TERM };
