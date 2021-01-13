/////////////////////////////////////////////////////////////////////////////
/**	UTILITY FUNCTIONS ******************************************************/
// enums for outputing dates
const e_weekday = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function getTimeStamp() {
  let date = new Date();
  let hh = `0${date.getHours()}`.slice(-2);
  let mm = `0${date.getMinutes()}`.slice(-2);
  let ss = `0${date.getSeconds()}`.slice(-2);
  return `${hh}:${mm}:${ss}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function str_DateStamp() {
  let date = new Date();
  let mm = `0${date.getMonth() + 1}`.slice(-2);
  let dd = `0${date.getDate()}`.slice(-2);
  let day = e_weekday[date.getDay()];
  let yyyy = date.getFullYear();
  return `${yyyy}/${mm}/${dd} ${day}`;
}
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 *  return a filename of form YYYY-MMDD-args-separated-by-dashes-HHMMSS
 */
function str_TimeDatedFilename(...args) {
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

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  TimeStamp: getTimeStamp,
  DateStamp: str_DateStamp,
  DatedFilename: str_TimeDatedFilename
};
