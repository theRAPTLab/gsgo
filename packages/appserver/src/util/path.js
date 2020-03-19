/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Path Strings
  REGEX approach from https://stackoverflow.com/a/47212224

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const rx_dir = /(.*)\/+([^/]*)$/;
const rx_file = /()(.*)$/;

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the directory portion of a path
/*/
const Parse = str => {
  // [0] original string
  // [1] dirname
  // [2] filename
  return rx_dir.exec(str) || rx_file.exec(str);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the directory portion of a path
/*/
const Dirname = str => {
  // return str.substring(0,str.lastIndexOf("/"));
  return (rx_dir.exec(str) || rx_file.exec(str))[1];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the file portion of a path
/*/
const Basename = str => {
  // return str.substring(str.lastIndexOf("/")+1);
  return (rx_dir.exec(str) || rx_file.exec(str))[2];
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Return the string stripped of extension
/*/
const StripExt = str => {
  return str.substr(0, str.lastIndexOf('.'));
};

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { Parse, Dirname, Basename, StripExt };
