/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI HELPER MODULE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as CHECK from 'modules/datacore/dc-sim-data-utils';
// string dictionaries
import TypeHelp from './codex-types.yaml';
import KeywordHelp from './codex-keywords.yaml';
import FeatureHelp from './codex-features.yaml';
import GSArgsHelp from './codex-gsargs.yaml';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('GUIHELP', 'TagDkBlue');
const DBG = false;

/// SUPPORT FUNCTIONS /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** utility method to dump validation log */
function m_DumpValidationLog(vsToks: TValidatedScriptUnit) {
  const log = vsToks.validationLog.join('\n');
  console.log(`%c${log}`, 'font-size:0.8em;color:#444');
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* lookup keyword help from codex-keywords.yaml dictionary */
function m_GetKeywordHelp(kw: string, sel_slotpos: number) {
  const kw_help = KeywordHelp[kw];
  if (kw_help && kw_help.input !== undefined) {
    if (DBG) console.log(`%c${kw_help.input}`, 'font-size:0.8;color:blue');
    return kw_help.input;
  }
  return `no keyword help found for ${kw}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** lookup type help from codex-types.yaml dictionary */
function m_GetInputHelp(gsType: string) {
  const type_help = TypeHelp[gsType];
  if (type_help && type_help.input !== undefined) {
    if (DBG) console.log(`%c${type_help.input}`, 'font-size:0.8;color:purple');
    return type_help.input;
  }
  return `no type help found for ${gsType}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return prompt for the given gsType */
function m_GetTypeHelp(gsType: string) {
  const type_help = TypeHelp[gsType];
  if (type_help === undefined) return {};
  return type_help;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Provide help string to from SlotEditor Block */
function ForEditorSelection(editorSelection): {
  keyword: string;
  gsType: string;
} {
  // the editorSelection can be undefined when line number is clicked
  if (editorSelection === undefined) return undefined;
  const { sel_slotpos, slots_linescript, slots_validation } = editorSelection;
  // make sure there's a valid line post > 0
  const [kwTok] = slots_linescript;
  const kwp = SIMDATA.GetKeywordModuleByToken(kwTok);
  const kw = kwp.keyword;
  const lsArgs = kwp.args;
  const args = lsArgs.join(' ');
  if (DBG) console.log(`%c${kw} %c${args}`, 'font-size:1.5em', 'color:blue');
  const keywordHelp = m_GetKeywordHelp(kw, sel_slotpos);
  const vtoks = slots_validation.validationTokens;
  if (DBG) m_DumpValidationLog(slots_validation);
  const { gsType } = vtoks[CHECK.OffsetLineNum(sel_slotpos, 'sub')];
  let gsTypeHelp = m_GetInputHelp(gsType);
  return {
    keyword: keywordHelp,
    gsType: gsTypeHelp
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: return the default gsArg prompt if it exists. Used by symbol
 *  interpreter methods */
function ForGSArg(sympretName: string): TGSArg {
  const fn = 'ForGSArg:';
  const gsArg = GSArgsHelp[sympretName];
  if (gsArg === undefined) {
    console.warn(`${fn} ${sympretName} not in dict`);
    return '??:{?}';
  }
  return gsArg;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a feature name and a method name, provide help strings */
function ForFeatureMethod(fName: string, mName: string) {
  const feature = FeatureHelp[fName];
  if (feature === undefined) return { info: `no feature named ${fName}` };

  // create a string object with blank strings instead of undefined
  const help_obj: any = { ...feature };
  help_obj.info = feature.info || '';
  const method = feature[mName];
  if (method === undefined) {
    help_obj.hint = `undocumented ${mName}`;
    help_obj.syntax = `undocumented syntax ${mName}`;
    return help_obj;
  }
  help_obj.hint = method.hint || '';
  help_obj.syntax = method.syntax || '';

  return help_obj;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given a gsType, return help strings associated with it */
function ForTypeInfo(gsType: TGSType): { [any: string]: any } {
  const { name = '-', info = '-' } = m_GetTypeHelp(gsType) || {};
  return { name, info };
}

/// TEST FUNCTIONS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// TEMPORARY TEST FUNCTION
function LookupParent(parent) {
  console.log('parent', parent);
}

UR.AddConsoleTool('help', (fname, mname) => {
  return ForFeatureMethod(fname, mname);
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  ForEditorSelection, //
  ForFeatureMethod, //
  ForGSArg, //
  ForTypeInfo,
  LookupParent
};
