/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  String utilities for common file naming operations.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// STRING FORMATTERS /////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a stringified integer padded with leading zeros, useful for writing
 *  sequentially-numbered files.
 *  note: String.padStart() and padEnd() make this somewhat redundant.
 */
function fZeroPad(num, numDigits = 5) {
  if (typeof num !== 'number') return `nan:${num}`;
  const s = String(num);
  return s.padStart(numDigits, '0');
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // numeric zero padding
  fZeroPad
};
