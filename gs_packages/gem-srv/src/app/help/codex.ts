/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GUI HELPER MODULE


\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import * as TOKENIZER from 'script/tools/script-tokenizer';
import TypeHelp from './codex-types.yaml';
import KeywordHelp from './codex-keywords.yaml';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('GUIHELP', 'TagDkBlue');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function LineHelp(lineScript: IToken[]) {
  const [kwTok] = lineScript;
  const kwp = SIMDATA.GetKeywordModuleByToken(kwTok);
  const lsArgs = kwp.args;
  const vsToks = kwp.validate(lineScript);
  const kw = kwTok.identifier;
  const args = lsArgs.join(' ');
  const log = vsToks.validationLog.join('\n');
  console.log(`%c${kw} %c${args}`, 'font-size:1.5em', 'color:blue');
  console.log(`%c${log}`, 'font-size:0.8em;color:#444');

  const kw_help = KeywordHelp[kw];
  if (kw_help && kw_help.input) {
    console.log(`%c${kw_help.input}`, 'font-size:0.8;color:blue');
  }
}

/// DEBUG METHODS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.AddConsoleTool('lh', text => {
  const lineScript = TOKENIZER.StringToLineScript(text);
  LineHelp(lineScript);
});

UR.HookPhase('UR/APP_READY', () => {
  (window as any).lh('prop hp setMax 100');
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
