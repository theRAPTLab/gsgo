/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PRIVATE DECLARATIONS //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false; // module-wide debug flag
const m_channels = new Map(); // map of channels

/// PRIVATE HELPERS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// subscribe to a channel
const Sub = (channel, callback) => {
  if (!channel) throw Error(`channel and callback required`);
  if (typeof channel !== 'string') throw Error(`arg1 must be string`);
  if (typeof callback !== 'function') throw Error(`arg2 must be function`);
  //
  const ch = channel.toUpperCase();
  //
  let subbers = m_channels.get(ch);
  if (!subbers) {
    subbers = [];
    m_channels.set(ch, subbers);
  }
  subbers.push(callback);
  if (DBG) console.log(`added callback for channel ${ch} (${subbers.length} subscribers)`);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// unsubscribe to a channel
const Unsub = (channel, callback) => {
  if (!channel) throw Error(`channel and callback required`);
  if (typeof channel !== 'string') throw Error(`arg1 must be string`);
  if (typeof callback !== 'function') throw Error(`arg2 must be function`);
  //
  const ch = channel.toUpperCase();
  //
  let subbers = m_channels.get(ch);
  if (!subbers) return;
  const filtered = subbers.filter(e => {
    return e !== callback;
  });
  if (filtered.length < subbers.length) {
    if (DBG)
      console.log(`removed ${filtered.length - subbers.length} subscribers from channel ${ch}`);
    m_channels.set(ch, filtered);
  }
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// publish to a channel
const Publish = (channel, data = {}) => {
  if (!channel) throw Error(`channel and callback required`);
  if (typeof channel !== 'string') throw Error(`arg1 must be string`);
  if (typeof data !== 'object') throw Error(`arg2 must be data object`);
  //
  const ch = channel.toUpperCase();
  if (DBG) console.log(`publishing to channel ${ch}`);
  //
  const subbers = m_channels.get(ch) || [];
  subbers.forEach(cb => {
    cb(data);
  });
  if (!DBG) return;
  if (subbers.length) console.log(`notifying ${subbers.length} channel ${ch} subscribers`);
  else console.log(`no subscribers for channel ${ch}`);
};
/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { Sub, Unsub, Publish };
