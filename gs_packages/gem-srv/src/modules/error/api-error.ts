/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Error Module is a logger of all errors. The intention is that this
  will be able to capture a snapshot of what isn't working during the compile
  bundle validate symbolize operations and provide a unified means of access
  to this information so it can be displayed in a user interface.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE DEFINITIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SMErrSource =
  | `${'project-loader'}`
  | `${'expr-parser'}`
  | `${'expr-eval'}`
  | `${'script-parser'}`
  | `${'bundler'}`
  | `${'compiler'}`
  | `${'validator'}`
  | `${'symbolizer'}`
  | `${'simulator'}`;
type SMErrCode = `${'bundler'}` | `${'bundler'}`;
type SMErrContext = {
  info: string; // required information
  //
  code?: SMErrCode; // technical optional error code
  module?: string; // user-friendly module name
  line_num?: number; // the line where it happened (filled by bundler)
  line_pos?: number; // index into the line (filled by bundler)
  [any: string]: any; // optional data to put into data object
};

/// HELPER CLASS DECLARATION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SMError {
  source: SMErrSource;
  context: SMErrContext;
  data: any;
  timeStamp: number;
  //
  constructor(source: SMErrSource, err_ctx?: SMErrContext) {
    this.source = source;
    if (typeof err_ctx === 'object') {
      const { name, info, code, line, index, ...data } = err_ctx;
      this.context = { name, info, code, line, index };
      this.data = data;
    }
    this.timeStamp = Date.now();
  }
}

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ERR_QUEUE: SMError[] = [];

/// MODULE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function ERROR(source: SMErrSource, info: SMErrContext) {
  ERR_QUEUE.push(new SMError(source, info));
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetError() {
  return ERR_QUEUE;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ERROR;
export { GetError };
