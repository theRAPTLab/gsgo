/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS common detection methods (browser or node)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility to generate the official unique hash for packets in URSYS
 */
function PacketHash(pkt) {
  return `${pkt.getSourceAddress()}:${pkt.id}`;
}

/// ENVIRONMENT DETECTION /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsNode() {
  return typeof window === 'undefined';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsBrowser() {
  return typeof window !== 'undefined';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsElectronRenderer() {
  return (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer'
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function IsElectronMain() {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  );
}
function IsElectron() {
  return IsElectronMain() || IsElectronRenderer();
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // LEGACY...move to NetMessage
  PacketHash,
  // ENVIRONMENT
  IsBrowser,
  IsNode,
  IsElectron,
  IsElectronRenderer,
  IsElectronMain
};
