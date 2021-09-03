/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  File utilities for managing session-related runtime data like recordings,
  video, screenshots...

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const FILE = require('./files');

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Based on http://stackoverflow.com/questions/25460574/
 *  returns an object with files:recfiles, number of files, and
 *  the highest count found.
 */
function RecordingsInDirectory(dirpath) {
  // this regex looks for 4-digit named group "seq" followed
  // by a dash and ending with a .rec extension
  const regex = /^(?<seq>\d{4})-.*\.rec$/;
  const files = FILE.GetDirContent(dirpath);
  const recfiles = [];
  if (files === undefined) return undefined;
  let count = 0;
  let highest = 0;
  for (const f of files) {
    const m = f.match(regex);
    const seqnum = m.group.seq;
    if (seqnum) {
      count++;
      highest = Math.max(seqnum, highest);
      recfiles.push({ prefix: seqnum, file: f });
    }
  }
  return {
    count,
    highest,
    files: recfiles
  };
}

/// EXPORT MODULE /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  RecordingsInDirectory
};
