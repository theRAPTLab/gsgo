/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React, { useRef, useState, useEffect } from 'react';
import PanelChrome from '../PanelChrome';
import * as ACConversationAgent from '../../../../modules/appcore/ac-conversation-agent';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../../helpers/page-xui-styles';
import './ECAForm.css';

function ECAForm({ messages, onNewMessage, ecaTypes }) {
  const panelName = 'ECA';
  const chatBottomRef = useRef(null);
  const [ecaTypeLabel, setECATypeLabel] = useState(
    ecaTypes.length > 0 ? ecaTypes[0].label : null
  );
  const [messageContent, setMessageContent] = useState('');

  // scroll down to the bottom of the chat history
  useEffect(() => {
    chatBottomRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, []); // only runs once, when component is displayed

  // Get the label of the dropdown, instead of the value
  // so it can be used in the chat history
  function handleECADropdownChange(selectedOptionIndex) {
    setECATypeLabel(ecaTypes[selectedOptionIndex].label);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const formUtterance = formData.get('Utterance');
    const formECAType = formData.get('ECAType');
    let lastResponse = '';

    ACConversationAgent.FetchResponse(formUtterance, formECAType)
      .then(response => {
        lastResponse = response;
      })
      .catch(error => {
        console.error(`Problem with ECA response: ${error}`);
        lastResponse = 'An error occurred.';
      })
      .finally(() => {
        onNewMessage([
          ...messages,
          {
            utterance: formUtterance,
            answer: lastResponse,
            responder: ecaTypeLabel
          }
        ]);
        // clear the textarea after submit
        setMessageContent('');
        // scroll to the bottom of the chat so the most recent message is visible
        chatBottomRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      });
  }

  // convert the messages array JSX used by the component
  // @Joshua, this is where the initialMessages should be appearing, as dialogue.answer
  // for some reason, they are showing up blank.
  const dialogues = messages.map((dialogue, index) => {
    return (
      <div key={index}>
        {dialogue.utterance !== '' && (
          <div className={'message'}>
            <span className={'message-sender'}>You</span>
            <div className={'message you'}>{dialogue.utterance}</div>
          </div>
        )}
        <div className={'message'}>
          <span className={'message-responder'}>{dialogue.responder}</span>
          <div className={'message them'}>{dialogue.answer}</div>
        </div>
      </div>
    );
  });

  let content;
  if (ecaTypes) {
    content = (
      <div className="chat">
        <div className={'dialogues'}>
          {dialogues}
          <div className={'chat-bottom'} ref={chatBottomRef}></div>
        </div>
        <div className={'text-input'}>
          <form method="post" onSubmit={handleSubmit}>
            <textarea
              id="utterance"
              name="Utterance"
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              rows={4}
              cols={50}
            />
            <select
              id="ecatype"
              name="ECAType"
              className={'type-dropdown'}
              onChange={e => handleECADropdownChange(e.target.selectedIndex)}
            >
              {ecaTypes.map(eca => (
                <option key={eca.label} value={eca.name} label={eca.label}>
                  {eca.label}
                </option>
              ))}
            </select>
            <input
              className={'send'}
              type="submit"
              value="Send"
              disabled={!messageContent}
            />
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
