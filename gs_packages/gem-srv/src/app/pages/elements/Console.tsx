/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Console

  A text console for debugging stuff

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import TextBuffer, { GetTextBuffer } from 'lib/class-textbuffer';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyProps = {
  name: string; // name of the console instance
  buffer: TextBuffer;
  rows: number;
  showCLI: boolean;
};
type MyState = {
  consoleText: string; // text to show in textarea
};
class Console extends React.Component<MyProps, MyState> {
  name: string;
  buffer: TextBuffer;
  constructor(props) {
    super(props);
    let { name, rows, value } = props;
    this.name = name;
    this.buffer = GetTextBuffer(name);
    if (typeof value === 'string') value = [value];
    else if (value === undefined) value = [];
    if (!Array.isArray(value)) throw Error('prop value must be array');
    this.buffer.set(value);
    this.state = {
      consoleText: this.buffer.text()
    };

    this.updateConsole = this.updateConsole.bind(this);
  }

  componentDidMount() {
    this.buffer.subscribe(this.updateConsole);
  }
  componentWillUnmount() {
    this.buffer.unsubscribe(this.updateConsole);
  }
  getBuffer() {
    return this.buffer;
  }
  getText() {
    return this.buffer.text();
  }
  setBuffer(buf: string[]) {
    this.buffer.set(buf);
    this.updateConsole();
  }
  updateConsole(text?: string) {
    if (text === undefined) text = this.buffer.text();
    this.setState({ consoleText: text });
  }
  handleKey(e) {
    const { key } = e;
    if (key === 'Enter') {
      const { value } = e.target;
      if (value.trim() === '') return;
      this.printLine(value);
      this.updateConsole();
      e.target.value = '';
    }
  }
  clearBuffer() {
    this.buffer.clear();
    this.updateConsole();
  }
  printString(str: string) {
    if (typeof str !== 'string') return;
    this.buffer.printString(str);
    this.updateConsole();
  }
  printLine(line: string) {
    if (typeof line !== 'string') return;
    this.buffer.printLine(line);
    this.updateConsole();
  }
  render() {
    const { consoleText } = this.state;
    const { showCLI } = this.props;
    const { rows } = this.props;
    const console = (
      <textarea
        name="console"
        style={{ padding: '0 6px', fontFamily: 'monospace', width: '100%' }}
        rows={rows}
        value={consoleText}
        readOnly
      />
    );
    const input = showCLI ? (
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

/// DEBUGGERS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool({
  get_buffer: name => GetTextBuffer(name)
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Console;
