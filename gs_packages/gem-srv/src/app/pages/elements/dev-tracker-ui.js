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
import * as HANDLERS from './ui-handlers';
import * as STATE from './ui-state';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('TRACKERUI', 'TagDkRed');
let LOCALES = [];
let ROOT_APP; // root component
const log = console.log;

/// HELPER: SUBSCRIBERS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// a Set of React-style 'setState( {change} )' methods
const SUBSCRIBERS = new Set();
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Invoke React-style 'setState()' method with change object
 */
export function NotifySubscribers(change) {
  if (ROOT_APP) ROOT_APP.setState(change);
  SUBSCRIBERS.forEach(comp => comp.setState(change));
}

/// MODULE INITIALIZE /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function Initialize(rootComponent) {
  if (typeof rootComponent !== 'object') {
    const err = 'rootComponent should be a React.Component instance';
    log(...PR(err));
    throw Error(err);
  }
  ROOT_APP = rootComponent;
  const qs = 'query getLocales { locales { id name } }';
  UR.Query(qs).then(d => {
    if (d.errors) {
      d.errors.forEach();
    } else {
      LOCALES = d.data.locales;
      NotifySubscribers(d.data);
    }
  });
}

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** return the initial state as defined in UISTATE, the source of truth for
 *  state
 */
export const { GetInitialStateFor } = STATE;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** React components can receive notification of state changes here.
 *  Make sure that the setStateMethod is actually bound to 'this' in the
 *  constructor of the component!
 */
export function Subscribe(component) {
  SUBSCRIBERS.add(component);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** For components that mount/unmount, you should make sure you unsubscribe
 *  to avoid memory leaks. For classes use componentWillUnmoun().
 */
export function Unsubscribe(component) {
  if (!SUBSCRIBERS.has(component))
    console.error(`ERROR: method ${component.name} was not subscribed.`);
  SUBSCRIBERS.delete(component);
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
export function HandleStateChange(component, section, name, value) {
  const change = { [name]: value }; // name is defined in the form element
  STATE.SetStateSection(section, change);
  component.setState(change, () => {});
}
