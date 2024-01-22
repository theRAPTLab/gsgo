/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React, { useEffect, useState } from 'react';
import PanelChrome from '../PanelChrome';
import * as ACConversationAgent from '../../../../modules/appcore/ac-conversation-agent';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../../helpers/page-xui-styles';
import './ECAForm.css';

function ECAForm(props) {
  const panelName = 'ECA';
  const { classes } = props;
  const ecaTypesFromProjFile = ACConversationAgent.GetECATypes();
  const ecaTypes = ecaTypesFromProjFile
    ? Object.values(ecaTypesFromProjFile)
    : null;
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState([]);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const formUtterance = formData.get('Utterance');
    const formECAType = formData.get('ECAType');
    let lastResponse = '';

    ACConversationAgent.FetchResponse(formUtterance, formECAType)
      .then(response => {
        setAnswer(response);
        lastResponse = response;
      })
      .catch(error => {
        console.error(`Problem with ECA response: ${error}`);
        setAnswer('An error occurred.');
        lastResponse = 'An error occurred.';
      })
      .finally(() => {
        // Don't allow the history to grow over 5 question/answer pairs
        // const truncatedHistory =
        //   history.length >= 3 ? history.slice(1) : history.slice();
        setHistory([
          ...history,
          { utterance: formUtterance, answer: lastResponse }
        ]);
      });
  }

  const dialogues = history.map((dialogue, index) => {
    if (dialogue.utterance) {
      return (
        <div key={index}>
          <div className={'message you'}>{dialogue.utterance}</div>
          <div className={'message them'}>{dialogue.answer}</div>
        </div>
      );
    } else {
      return <p>No input provided.</p>;
    }
  });

  let content;
  if (ecaTypes) {
    content = (
      <div className="chat">
        <div className={'dialogues'}>{dialogues}</div>
        <div className={'text-input'}>
          <form method="post" onSubmit={handleSubmit}>
            <textarea id="utterance" name="Utterance" rows="4" cols="50" />
            <select id="ecatype" name="ECAType" className={'type-dropdown'}>
              {ecaTypes.map(eca => (
                <option key={eca.label} value={eca.name}>
                  {eca.label}
                </option>
              ))}
            </select>
            <input className={'send'} type="submit" value="Send" />
          </form>
        </div>
      </div>
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

export default withStyles(useStylesHOC)(ECAForm);
