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
import ConditionHelp from './codex-conditions.yaml';
import EventHelp from './codex-events.yaml';

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
/** return general help for all features */
function m_GetAllKeywordsHelp() {
  if (KeywordHelp === undefined) return {};
  return KeywordHelp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/* lookup keyword help from codex-keywords.yaml dictionary */
function m_GetKeywordHelp(kw: string) {
  const kw_help = KeywordHelp[kw];
  if (kw_help && kw_help.input !== undefined) {
    if (DBG) console.log(`%c${kw_help.input}`, 'font-size:0.8;color:blue');
    return kw_help.input;
  }
  return `no keyword help found for ${kw}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return general help for all types */
function m_GetAllTypesHelp() {
  if (TypeHelp === undefined) return {};
  return TypeHelp;
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
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return prompt for the given featName */
function m_GetFeatureHelp(featName: string) {
  const feat_help = FeatureHelp[featName];
  if (feat_help === undefined) return {};
  return feat_help;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return general help for all features */
function m_GetAllFeaturesHelp() {
  if (FeatureHelp === undefined) return {};
  return FeatureHelp;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return help for specific featProp
 *  @param {string} parentLabel -- `Costume` or `agent.Costume`
 */
function m_GetFeaturePropHelp(featPropName: string, parentLabel: string) {
  const parents = parentLabel ? parentLabel.split('.') : [];
  let featName;
  if (parents.length === 1) {
    // <feature>
    featName = parents[0];
  } else if (parents.length > 1) {
    // <bpname>.<feature> or <bpname>.<feature>.<featProp>
    featName = parents[1];
  } else {
    // no parent set, so probably empty
    return 'not defined yet';
  }
  const featHelp = m_GetFeatureHelp(featName);
  const fp_help = featHelp[featPropName];
  if (fp_help && fp_help.info !== undefined) {
    return fp_help;
  }
  return `no featPorp help found for ${parentLabel}.${featPropName}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return help for when condition tests */
function m_GetConditionHelp(condition: string) {
  const cond_help = ConditionHelp[condition];
  if (cond_help === undefined) return {};
  return cond_help;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return help for onEvent events */
function m_GetEventHelp(event: string) {
  const event_help = EventHelp[String(event).toLowerCase()];
  if (event_help === undefined) return {};
  return event_help;
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: provide help strings for all keywords from EditSymbol_Block */
function ForAllKeywords(): { keywords: any } {
  return { keywords: m_GetAllKeywordsHelp() };
}
/** API: provide help strings for all keywords from EditSymbol_Block */
function ForAllTypes(): { types: any } {
  return { types: m_GetAllTypesHelp() };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: Provide help string to from SlotEditor Block */
function ForEditorSelection(editorSelection): {
  keyword: string;
  gsType: string;
  gsInput: string;
  features: any;
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
  const keywordHelp = m_GetKeywordHelp(kw);
  const vtoks = slots_validation.validationTokens;
  if (DBG) m_DumpValidationLog(slots_validation);

  const { gsType } = vtoks[CHECK.OffsetLineNum(sel_slotpos, 'sub')];
  let gsTypeHelp = m_GetTypeHelp(gsType);
  let gsInputHelp = m_GetInputHelp(gsType);

  let featureAllHelp = m_GetAllFeaturesHelp();
  return {
    keyword: keywordHelp,
    gsType: gsTypeHelp,
    gsInput: gsInputHelp,
    features: featureAllHelp
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
/** API: provide help strings for all features */
function ForAllFeatures(): { features: any } {
  return { features: m_GetAllFeaturesHelp() };
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

/// SIMPLE API ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** API: given gsType, return help for EditSymbol choices */
function ForChoice(
  gsType: string,
  selectedValue: string,
  parentLabel?: string
): { name?: string; info?: string; input?: string } {
  const EMPTY = '-';
  let type = gsType;

  if (DBG)
    console.log(
      'ForChoice GSTYPE:',
      gsType,
      'SELECTEDVALUE:',
      selectedValue,
      'PARENTLABEL:',
      parentLabel
    );
  // KeywordHelp
  // 'keyword' is for SlotEditor_Block
  // 'keywords' is for EditSymbol_Block
  if (['keyword', 'keywords'].includes(type)) {
    if (selectedValue === '' || selectedValue === undefined) {
      // blank line so just return type info
      // fall back to default
    } else {
      return { input: m_GetKeywordHelp(selectedValue) };
    }
  }
  // FeatureHelp
  // 'feature' is for SlotEditor_Block
  // 'featuresList' is for EditSymbol_Block
  // 'featName' is for ObjRefSelector_Block
  if (['feature', 'featuresList', 'featName'].includes(type)) {
    return m_GetFeatureHelp(selectedValue);
  }

  // 'featProp' is for EditSymbol_Block
  // if (['featProp', 'method'].includes(type)) {
  if (['featProp'].includes(type)) {
    return m_GetFeaturePropHelp(selectedValue, parentLabel);
  }

  // 'method' is for SLotEditor_Block, e.g. 'setTo'
  // 'methods' is for EditSymbol_Block, but it might be:
  // a. for a featCall (in which case 'parentLabel' will be set to the feature name)
  // b. for a when condition test (`parentLabel` = test)
  // c. for a prop (in which case, 'parentLabel' is not set)
  if (['method', 'methods'].includes(type)) {
    if (parentLabel === 'test') {
      // for b. look up 'when condition test'
      return m_GetConditionHelp(selectedValue);
    } else if (parentLabel) {
      // for a. look up `featCall` method
      return m_GetFeaturePropHelp(selectedValue, parentLabel);
    } else if (selectedValue === undefined) {
      // for d. empty slot still
      type = 'method';
    } else {
      // for c. look up regular `prop` method
      type = selectedValue;
    }
  }

  if (type === 'events') {
    return m_GetEventHelp(selectedValue);
  }

  // TypeHelp return normal type help
  // -- special handling to map non TSymbolData gsTypes to existing TSymbolData types
  if (type === 'blueprints') type = 'blueprint';
  if (type === 'propName') type = 'prop';
  // -- `propType` is SlotEditor_Block / 'propTypes'` is EditSymbol_Block
  if (['propType', 'propTypes'].includes(type)) {
    if (selectedValue === undefined || selectedValue === '') {
      // for empty slot
      type = 'propType';
    } else {
      type = selectedValue;
    }
  }
  const { name, info, input } = m_GetTypeHelp(type) || {};
  return { name, info, input }; // allow undefined
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
  ForAllKeywords,
  ForAllTypes,
  ForEditorSelection, //
  ForAllFeatures,
  ForFeatureMethod, //
  ForGSArg, //
  ForTypeInfo,
  LookupParent,
  // SIMPLE API
  ForChoice
};
