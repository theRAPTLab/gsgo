/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Site-wide Preferences

  Preferences are shared among all projects.
  Preferences are defined in the assets/preferences folder.

  (Note that project 'metadata' are project-specific settings
  while 'preferences' apply to all projects.)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import * as CHELPER from 'script/tools/comment-utilities';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('AC-PREFERENCES', 'TagCyan');

/// The module name will be used as args for UR.ReadStateGroups
const STATE = new UR.class.StateGroupMgr('preferences');
/// StateGroup keys must be unique across the entire app
STATE.initializeState({
  commentTypes: []
});
/// These are the primary methods you'll need to use to read and write
/// state on the behalf of code using APPCORE.
const { stateObj, flatStateValue, _getKey, updateKey } = STATE;
/// For handling state change subscribers, export these functions
const { subscribe, unsubcribe } = STATE;
/// For React components to send state changes, export this function
const { handleChange } = STATE;
/// For publishing state change, this can be used inside this module
/// DO NOT CALL THIS FROM OUTSIDE
const { _publishState } = STATE;
/// To allow outside code to modify state change requests on-the-fly,
/// export these functions
const { addChangeHook, deleteChangeHook } = STATE;
const { addEffectHook, deleteEffectHook } = STATE;

/// CONVENIENCE METHODS ///////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function updateAndPublish(settings) {
  updateKey({ settings });
  _publishState({ settings });
}

/// ACCESSORS /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// return copies

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetPreferences() {
  // Currently this only returns the comment types, but there's room to
  // add other preferences
  return CHELPER.GetCommentTypes();

  // REVIEW: Should this use state?
  // return { ..._getKey('commentTypes') }; // clone
}

/// UPDATERS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/** API: Use this to initialize the data
 *  This will trigger a state update without writing to disk.
 */
function SetPreferences(preferences) {
  const commentTypes = preferences.commentTypes;
  commentTypes.forEach(s => {
    CHELPER.AddStyle(s);
  });

  // REVIEW: Do we want to update state at all here?
  // or just rely on CHELPER to maintain state?
  // DCPROJECT.UpdateProjectData({ commentTypes });
  // updateAndPublish(settings);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GetPreferences, SetPreferences };
