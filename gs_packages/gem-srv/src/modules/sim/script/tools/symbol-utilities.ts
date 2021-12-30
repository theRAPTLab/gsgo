/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable consistent-return */
/* eslint-disable no-cond-assign */
/* eslint-disable no-continue */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  compile-time
  run-time

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

import { GetFeature, GetProgram, GetTest, GetBlueprint } from 'modules/datacore';
import { IToken, TSymbolArgType } from 'lib/t-script.d';
import { StringToParts } from 'lib/util-path';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = true;

/// HELPERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return 'agent' if part is 'agent', undefined otherwise */
function isAgentLiteral(parts: string[], index: number = 0) {
  const part = parts[index];
  return part === 'agent' ? 'agent' : undefined;
}
/** return feature module if part matches, undefined otherwise */
function isFeatureName(parts: string[], index: number) {
  const featName = parts[index];
  const feat = GetFeature(featName);
  return feat;
}
/** return prop if propName matches, undefined otherwise */
function isPropName(parts: string[], index: number) {
  const propName = parts[index];
  // propName has to check current blueprint. Maybe part of bundle class.
}
/** return Blueprint is bpName maptches, undefined otherwise */
function isBlueprintName(parts: string[], index: number) {
  const bpName = parts[index];
  return GetBlueprint(bpName);
}

function isFeaturePropName(parts: string[], index: number) {
  // Feature propName has to be in FeatureMap somewhere
  const featPropName = parts[index];
}

/** if an out-of-bounds part index requested, then 'terminal' */
function isTerminal(parts: string[], index: number) {
  return index > parts.length - 1;
}
function reportError(parts: string[], index: number) {
  console.warn('unhandled objref condition', parts.join('.'));
}

/// FILTERS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function RuntimeTest() {
  UR.AddConsoleTool({
    objref_decode_string: (objref: string) => {
      const parts = objref.split('.');
      for (let i = 0; i < parts.length; i++) {
        let out = '';
        const testResults = {
          agentLiteral: isAgentLiteral(parts, i),
          featureName: isFeatureName(parts, i),
          propName: isPropName(parts, i),
          blueprintName: isBlueprintName(parts, i),
          featurePropName: isFeaturePropName(parts, i),
          terminal: isTerminal(parts, i)
        };
        for (const [key, value] of Object.entries(testResults)) {
          if (value) out += `${key} `;
        }
        console.log(`[${i}] '${parts[i]}' is ${out || '<not matched>'}`);
      }
    }
  });
}
