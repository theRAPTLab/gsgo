/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Manage locale information and synchronize changes as needed with database
  TODO: add GraphQL subscriptions to this somehow

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-LOCALES', 'TagCyan');

const STATE = new UR.class.StateGroup({
  locales: [],
  localeNames: [],
  localeID: 0
});
const { stateObj, updateKey } = STATE;

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies
export const LocaleNames = () => stateObj('localeNames');
export const Locales = () => stateObj('locales');
export const CurrentLocaleID = () => stateObj('localeID');
export const CurrentLocale = () => stateObj('locales')[CurrentLocaleID()];
/// update
export const SetLocaleID = id => {
  updateKey('localeID', id);
};

/// DATABASE QUERIES //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function m_LoadLocaleInfo() {
  console.log(...PR('(1) GET LOCALE DATA'));
  const response = await UR.Query(`
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
    updateKey({ localeNames, locales });
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function LoadCurrentPTrack() {
  const localeID = stateObj('localeId');
  console.log(...PR('(2) GET LOCALE DATA FOR DEFAULT ID', localeID));
  const response = await UR.Query(
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
    { id: localeID }
  );
  return response.data.locale;
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// for loading data structures
UR.HookPhase(
  'UR/LOAD_DB',
  () =>
    new Promise((resolve, reject) => {
      m_LoadLocaleInfo();
      resolve();
    })
);
