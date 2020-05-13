/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  MODELER MAIN PAGE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React, { useRef } from 'react';
import UR from '@gemstep/ursys';
import { useURSubscribe, useInterval } from '../hooks/use-ursys';
// left-side tabbed views
import Welcome from '../page-tabs/Welcome';
import SessionMgr from '../page-tabs/SessionMgr';
import Simulator from '../page-tabs/Simulator';
import Modeler from '../page-tabs/Modeler';
import AssetMgr from '../page-tabs/AssetMgr';
import Annotation from '../page-tabs/Annotation';
// right-side documentation reference
import DocSimObjects from '../components/DocSimObjects';
import DocSimControls from '../components/DocSimControls';
import DocSystem from '../components/DocSystem';
// ursys components
import URSiteNav from '../page-blocks/URSiteNav';
import URTabbedView from '../page-blocks/URTabbedView';
import { URView, Row, CellFixed, Cell } from '../page-blocks/URLayout';
//

/// MAIN COMPONENT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// note: this is rendered both on the server once and on the client
function Page() {
  const counter = useRef();
  counter.current = 0;

  // TEST 1
  function handleTick(data) {
    const { tick = '', source = '', route = '' } = data;
    console.log(`TICK ${tick} ${source} ${route}`);
  }
  useURSubscribe('APPSTATE_TICK', handleTick);
  //
  useInterval(() => {
    UR.Signal('APPSTATE_TICK', {
      source: 'src:1000ms timer',
      tick: counter.current++
    });
  }, 1000);

  // TEST 2
  function handleHello(data) {
    console.log('RESPONSE "HELLO_URSYS"');
    // I'm sure you don't really want this, just being thorough
    let out = '. got';
    Object.keys(data).forEach(key => {
      out += ` [${key}]:${data[key]}`;
    });
    data.fish = 'mackerel';
    out += ` ret [fish]:${data.fish}`;
    console.log(out);
    return data;
  }
  useURSubscribe('HELLO_URSYS', handleHello);

  /// RENDER //////////////////////////////////////////////////////////////////
  return (
    <URView scrollable>
      <URSiteNav />
      <Row>
        <Cell>
          <URTabbedView>
            <Welcome label="Welcome" />
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
            <DocSimObjects label="Objects" />
            <DocSimControls label="Controls" />
            <DocSystem label="Modules" />
          </URTabbedView>
        </CellFixed>
      </Row>
    </URView>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default Page; // functional component
