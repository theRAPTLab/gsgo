const BUFFERS: Map<string, TextBuffer> = new Map();

class TextBuffer {
  name: string;
  buffer: string[];
  subs: Set<Function>;
  constructor(name: string) {
    if (BUFFERS.has(name)) throw Error(`buffer ${name} already exists`);
    this.name = name;
    this.buffer = [];
    this.subs = new Set();
    BUFFERS.set(name, this);
  }
  bufferCopy() {
    return [...this.buffer];
  }
  text() {
    return this.buffer.join('\n');
  }
  set(buf: string[]) {
    this.buffer = buf;
    this.notify();
  }
  clear() {
    this.buffer = [];
    this.notify();
  }
  printString(str: string) {
    if (typeof str !== 'string') return;
    const lastLine = this.buffer.length - 1;
    this.buffer[lastLine] += str;
    this.notify();
  }
  printLine(line: string) {
    if (typeof line !== 'string') return;
    this.buffer.push(line);
    this.notify();
  }
  subscribe(handler: Function) {
    this.subs.add(handler);
  }
  unsubscribe(handler: Function) {
    this.subs.delete(handler);
  }
  notify() {
    // fire in the next event cycle, not this one, to prevent
    // react errors
    setTimeout(() => this.subs.forEach(h => h(this.text())));
  }
}

/** returns an instance of TextBuffer, creating as necessary */
function GetTextBuffer(name: string) {
  if (typeof name !== 'string') throw Error('bad name');
  if (name === '') throw Error('name must not be empty string');
  if (!BUFFERS.has(name)) BUFFERS.set(name, new TextBuffer(name));
  return BUFFERS.get(name);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default TextBuffer;
export { GetTextBuffer };
