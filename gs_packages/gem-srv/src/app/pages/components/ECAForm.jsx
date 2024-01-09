/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import { useState } from 'react';
import PanelChrome from './PanelChrome';
import * as ACConversationAgent from '../../../modules/appcore/ac-conversation-agent';

export default function ECAForm() {
  const panelName = 'ECA';
  const [answer, setAnswer] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let formUtterance = formData.get('Utterance');

    ACConversationAgent.FetchResponse(formUtterance)
      .then(response => setAnswer(response))
      .catch(error => {
        console.error(`Problem with ECA response: ${error}`);
        setAnswer('An error occurred.');
      });
  }

  return (
    <PanelChrome id={panelName} title={panelName}>
      <form method="post" onSubmit={handleSubmit}>
        <label>
          Question:
          <textarea id="utterance" name="Utterance" rows="4" cols="50" />
        </label>

        <input type="submit" value="Submit" />
      </form>
      <div>{answer}</div>
    </PanelChrome>
  );
}
