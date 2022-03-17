/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Console

  A text console for debugging stuff

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import UR from '@gemstep/ursys/client';
import TextBuffer, { GetTextBuffer } from 'lib/class-textbuffer';
import { StackUnit } from './WizElementLibrary';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type MyProps = {
  name: string; // name of the console instance
  buffer: TextBuffer;
  rows: number;
  showCLI: boolean;
  title: string;
};
type MyState = {
  consoleText: string; // text to show in textarea
};
class Console extends React.Component<MyProps, MyState> {
  buffer: TextBuffer;
  textRef = React.createRef<HTMLTextAreaElement>();
  constructor(props) {
    super(props);
    let { name, rows, title, value } = props;
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
  componentDidUpdate() {
    this.textRef.current.scrollTop = this.textRef.current.scrollHeight;
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
    const { showCLI, title } = this.props;
    const { rows } = this.props;

    const gWiz = {
      boxSizing: 'border-box',
      display: 'inline-block',
      padding: '4px 12px',
      margin: '1px 1px',
      userSelect: 'none'
    };

    const console = (
      <textarea
        name="console"
        ref={this.textRef}
        style={{
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
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
      <StackUnit
        label={title}
        open
        style={{
          backgroundColor: 'rgba(200,128,0,0.08)'
        }}
      >
        {console}
        {input}
      </StackUnit>
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
