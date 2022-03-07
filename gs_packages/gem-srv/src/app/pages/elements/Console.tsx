/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Console

  A text console for debugging stuff

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import * as WIZCORE from 'modules/appcore/ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const CONSOLES: Map<string, Console> = new Map();

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyProps = {
  name: string; // name of the console instance
};
type MyState = {
  consoleText: string; // text to show in textarea
  showInput: boolean; // whether to show the input box
};
class Console extends React.Component<MyProps, MyState> {
  buffer: string[];
  constructor(props) {
    super(props);
    const { name } = props;
    if (CONSOLES.has(name)) throw Error(`console ${name} already exists`);
    CONSOLES.set(name, this);
    this.buffer = ['command output'];
    this.state = {
      consoleText: this.buffer[0],
      showInput: true
    };
  }

  getBuffer() {
    return [...this.buffer];
  }
  setBuffer(buf: string[]) {
    this.buffer = [...buf];
    this.updateConsole();
  }
  updateConsole() {
    const ctext = this.buffer.join('\n');
    this.setState({ consoleText: ctext });
  }
  handleKey(e) {
    const { key } = e;
    if (key === 'Enter') {
      const { value } = e.target;
      if (value.trim() === '') return;
      this.buffer.push(value);
      this.updateConsole();
      e.target.value = '';
    }
  }
  clearBuffer() {
    this.setBuffer([]);
    this.updateConsole();
  }
  printString(str: string) {
    if (typeof str !== 'string') return;
    const lastLine = this.buffer.length - 1;
    this.buffer[lastLine] += str;
    this.updateConsole();
  }
  printLine(line: string) {
    if (typeof line !== 'string') return;
    this.buffer.push(line);
    this.updateConsole();
  }
  render() {
    const { consoleText, showInput } = this.state;
    const console = (
      <textarea
        name="console"
        style={{ padding: '0 6px', fontFamily: 'monospace', width: '100%' }}
        rows={4}
        value={consoleText}
        readOnly
      />
    );
    const input = showInput ? (
      <input
        type="text"
        name="console_in"
        style={{ padding: '0 6px' }}
        onKeyDown={e => this.handleKey(e)}
      />
    ) : undefined;
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {console}
        {input}
      </div>
    );
  }
}

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** given a name, return a console instance. if the console doesn't already
 *  exist, then return a new instance
 */
function GetConsole(name: string) {
  if (typeof name !== 'string') throw Error('bad name');
  if (name === '') throw Error('name must not be empty string');
  if (CONSOLES.has(name)) return CONSOLES.get(name);
}

UR.AddConsoleTool({
  get_console: name => CONSOLES.get(name)
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { Console, GetConsole };
