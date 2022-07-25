/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI HELPER MODULE


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
import * as TOKENIZER from 'script/tools/script-tokenizer';
import TypeHelp from './codex-types.yaml';
import KeywordHelp from './codex-keywords.yaml';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('GUIHELP', 'TagDkBlue');
const DBG = false;

/// SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility method to dump validation log */
function m_GetKeywordHelp(kw: string, sel_slotpos: number) {
  const kw_help = KeywordHelp[kw];
  if (kw_help && kw_help.input !== undefined) {
    if (DBG) console.log(`%c${kw_help.input}`, 'font-size:0.8;color:blue');
    return kw_help.input;
  }
  return `no keyword help found for ${kw}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_GetTypeHelp(type: string) {
  const type_help = TypeHelp[type];
  if (type_help && type_help.input !== undefined) {
    if (DBG) console.log(`%c${type_help.input}`, 'font-size:0.8;color:purple');
    return type_help.input;
  }
  return `no type help found for ${type}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_DumpValidationLog(vsToks: TValidatedScriptUnit) {
  const log = vsToks.validationLog.join('\n');
  console.log(`%c${log}`, 'font-size:0.8em;color:#444');
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Provide help string to from SlotEditor Block */
function ForEditorSelection(editorSelection): string[] {
  const { sel_slotpos, slots_linescript, slots_validation } = editorSelection;
  const [kwTok] = slots_linescript;
  const kwp = SIMDATA.GetKeywordModuleByToken(kwTok);
  const kw = kwp.keyword;
  const lsArgs = kwp.args;
  const args = lsArgs.join(' ');
  if (DBG) console.log(`%c${kw} %c${args}`, 'font-size:1.5em', 'color:blue');
  const help = [];
  let text = m_GetKeywordHelp(kw, sel_slotpos);
  if (text) help.push(text); // generic help
  const vtoks = slots_validation.validationTokens;
  if (DBG) m_DumpValidationLog(slots_validation);
  const { gsType } = vtoks[CHECK.OffsetLineNum(sel_slotpos, 'sub')];
  text = m_GetTypeHelp(gsType);
  if (text) help.push(text);
  return help;
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  ForEditorSelection //
};
