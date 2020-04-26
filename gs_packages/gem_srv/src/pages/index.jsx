/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// modeler views
import Agents from '../blocks/views/Agents';
import Interactions from '../blocks/views/Interactions';
import Move from '../blocks/views/Move';
import Playback from '../blocks/views/Playback';
import Artwork from '../blocks/views/Artwork';
import CommonSimObjects from '../components/DocSimObjects';
import CommonSimControls from '../components/DocSimControls';
import CommonSystem from '../components/DocSystem';
// ursys components
import URSiteNav from '../blocks/URSiteNav';
import URTabbedView from '../blocks/URTabbedView';
import { URView, Row, CellFixed, Cell } from '../blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <URView scrollable>
      <URSiteNav />
      <Row>
        <Cell>
          <URTabbedView>
            <Agents label="Agents" />
            <Interactions label="Interactions" />
            <Move label="Move" />
            <Artwork label="Artwork" />
            <Playback label="Playback" />
          </URTabbedView>
        </Cell>
        <CellFixed width="25%" style={{ backgroundColor: 'white' }}>
          <URTabbedView>
            <CommonSimObjects label="Objects" />
            <CommonSimControls label="Controls" />
            <CommonSystem label="Modules" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
