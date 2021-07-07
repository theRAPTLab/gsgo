/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DEV-TRACKER-UI handles all the tricky interactions

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as APPCORE from '../../../modules/appcore';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACK-UI');
const MASTER_STATE = {
  locales: [],
  localeNames: [],
  app: {
    devices: '',
    entities: '',
    localeId: 0
  },
  transform: {
    xRange: 1,
    yRange: 1,
    xOff: 0,
    yOff: 0,
    xScale: 1,
    yScale: 1,
    zRot: 0
  },
  faketrack: {
    num_entities: 2,
    prefix: 'f',
    jitter: 1,
    burst: false
  }
};

/// INITIALIZE ON MODULE LOAD BEFORE REACT ////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.InitializeState(MASTER_STATE);
/// INTERCEPT STATE UPDATE ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let AUTOTIMER;
let LOCALE_ID = 0;
let LOCALES = [];
let LOCALE_NAMES = [];
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookStateChange((group, name, value) => {
  if (group === 'app') {
    if (name === 'localeId') LOCALE_ID = Number(value);
  }
  if (group === 'transform') {
    console.log('transform', name, '=', value);
    if (MASTER_STATE.transform[name] !== undefined) {
      MASTER_STATE.transform[name] = Number(value);
      if (AUTOTIMER) clearInterval(AUTOTIMER);
      AUTOTIMER = setInterval(() => {
        console.log(...PR('autosaving transform', MASTER_STATE.transform));
        UR.Query(
          `
          mutation LocalePTrack($id:Int $input:PTrackInput) {
            updatePTrack(localeId:$id,input:$input) {
              memo
            }
          }
        `,
          {
            input: MASTER_STATE.transform,
            id: LOCALE_ID
          }
        ).then(response => {
          console.log('response', response);
        });
        clearInterval(AUTOTIMER);
        AUTOTIMER = 0;
        // update locale
        LOCALES[LOCALE_ID].ptrack = MASTER_STATE.transform;
        UR.PublishState({ locales: LOCALES });
      }, 1000);
      return [group, name, Number(value)]; // make sure UI updates with current vars
    }
  }
  // if nothing returned, the handler operates normally
  return undefined;
});

/// LOAD LOCALE ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function InitializeLocale() {
  // do some initial data queries
  // (1) retrieve the list of locales
  let response;
  console.log(...PR('(1) GET LOCALE DATA'));
  response = await UR.Query(`
    query {
      localeNames { id name }
      locales {
        id
        name
        ptrack {
          memo
          xRange
          yRange
          xOff
          yOff
          xScale
          yScale
          zRot
        }
      }
    }
  `);
  if (!response.errors) {
    const { localeNames, locales } = response.data;
    LOCALE_NAMES = localeNames;
    LOCALES = locales;
    UR.UpdateStateGroup('localeNames', localeNames);
    UR.UpdateStateGroup('locales', locales);
    UR.PublishState({ locales, localeNames });
  }
  // (2) next request localeId 1, using variable to pick which one
  const default_id = 0;
  console.log(...PR('(2) GET LOCALE DATA FOR DEFAULT ID', default_id));
  response = await UR.Query(
    `
    query GetPtrackTransform($id:Int!) {
      locale(id:$id) {
        id
        name
        ptrack {
          ...TransformParts
        }
      }
    }
    fragment TransformParts on PTrackProps {
      xRange
      yRange
      xOff
      yOff
      xScale
      yScale
      zRot
    }
  `,
    { id: default_id }
  );
  // (3) now that we have the locale, we can yoink the ptrack properties and shove
  // them into UISTATE
  const { id, ptrack } = response.data.locale;
  console.log(...PR('(3) SET LOCALEID TO', id));
  UR.UpdateStateGroupProp('app', 'localeId', id);
  UR.UpdateStateGroup('transform', ptrack);
  UR.PublishState({ transform: ptrack, app: { localeId: id } });
}
