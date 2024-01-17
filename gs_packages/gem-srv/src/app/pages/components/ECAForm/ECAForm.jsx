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
        const truncatedHistory =
          history.length >= 5 ? history.slice(1) : history.slice();
        setHistory([
          ...truncatedHistory,
          { utterance: formUtterance, answer: lastResponse }
        ]);
        console.log(history);
      });
  }

  const dialogues = history.map((dialogue, index) => {
    if (dialogue.utterance) {
      return (
        <li>
          <p>{dialogue.utterance}</p>
          <p>{dialogue.answer}</p>
        </li>
      );
    } else {
      return (
        <li>
          <p>No input provided.</p>
        </li>
      );
    }
  });

  let content;
  if (ecaTypes) {
    content = (
      <>
        <form method="post" onSubmit={handleSubmit}>
          <div className={'row'}>
            <label htmlFor="utterance">Question:</label>
          </div>
          <div className={'row'}>
            <textarea id="utterance" name="Utterance" rows="4" cols="50" />
          </div>
          <div className={'row'}>
            <select id="ecatype" name="ECAType" className={classes.select}>
              {ecaTypes.map(eca => (
                <option key={eca.label} value={eca.name}>
                  {eca.label}
                </option>
              ))}
            </select>
          </div>
          <div className={'row'}>
            <input className={classes.input} type="submit" value="Submit" />
          </div>
        </form>
        <div>{answer}</div>
        <section>
          <div className={classes.title}>History</div>
          <ul>{dialogues}</ul>
        </section>
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

export default withStyles(useStylesHOC)(ECAForm);
