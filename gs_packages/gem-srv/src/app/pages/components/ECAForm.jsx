/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React, { useLayoutEffect } from 'react';
import { useState, useMemo } from 'react';
import PanelChrome from './PanelChrome';
import * as ACConversationAgent from '../../../modules/appcore/ac-conversation-agent';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../helpers/page-xui-styles';

function ECAForm(props) {
  const panelName = 'ECA';
  const { classes, projId } = props;
  const [answer, setAnswer] = useState('');
  // useMemo ensures that ResolveECAType is called once, and then only again if projId changes
  const ecaType = useMemo(
    () => ACConversationAgent.ResolveECAType(projId),
    [projId]
  );
  useLayoutEffect(() => {
    const ecaTypesFromProjFile = ACConversationAgent.GetECATypes();
    console.log(ecaTypesFromProjFile);
  }, []);

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
          <div className={'row'}>
            <label>Question:</label>
          </div>
          <div className={'row'}>
            <textarea id="utterance" name="Utterance" rows="4" cols="50" />
          </div>
          <div className={'row'}>
            <input className={classes.input} type="submit" value="Submit" />
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
