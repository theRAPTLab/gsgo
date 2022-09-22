/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  FILE NAMING UTILITIES

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/// UTILITY METHODS ///////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return an object with values from nanosecond-resolution timer as
 *  both {time_sec,time_nsec} and {nsec_now}, Use nsec_now if you just want
 *  a number that is a single number. The nanoseconds value can be a
 *  fractional value.
 */
function m_GetNanoTimeProps() {
  if (process === undefined)
    return {
      error: 'nanotime available on server-side only',
      time_sec: 'error',
      time_nsec: 'error',
      nsec_now: 'error'
    };
  let hrt = process.hrtime();
  let nsecs = Math.floor(hrt[0] * 1e9 + hrt[1]);
  return {
    time_sec: hrt[0],
    time_nsec: hrt[1],
    nsec_now: nsecs
  };
}

/// TIME/DATE STRINGS /////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return date string 'HH:MM:SS' for */
function strTimeStamp() {
  let date = new Date();
  let hh = `0${date.getHours()}`.slice(-2);
  let mm = `0${date.getMinutes()}`.slice(-2);
  let ss = `0${date.getSeconds()}`.slice(-2);
  return `${hh}:${mm}:${ss}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return date string 'HH:MM:SS:MS' for */
function strTimeStampMS() {
  let date = new Date();
  let hh = `0${date.getHours()}`.slice(-2);
  let mm = `0${date.getMinutes()}`.slice(-2);
  let ss = `0${date.getSeconds()}`.slice(-2);
  let ms = `0${date.getMilliseconds()}`;
  return `${hh}:${mm}:${ss}:${ms}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return date string YYYY/MM/DD WEEKDAY for use as a prefix in log file
 *  content
 */
function strDateStamp() {
  let date = new Date();
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let dd = `0${date.getDate()}`.slice(-2);
  let day = WEEKDAYS[date.getDay()];
  let yyyy = date.getFullYear();
  return `${yyyy}/${mm}/${dd} ${day}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return date-time-args filename YYYY-MMDD-args-HHMMSS, where args is
 *  the string parameters passed to this function separated by hyphens.
 *  This creates filenames that group by DATE, filetype, and then time
 *  of creation.
 */
function strTimeDatedFilename(...args) {
  // construct filename
  let date = new Date();
  let dd = `0${date.getDate()}`.slice(-2);
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let hms = `0${date.getHours()}`.slice(-2);
  hms += `0${date.getMinutes()}`.slice(-2);
  hms += `0${date.getSeconds()}`.slice(-2);
  let filename;
  filename = date.getFullYear().toString();
  filename += `-${mm}${dd}`;
  let c = arguments.length;
  if (c) filename = filename.concat('-', ...args);
  filename += `-${hms}`;
  return filename;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return a string of integer nanoseconds from the high resolution timer */
function strNanoTimeStamp() {
  // get high resolution time
  const { now_ns } = m_GetNanoTimeProps();
  const val = Math.floor(now_ns);
  return val.toString();
}

/// MODULE EXPORTS ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  // string time/date stamps
  strTimeStamp,
  strTimeStampMS,
  strDateStamp,
  strNanoTimeStamp,
  strTimeDatedFilename,
  // compatibility
  TimeStamp: strTimeStamp,
  TimeStampMS: strTimeStampMS,
  DateStamp: strDateStamp,
  DatedFilename: strTimeDatedFilename
};
