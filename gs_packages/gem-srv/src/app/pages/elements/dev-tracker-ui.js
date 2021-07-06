/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  DEV-TRACKER-UI handles all the tricky interactions

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACK-UI');
const STATE_INIT = {
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
UR.InitializeState(STATE_INIT);

/// MODULE INITIALIZE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function InitializeLocale() {
  // do some initial data queries
  // (1) retrieve the list of locales
  let response;
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
  console.log(...PR('LOAD query localeNames,locales:', response));
  if (!response.errors) {
    const { localeNames, locales } = response.data;
    UR.UpdateStateSection('localeNames', localeNames);
    UR.UpdateStateSection('locales', locales);
    console.log('localeNames', localeNames);
    UR.PublishState({ locales, localeNames });
  }
  // (2) next request localeId 1, using variable to pick which one
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
    { id: 1 }
  );
  // (3) now that we have the locale, we can yoink the ptrack properties and shove
  // them into UISTATE
  console.log(...PR('LOAD query locale(id)', response));
  const { id, ptrack } = response.data.locale;
  UR.UpdateStateProp('app', 'localeId', id);
  UR.UpdateStateSection('transform', ptrack);
  UR.PublishState({ transform: ptrack, app: { localeId: id } });
}
