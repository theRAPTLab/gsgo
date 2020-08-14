/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useRef } from 'react';
// left-side tabbed views
import Home from '../page-tabs/Home';
import ModelBuild from '../page-tabs/ModelBuild';
import ModelRun from '../page-tabs/ModelRun';
import Test from '../page-tabs/Test';

// right-side documentation reference
import DocSimObjects from '../components/DocSimObjects';
import DocSimControls from '../components/DocSimControls';
import DocSystem from '../components/DocSystem';
// ursys components
import URSiteNav from '../page-blocks/URSiteNav';
import URTabbedView from '../page-blocks/URTabbedView';
import { URView, Row, CellFixed, Cell } from '../page-blocks/URLayout';

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: this is rendered both on the server once and on the client
function Page() {
  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <URView scrollable>
      <URSiteNav title="GEMSTEP Laptop Controller" />
      <Row>
        {/* LEFT SIDE */}
        <Cell>
          <URTabbedView>
            <Home label="Home" />
            <ModelBuild label="Edit" />
            <ModelRun label="Run Model" />
          </URTabbedView>
        </Cell>
        {/* RIGHT SIDE */}
        {/* <CellFixed
          style={{
            maxWidth: '320px',
            minWidth: '320px',
            backgroundColor: 'white'
          }}
        >
          <URTabbedView>
            <DocSimObjects label="Objects" />
            <DocSimControls label="Controls" />
            <DocSystem label="Modules" />
          </URTabbedView>
        </CellFixed> */}
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
