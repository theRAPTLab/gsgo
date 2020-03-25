/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Reflection and other Object Inspection Utilities

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import STACKTRACE from 'stacktrace-js';
import CCSS from 'app/modules/console-styles';
import PATH from './path';

const { cssalert } = CCSS;

/// INITIALIZE MAIN MODULE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const REFLECT = {};

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns the name of the constructor for the current class
    https://stackoverflow.com/questions/22777181/typescript-get-to-get-class-name-at-runtime
*/
function ExtractClassName(obj) {
  let funcNameRegex = / (.{1,})\(/;
  let results = funcNameRegex.exec(obj.constructor.toString());
  return results && results.length > 1 ? results[1] : '';
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Returns the name of the calling
 */
function PromiseOwnFunctionName(depth = 1) {
  return new Promise((resolve, reject) => {
    STACKTRACE.get().then(frames => {
      let trace = frames.filter(frame => {
        // filter out stuff that isn't part of our own code
        let match = frame.fileName.includes('webpack:///');
        match = match && !frame.fileName.includes('node_modules');
        match = match && !frame.fileName.includes('///webpack');
        return match;
      });
      let frame = trace[depth];
      if (!frame) {
        const err = `couldn't find module frame for depth ${depth} of eligible trace`;
        resolve({ error: err });
      } else {
        let fn = `${frame.functionName}()`;
        let ln = frame.lineNumber;
        resolve({
          file: PATH.Basename(frame.fileName),
          functionName: fn,
          line: ln
        });
      }
    });
  });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Suggest a replacement for deprecated function
 */
async function Deprecated(repl) {
  const { file, functionName, line } = await PromiseOwnFunctionName(3);
  let out = `${functionName} in '${file}' line:${line} is deprecated.`;
  if (typeof repl === 'string') out += ` ${repl}`;
  console.log(`%c${out}`, cssalert);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function Unimplemented() {
  const { file, functionName, line } = await PromiseOwnFunctionName(3);
  let out = `${functionName} in '${file}' line:${line} is not yet implemented.`;
  alert(`${out}\n\nCrashing now! Use javascript console to debug`);
  console.log(`%c${out}`, cssalert);
  debugger;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function Unsupported(reason) {
  const { file, functionName, line } = await PromiseOwnFunctionName(3);
  let out = `${functionName} in '${file}' line:${line} is not supported anymore.`;
  alert(`${out}\n\nCrashing now! Use javascript console to debug`);
  console.log(`%c${out}`, cssalert);
  debugger;
}

///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** InspectObject() accepts an object and a label, and prints a list of
    all the methods and properties in it. It returns a string, so you will
    have to console.log() to see the output.
*/
function InspectObject(obj, d) {
  if (!obj) return 'Must pass an object or 1401 watched object key string';

  let out = '';
  // handle command line calls
  switch (typeof obj) {
    case 'object':
    case '':
      break;
    default:
      return `must pass object or , not ${typeof obj}`;
  }

  // handle recursive scan
  const depth = d || 0;
  let label = obj.constructor.name || '(anonymous object)';
  let indent = '';
  for (let i = 0; i <= depth; i++) indent += '\t';
  out += `${label}\n`;
  out += '\n';
  out += m_DumpObj(obj, depth + 1);
  let proto = Reflect.getPrototypeOf(obj);
  if (proto) {
    out += `\n${indent}IN PROTO: `;
    out += this.InspectObject(proto, depth + 1);
    out += '\n';
  }
  if (depth === 0) out = `\n${out}`;
  console.log(out);
  return obj;
}

/** SUPPORTING FUNCTIONS ****************************************************/
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Support  for InspectModule() and InspectObject()
    Also checks m_watching array
*/
function m_DumpObj(obj, depth) {
  let indent = '';
  for (let i = 0; i < depth; i++) indent += '\t';

  let str = '';
  Object.keys(obj).forEach(key => {
    let prop = obj[key];
    let type = typeof prop;
    str += indent;
    str += `${type}\t${key}`;
    switch (type) {
      case '':
        str += ` (${u_Extract(prop)})`;
        break;
      default:
        break;
    }
    str += '\n';
  });
  return str;

  function u_Extract(prop) {
    const regexp = /.*\(([^)]*)\)/;
    const args = regexp.exec(prop.toString());
    return args[1];
  }
}

/** GLOBAL HOOKS *************************************************************/

if (typeof window === 'object') {
  window.InspectModule = REFLECT.InspectModule;
  window.InspectObject = REFLECT.InspectObject;
  window.DBG_Out = (msg, selector) => {
    REFLECT.Out(msg, false, selector);
  };
  window.DBG_OutClean = (msg, selector) => {
    REFLECT.Out(msg, true, selector);
  };
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default { PromiseOwnFunctionName, Deprecated, Unsupported, Unimplemented };
