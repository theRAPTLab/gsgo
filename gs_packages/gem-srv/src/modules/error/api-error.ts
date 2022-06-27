/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  The Error Module is a logger of all errors. The intention is that this
  will be able to capture a snapshot of what isn't working during the compile
  bundle validate symbolize operations and provide a unified means of access
  to this information so it can be displayed in a user interface.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// TYPE DEFINITIONS //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type SMErrType =
  | `${'parser'}`
  | `${'tokenizer'}`
  | `${'eval'}`
  | `${'bundler'}`
  | `${'compiler'}`;
type SMErrMeta = {
  info: string; // required information
  //
  code?: string; // optional error code
  line?: number; // the line where it happened (filled by bundler)
  index?: number; // index into the line (filled by bundler)
  [any: string]: any; // optional data to put into data object
};

/// HELPER CLASS DECLARATION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class SMError {
  type: SMErrType;
  meta: SMErrMeta;
  data: any;
  timeStamp: number;
  //
  constructor(type: SMErrType, meta?: SMErrMeta) {
    this.type = type;
    if (typeof meta === 'object') {
      const { name, info, code, line, index, ...data } = meta;
      this.meta = { name, info, code, line, index };
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
function ERROR(type: SMErrType, info: SMErrMeta) {
  ERR_QUEUE.push(new SMError(type, info));
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { ERROR };
