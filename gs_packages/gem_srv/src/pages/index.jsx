/* eslint-disable @typescript-eslint/no-use-before-define */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useRef } from 'react';
// left-side tabbed views
import Home from '../page-tabs/Home';
import ModelBuild from '../page-tabs/ModelBuild';
import ModelRun from '../page-tabs/ModelRun';

// ursys components
import URSiteNav from '../page-blocks/URSiteNav';
import URTabbedView from '../page-blocks/URTabbedView';
import { URView, Row, CellFixed, Cell, TextView } from '../page-blocks/URLayout';

/// GLOBAL NOTES //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GLOBAL = `
* size of panes are adjustable in edit mode
* sizes should support planned activities
`;

/// TERMINOLOGY NOTES /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TERMS = `
* Visual Model
* Tracked vs Untracked Agents
`;

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
        <CellFixed
          style={{
            maxWidth: '240px',
            minWidth: '240px',
            backgroundColor: '#f7f0c0'
          }}
        >
          <URTabbedView>
            <TextView p={1} label="global">
              {GLOBAL}
            </TextView>
            <TextView p={1} label="terms">
              {TERMS}
            </TextView>
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
