/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-use-before-define */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  database main collections:
  locales: [ {locale, id, locale, ptrack}, ... ]

  There is something in graphql called subscriptions that can be used to
  handle subscriptions and publishing. Under the hood this is implemented in
  MTQQ.

  type Subscription {
    somethingChanged: Result
  }
  type Result {
    id: String
  }

  resolvers = {
    Subscription: {
      somethingChanged: {
        subscribe: ()=>pubsub.asyncIterator(SOMETHING_CHANGED_TOPIC)
      }
    }
  }

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as STATE from './ui-state';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACK-UI', 'TagDkRed');
let ROOT_APP; // root component
const DBG = true;

/// HELPER: SUBSCRIBERS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// a Set of React-style 'setState( {change} )' methods
const SUBSCRIBERS = new Set(); // StateHandlers
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Invoke React-style 'setState()' method with change object
 */
export function PublishState(change) {
  if (typeof change !== 'object') throw Error('arg1 must be setState object');
  const subs = [...SUBSCRIBERS.values()];
  subs.forEach(sub => sub(change, () => {}));
}

/// MODULE INITIALIZE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export async function InitializeState() {
  // do some initial data queries
  // (1) retrieve the list of locales
  let data;
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
          xRot
          yRot
          zRot
        }
      }
    }
  `);
  console.log(...PR('LOAD query localeNames,locales:', response));
  if (!response.errors) {
    data = response.data;
    STATE.SetState('localeNames', data.localeNames);
    STATE.SetState('locales', data.locales);
    PublishState(data);
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
  STATE.SetState('app', 'localeId', id);
  STATE.SetState('transform', ptrack);
  PublishState({ transform: ptrack, app: { localeId: id } });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the initial state as defined in UISTATE, the source of truth for
 *  state
 */
export const { ReadState } = STATE;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React components can receive notification of state changes here.
 *  Make sure that the setStateMethod is actually bound to 'this' in the
 *  constructor of the component!
 */
export function SubscribeState(stateHandler) {
  if (typeof stateHandler !== 'function')
    throw Error(
      'arg1 must be a method in a Component that receives change, section'
    );
  SUBSCRIBERS.add(stateHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** For components that mount/unmount, you should make sure you unsubscribe
 *  to avoid memory leaks. For classes use componentWillUnmoun().
 *  unmounts
 */
export function UnsubscribeState(stateHandler) {
  if (typeof stateHandler !== 'function')
    throw Error(
      'arg1 must be a method in a Component that receives change, section'
    );
  SUBSCRIBERS.delete(stateHandler);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is called from the component's handleChangeState() handler, which
 *  handles the state change call on its behalf after getting a chance to
 *  update this modules state.
 *  @param {React.Component} component - the calling React component class
 *  @param {string} section - the part of the state object to overwrite
 *  @param {string} name - name of property within [section] to change
 *  @param {value} value - value to set named property to
 *
 *  NOTE: make sure the component binds 'this' to handleStateChange()
 *  in the component constructor otherwise 'this' will be undefined.
 */
export function WriteState(section, name, value) {
  STATE.SetState(section, { [name]: value });
  PublishState({ [section]: { [name]: value } });
}
