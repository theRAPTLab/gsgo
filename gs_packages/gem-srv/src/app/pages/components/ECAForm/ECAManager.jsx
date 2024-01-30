/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAManager

Holds the history of chat messages from the ECA

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useState } from 'react';
import ECAForm from './ECAForm';

function ECAManager({ showECAChat }) {
  const [history, setHistory] = useState([]);

  return (
    <>{showECAChat && <ECAForm messages={history} onNewMessage={setHistory} />}</>
  );
}

export default ECAManager;
