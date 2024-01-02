/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';
import { useState } from 'react';

export default function ECAForm() {
  const [answer, setAnswer] = useState('');

  function handleSubmit(e) {
    e.preventDefault();

    const ecaUrl = 'https://tracedata-01.csc.ncsu.edu/GetECAResponse';
    const form = e.target;
    const formData = new FormData(form);
    const formJson = Object.fromEntries(formData.entries());

    const payload = {
      'Utterance': formData.get('Utterance'),
      'ECAType': 'Knowledge_Pollination',
      'ConfidenceThreshold': 0.6
    };

    console.log(formJson);

    fetch(ecaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error. Status ${response.status}`);
        }

        response
          .text()
          .then(text => setAnswer(text))
          .catch(error => {
            console.error(`Problem with ECA response: ${error}`);
            setAnswer('An error occurred.');
          });
      })
      .catch(error => {
        console.error(`Problem calling ECA ${error}`);
      });
  }

  return (
    <>
      <form method="post" onSubmit={handleSubmit}>
        <label>
          Question:
          <textarea id="utterance" name="Utterance" rows="4" cols="50" />
        </label>

        <input type="submit" value="Submit" />
      </form>
      <div style={{ color: 'pink' }}>{answer}</div>
    </>
  );
}
