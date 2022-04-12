/* eslint-disable consistent-return */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  AC WIZCORE TEST MODULE
  copy these back to

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import { CompileBlueprint, TextToScript } from 'modules/sim/script/transpiler-v2';
import { GS_ASSETS_PROJECT_ROOT, GS_ASSETS_PATH } from 'config/gem-settings';
import { PromiseLoadAssets } from '../asset_core/asset-mgr';
import { State, SendState } from './ac-wizcore';
import * as WIZCORE from './ac-wizcore';

export * from './ac-wizcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DEFAULT_PROJECT_ID = 'decomposition';
