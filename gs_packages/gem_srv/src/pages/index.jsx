/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// modeler views
import Agents from '../blocks/views/Agents';
import Interactions from '../blocks/views/Interactions';
import Move from '../blocks/views/Move';
import Playback from '../blocks/views/Playback';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { FullScreen } from '../blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <FullScreen>
      <URSiteNav />
      <URTabbedView>
        <Agents label="Agents" />
        <Interactions label="Interactions" />
        <Move label="Move" />
        <Playback label="Playback" />
      </URTabbedView>
    </FullScreen>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
