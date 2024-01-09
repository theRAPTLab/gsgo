/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

Manages the following for the Embodied Conversational Agent:
  * Calls and responses to and from the ECA API.
  * Resolving the ECA Type, which determines the subject domain of the ECA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as ACProject from './ac-project';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const ECAURL = 'https://tracedata-01.csc.ncsu.edu/GetECAResponse';
interface payload {
  Utterance: string;
  ECAType: string;
  ConfidenceThreshold: number;
}

let pollinationPayload: payload = {
  Utterance: '',
  ECAType: 'Knowledge_Pollination',
  ConfidenceThreshold: 0.6
};

/**
 * Gets a response from the ECA API. Uses the ECA Type set based on the current project
 * and a Confidence Threshold.
 * @param {string} formUtterance - The text from a user that is used to determine the response.
 * @returns {Promise<string>} - The response from the ECA.
 */
async function FetchResponse(formUtterance: string): Promise<string> {
  pollinationPayload.Utterance = formUtterance;

  // Ensures that ConfidenceThreshold will be left as a number
  // which is required by the ECA API
  let formattedPayload = JSON.stringify(pollinationPayload, (key, value) =>
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

export { FetchResponse };
