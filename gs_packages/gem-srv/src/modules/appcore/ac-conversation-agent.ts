/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Manages the following for the Embodied Conversational Agent:
  * Calls and responses to and from the ECA API.
  * Resolving the ECA Type, which determines the subject domain of the ECA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ECAURL = 'https://tracedata-01.csc.ncsu.edu/GetECAResponse';
const STATE = new UR.class.StateGroupMgr('ecaTypes');

STATE.initializeState({
  ecaTypes: [
    {
      'label': '',
      'name': '',
      'initialMessage': ''
    }
  ]
});

const { _getKey, updateKey, _publishState } = STATE;

interface payload {
  Utterance: string;
  ECAType: string;
  ConfidenceThreshold: number;
}

let requestPayload: payload = {
  Utterance: '',
  ECAType: '',
  ConfidenceThreshold: 0.6
};

function GetECATypes(): TConversationAgent[] | null {
  const ecaTypes: TConversationAgent[] = { ..._getKey('ecaTypes') };
  // console.log(`GetECATypes: ${ecaTypes[0].name}`);
  return ecaTypes[0].name === '' ? null : ecaTypes;
}

/**
 * Gets a response from the ECA API. Uses the ECA Type set based on the current project
 * and a Confidence Threshold.
 * @param {string} formUtterance - The text from a user that is used to determine the response.
 * @returns {Promise<string>} - The response from the ECA.
 */
async function FetchResponse(
  formUtterance: string,
  ecaType: string
): Promise<string> {
  requestPayload.Utterance = formUtterance;
  requestPayload.ECAType = ecaType;

  // Ensures that ConfidenceThreshold will be left as a number
  // which is required by the ECA API
  let formattedPayload = JSON.stringify(requestPayload, (key, value) =>
    isNaN(value) ? value : +value
  );

  let response = await fetch(ECAURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: formattedPayload
  });

  if (!response.ok) {
    throw new Error(`HTTP error. Status ${response.status}`);
  }

  return response.text();
}

function updateAndPublish(ecaTypes) {
  updateKey({ ecaTypes });
  _publishState({ ecaTypes });
}

function SetECATypes(ecaTypes) {
  try {
    updateAndPublish(ecaTypes);
  } catch {
    console.log('No ecaTypes found for current project');
  }
}

export { FetchResponse, GetECATypes, SetECATypes };
