/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

ECAForm

Used to communicate with an Embodied Conversational Agent

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import React from 'react';

export default function ECAForm() {
  const [question, setQuestion] = useState('');

  return (
    <form>
      <label>
        Question: <textarea id="utterance" name="Utterance" rows="4" cols="50" />
      </label>

      <label>
        ECAType:
        <select id="ecatype" name="ECAType">
          <option value="CI">CI</option>
          <option value="GameHelp">GameHelp</option>
          <option value="GameHelp_FoodJustice">GameHelp_FoodJustice</option>
          <option value="GameHelp_Collaboration">GameHelp_Collaboration</option>
          <option value="Knowledge_Pollination">Knowledge_Pollination</option>
          <option value="Knowledge_FoodJustice">Knowledge_FoodJustice</option>
          <option value="ConversationBumpers">ConversationBumpers</option>
          <option value="GEMSTEP_Modeling">GEMSTEP_Modeling</option>
        </select>
      </label>

      <label>
        Confidence Threshold:
        <input
          type="number"
          id="confidenceThreshold"
          name="ConfidenceThreshold"
          min="0"
          max="1"
          step="0.01"
          value="0.6"
        />
      </label>

      <input type="submit" value="Submit" />
      <span id="loading" style="display:none;">
        Loading...
      </span>
    </form>
  );
}
