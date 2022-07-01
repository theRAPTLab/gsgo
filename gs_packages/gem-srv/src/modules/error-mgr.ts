/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Error Module is a logger of all errors. The intention is that this
  will be able to capture a snapshot of what isn't working during the compile
  bundle validate symbolize operations and provide a unified means of access
  to this information so it can be displayed in a user interface.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as UR from '@gemstep/ursys';
import { VER_TRIAL } from 'config/dev-settings';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('ERR MGR', 'TagDkRed');
const SYSTEM_ENABLE = true; // set to try to return conditional ERR_MGR function

/// TYPE DEFINITIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SMErrSource =
  | `${'project-loader'}`
  | `${'project-init'}`
  | `${'app'}`
  | `${'expression'}`
  | `${'tokenizer'}`
  | `${'bundler'}`
  | `${'decoder'}`
  | `${'unpacker'}`
  | `${'compiler'}`
  | `${'validator'}`
  | `${'symbolizer'}`
  | `${'assets'}`
  | `${'simulator'}`
  | `${'runtime'}`
  | `${'renderer'}`
  | 'undefined';
type SMErrCode = `${'jsrun'}`;
type SMErrContext = {
  source: SMErrSource; // the module source
  code?: SMErrCode; // technical optional error code
  data?: any; // optional data object
  caught?: Error; // error object
  // context of location
  where?: string; // user-friendly module/function name
  line_num?: number; // the line where it happened (filled by bundler)
  line_pos?: number; // index into the line (filled by bundler)
  // helpful information
  why?: string; // user-friendly why reason
  help?: string; // user-friendly help/tips on how to deal with it
};

/// HELPER CLASS DECLARATION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** object for managing system-wide error reporting */
class SMError {
  _source: SMErrSource;
  _info: string;
  _code: string;
  _data: any;
  _context: SMErrContext;
  _time: number;
  //
  constructor(info: string, err_ctx?: SMErrContext) {
    err_ctx = err_ctx ?? { source: 'undefined' };
    // save mandatory minimum error information
    this._info = info;
    this._time = Date.now();
    // save err_ctx
    this._context = err_ctx;
    // elevate use info to top level
    const { source, code, data } = err_ctx;
    this._source = source ?? 'undefined';
    this._code = code;
    this._data = data;
  }
  /** retrieve copy of the error context object */
  context() {
    return { ...this._context };
  }
  caught() {
    if (this._context && this._context.caught) {
      return this._context.caught.toString();
    }
    return '';
  }
} // end class SMError

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let ERR_QUEUE: SMError[] = [];
let TIMEOUT;

/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** MAIN API: report error through here */
function ERROR(info: string, context?: SMErrContext) {
  console.log(
    ...PR('logging error from', context.source || 'undefined', `${PR._}${info}`)
  );
  ERR_QUEUE.push(new SMError(info, context));
  // rethrow the error if system-wide errors are on
  if (SYSTEM_ENABLE) {
    let title = 'An Error has Occurred';
    let help = `Please open the JAVASCRIPT CONSOLE (CMD-SHIFT-J) and take a screenshot. `;
    help += `Issues can be reported at the <a href="https://gitlab.com/stepsys/gem-step/gsgo/-/issues" target="_gemgit">GEMSTEP GSGO Repo Issues</a> site`;
    help += `<br><br><tt>VERSION ${VER_TRIAL}</tt>`;
    const out = ERROR.GetLog().join('<br>');
    if (TIMEOUT) clearTimeout(TIMEOUT);
    TIMEOUT = setTimeout(() => {
      document.body.innerHTML += `<div class="error-mgr"><h2>${title}</h2><p>${help}</p><p>ERROR LOG<br>${out}</p></div>`;
    }, 1500);
    if (context && context.caught) throw context.caught;
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
ERROR.GetLog = () => {
  console.log(...PR(`there are ${ERR_QUEUE.length} errors`));
  let out = [];
  ERR_QUEUE.forEach((err, index) => {
    const msg = err.caught();
    const { source, where, data } = err.context();
    out.push(
      `${String(index).padStart(2, ' ')}. ${source} error@${where}: '${msg}'`
    );
  });
  return out;
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the first queued error */
ERROR.Has = () => ERR_QUEUE[0];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** clear the error queue */
ERROR.Clear = () => (ERR_QUEUE = []);

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/
  USE CASES
    1. import ERROR from 'modules/error-mgr'
       to always write errors via ERROR(info,context)
    2. import { ERR_MGR } from 'modules/error-mgr'
       will be defined if SYSTEM_ENABLE is set to true in error-mgr.ts
       and is the same as ERROR object ERR_MGR(info,context)
    3. Additional methods available on ERROR are:
       Has() - has there been an error, will have first error
       Clear() - clear the error buffer
/*/
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// set to true if want to do conditional error management
const ERR_MGR = SYSTEM_ENABLE ? ERROR : undefined;
export default ERROR;
export { ERR_MGR };
