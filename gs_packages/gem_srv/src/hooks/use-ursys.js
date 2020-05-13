/* eslint-disable consistent-return */
import { useEffect, useRef } from 'react';
import UR from '@gemstep/ursys/client';

/// REFERENCE ASYNC ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function useInterval(callback, delay) {
  // get an immutable object
  const savedCallback = useRef();

  // when callback changes, we'll update our ref
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // when delay changes, we start a new timer
  useEffect(() => {
    // declare the function to be used in setInterval
    function tick() {
      savedCallback.current();
    }
    // start the interval
    if (delay !== null) {
      let id = setInterval(tick, delay);
      // return the cleanup function, which will be run whenever this
      // effect is cleaned up IN THE FUTURE, not NOW.
      return () => clearInterval(id);
    }
  }, [delay]);
}
/// URSYS HOOKS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Subscribe to an URSYS message. Usage:
 *  useSubscribe('MESSAGE',data=>{
 *    setState();
 *    callLocalHandler();
 *  });
 */
function useURSubscribe(message, callback) {
  useEffect(() => {
    UR.Subscribe(message, callback);
    return () => UR.Unsubscribe(message, callback);
  }, [message, callback]);
}

/// EXPORT ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { useInterval, useURSubscribe };
