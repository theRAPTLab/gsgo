/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
// modeler views
import SystemHome from '../blocks/views/SystemHome';
import SessionMgr from '../blocks/views/SessionMgr';
import Simulator from '../blocks/views/Simulator';
import Modeler from '../blocks/views/Modeler';
import AssetMgr from '../blocks/views/AssetMgr';
import Annotation from '../blocks/views/Annotation';
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
            <SystemHome label="Welcome" />
            <SessionMgr label="Load" />
            <Modeler label="Model" />
            <Simulator label="Simulate" />
            <Annotation label="Observe" />
            <AssetMgr label="Images" />
          </URTabbedView>
        </Cell>
        <CellFixed
          style={{
            maxWidth: '320px',
            minWidth: '320px',
            backgroundColor: 'white'
          }}
        >
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
