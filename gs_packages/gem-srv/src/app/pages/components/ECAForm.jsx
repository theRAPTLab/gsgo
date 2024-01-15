/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React, { useState } from 'react';
import PanelChrome from './PanelChrome';
import * as ACConversationAgent from '../../../modules/appcore/ac-conversation-agent';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

function ECAForm(props) {
  const panelName = 'ECA';
  const { classes } = props;
  const ecaTypesFromProjFile = ACConversationAgent.GetECATypes();
  const ecaTypes = ecaTypesFromProjFile
    ? Object.values(ecaTypesFromProjFile)
    : null;
  const [answer, setAnswer] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let formUtterance = formData.get('Utterance');
    let formECAType = formData.get('ECAType');

    ACConversationAgent.FetchResponse(formUtterance, formECAType)
      .then(response => setAnswer(response))
      .catch(error => {
        console.error(`Problem with ECA response: ${error}`);
        setAnswer('An error occurred.');
      });
  }

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
            <div className={'col-4'}>
              <input className={classes.input} type="submit" value="Submit" />
            </div>
            <div className={'col-4'}>
              <select id="ecatype" name="ECAType" className={classes.select}>
                {ecaTypes.map(eca => (
                  <option key={eca.label} value={eca.name}>
                    {eca.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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

export default withStyles(useStylesHOC)(ECAForm);
