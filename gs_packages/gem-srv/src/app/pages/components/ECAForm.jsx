/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import { useState, useMemo } from 'react';
import PanelChrome from './PanelChrome';
import * as ACConversationAgent from '../../../modules/appcore/ac-conversation-agent';

export default function ECAForm({ projId }) {
  const panelName = 'ECA';
  const [answer, setAnswer] = useState('');
  // useMemo ensures that ResolveECAType is called once, and then only again if projId changes
  const ecaType = useMemo(
    () => ACConversationAgent.ResolveECAType(projId),
    [projId]
  );

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let formUtterance = formData.get('Utterance');

    ACConversationAgent.FetchResponse(formUtterance, ecaType)
      .then(response => setAnswer(response))
      .catch(error => {
        console.error(`Problem with ECA response: ${error}`);
        setAnswer('An error occurred.');
      });
  }

  let content;
  if (ecaType) {
    content = (
      <>
        <form method="post" onSubmit={handleSubmit}>
          <label>
            Question:
            <textarea id="utterance" name="Utterance" rows="4" cols="50" />
          </label>

          <input type="submit" value="Submit" />
        </form>
        <div>{answer}</div>
      </>
    );
  } else {
    content = <p>No ECA Type exists for this project</p>;
  }

  return (
    <PanelChrome id={panelName} title={panelName}>
      {content}
    </PanelChrome>
  );
}
