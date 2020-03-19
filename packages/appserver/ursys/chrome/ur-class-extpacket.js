/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Message packets for communication with MEME EXTENSION.
  Its most critical functions are:
  (1) create a packet from a raw object when receiving on the wire
  (2) lookup a sent packet that has returned by id, resolving pending promise,
      and then calling callback function with data

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

let m_packet_count = 0;
let m_transactions = new Map();

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ExtPacket {
  constructor(aobj, data) {
    // normal constructor
    if (typeof aobj === 'string') {
      this.id = `EXTPKT-${++m_packet_count}`;
      const detail = { action: aobj, id: this.id, data };
      this.event = new CustomEvent('MEME_EXT', { detail });
      this.event.source = 'URSYS';
    }
    // construct from anonymous object
    // { action, id, ... params }
    if (typeof aobj === 'object' && data === undefined) {
      this.id = aobj.id;
      const { action, id, data } = aobj;
      const detail = { action, id, data };
      this.event = new CustomEvent('MEME_EXT', { detail });
      this.event.source = 'URSYS';
    }
  }

  /** saves a function in m_transactions[id] to resolve later
   */
  PromiseDispatch() {
    let p = new Promise((resolve, reject) => {
      if (m_transactions.has(this.id)) reject(Error(`epkt ${this.id} already dispatched`));
      // save a function to resolve this promise later
      else
        m_transactions.set(this.id, (data) => {
          resolve(data);
        });
    });
    this.Dispatch();
    return p;
  }

  /** lookup function in m_transactions[id] and resolve promise
   *  if this was a returning packet
   */
  DeliverReturn() {
    const resolverFunc = m_transactions.get(this.id);
    if (typeof resolverFunc !== 'function') return;
    resolverFunc(this.event.detail.data);
    m_transactions.delete(this.id);
  }

  Dispatch() {
    document.dispatchEvent(this.event);
  }

  Action() {
    return this.event.detail.action.toUpperCase();
  }

  Data() {
    if (!this.event.detail.data) console.warn(`${this.id} has no event.detail.data`);
    return this.event.detail.data || {};
  }
}

export default ExtPacket;
