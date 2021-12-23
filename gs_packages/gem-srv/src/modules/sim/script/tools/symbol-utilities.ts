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
import { TabProps } from '@material-ui/core';
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
  return GetFeature(featName);
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
export function TestObjref(tok: IToken = { objref: ['Agent', 'x'] }) {
  const { objref } = tok;
}
