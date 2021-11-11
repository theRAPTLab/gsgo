/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Wizard - Rendering shapes

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import UR from '@gemstep/ursys/client';
import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

// SELECT RUNTIME MODULES FOR APP
import * as ASSETS from '../../modules/asset_core';
import {
  TextToScript,
  TokenToString,
  ScriptToText,
  U_SimplifyTokenPrimitives
} from '../../modules/sim/script/transpiler-v2';
import { useStylesHOC } from './elements/page-styles';
//
import '../../lib/css/gem-ui.css';
import { GS_ASSETS_DEV_ROOT } from '../../../config/gem-settings';
//

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SCRIPT = `
# BLUEPRINT Bee AgentAAA
# PROGRAM DEFINE
addProp frame Number 3
useFeature Movement
# PROGRAM UPDATE
prop skin setTo "bunny.json"
featCall agent.Movement jitterPos -5 5
# PROGRAM EVENT
onEvent Tick [[
  ifExpr {{ agent.getProp('name').value==='bun0' }} [[
    dbgOut 'my tick' 'agent instance' {{ agent.getProp('name').value }}
    dbgOut foolish game
  ]]
  prop agent.x setTo  0
  prop agent.y setTo 0
]]
# PROGRAM CONDITION
when Bee sometest [[
  dbgOut SingleTest
]]
when Bee sometest Bee [[
  dbgOut PairTest
]]
`.trim();

/// DEBUG UTILS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PR = UR.PrefixUtil('WIZ', 'TagApp');

let M_STATE;
function m_SetStateUpdater(handler) {
  M_STATE = handler;
}

const HANDLE_CLICK = event => {
  const data = event.target.getAttribute('data');
  console.log(`clicked ${data}`);
};
const HANDLE_SELECT = event => {
  const data = event.target.getAttribute('data');
  console.log(`selected ${data}`);
};
const HANDLE_TOK = (event, tok, settok, state) => {
  if (!Array.isArray(tok)) {
    console.log('handle tok', tok);
    const data = event.target.getAttribute('data');
    settok({ token: 'foo' });
    event.stopPropagation();
    if (M_STATE) M_STATE();
  } else {
    console.log('got a block', tok);
  }
};
/// UTILITIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** This is a cheeseball key indexer for rendering react children. Probably
 *  not the best way to do it but hey this is a prototype
 */
let KEY = 0;
function u_Key(prefix) {
  return `${prefix}${KEY++}`;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A GToken is the representation of a non-array element of a ScriptUnit
 *  @param {string|number} value - the token to render
 */
function GToken(props) {
  const { token } = props; // the scriptunit to render
  // initialize our token state
  const [mytok, setmytok] = useState(token);
  //
  const key = u_Key('tok');
  const value = U_SimplifyTokenPrimitives(mytok);

  if (typeof value !== 'object') {
    // a javascript primitive type
    return (
      <div
        className="glabel"
        key={key}
        data={key}
        onClick={e => HANDLE_TOK(e, mytok, setmytok)}
      >
        {value}
      </div>
    );
  }
  if (Array.isArray(value)) {
    // it's a block
    return <div>whut</div>;
  }

  // must be a token
  const text = TokenToString(value);
  return (
    <div
      className="glabel"
      key={key}
      data={key}
      onClick={e => HANDLE_TOK(e, mytok, setmytok)}
    >
      {text}
    </div>
  );
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** A GLine contains a number of Tokens, each of which is clickable. Eventually
 *  it will be built in a GLine Editor of some kind.
 *  @param {object} props.statement - a script unit array, which can contain
 *  script unit arrays as elements also!
 *  @return - jsx
 */
function GLine(props) {
  const { statement } = props;
  const toks = [];
  const id = u_Key('line');
  statement.forEach(tok => {
    const val = U_SimplifyTokenPrimitives(tok);
    if (Array.isArray(val)) {
      // an array of scriptunits
      const { block } = val;
      toks.push(<GBlock key={u_Key('block')} script={block} data={id} />);
    } else {
      toks.push(
        <GToken
          onClick={() => {
            HANDLE_CLICK(id);
            console.log('foo', id);
          }}
          token={tok}
          key={u_Key('tok')}
        />
      );
    }
  });
  return (
    <div key={id} data={id} className="gwiz line">
      {toks}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GBlock(props) {
  // script is a tokenized program source, an array of statements
  // that are comprised of keywords and their parameters
  const { script } = props;
  // inside of containing block, return a line for each
  const blockContent = [];
  // assemble the content
  script.forEach(stmt => {
    const key = u_Key('line');
    blockContent.push(<GLine key={key} className="gwiz line" statement={stmt} />);
  });
  const key = u_Key('line');
  return (
    <div className="gwiz block" key={key}>
      {blockContent}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestGraphics(props) {
  return (
    <div>
      <div className="gunit gk0" />
      <div className="gunit gk">
        <div className="glabel">keyword</div>
      </div>
      <div className="gunit gk1" />

      <div className="gunit ga0" />
      <div className="gunit ga">
        <div className="glabel">assign</div>
      </div>
      <div className="gunit ga1" />
    </div>
  );
}

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class DevWizard extends React.Component {
  constructor() {
    super();
    this.box = React.createRef(); // used for current box
    this.state = { script: TextToScript(SCRIPT), DBGDRAW: 0 };
  }

  componentDidMount() {
    // start URSYS
    UR.SystemAppConfig({ autoRun: true }); // initialize renderer
    document.title = 'DEV WIZARD';
    // end HookPhase
    if (DBG) console.log(...PR('mounted'));
    document.addEventListener('click', this.handleClick);
    m_SetStateUpdater(this.handleExternalState);
  }

  handleClick = event => {
    // handle click-outside
    if (this.box && !this.box.current.contains(event.target)) {
      console.log('you just clicked outside of box!');
    } else HANDLE_CLICK(event);
  };

  handleExternalState = () => {
    console.log('updating state');
    this.setState({ DBGDRAW: Math.random() }, () => {
      console.log(ScriptToText(this.state.script));
    });
  };

  render() {
    const { classes } = this.props;
    const { script } = this.state;
    KEY = 0;
    //
    return (
      <div
        className={classes.root}
        style={{
          gridTemplateColumns: 'auto 720px',
          gridTemplateRows: '50px 720px auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          id="console-top"
          className={clsx(classes.cell, classes.top, classes.devBG)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          <span style={{ fontSize: '32px' }}>DEV/WIZARD</span>{' '}
          {UR.ConnectionString()}
        </div>
        <div
          id="console-left"
          className={clsx(classes.cell, classes.left)}
          style={{
            boxSizing: 'border-box',
            gridColumnEnd: 'span 1',
            minWidth: '280px'
          }}
        >
          blank
        </div>
        <div
          ref={this.box}
          id="root-renderer"
          className={classes.main}
          style={{
            width: '720px',
            height: '720px',
            gridColumnEnd: 'span 1',
            display: 'inline',
            whiteSpace: 'nowrap'
          }}
        >
          <br />
          <GBlock script={script} />
          <br />
          <TestGraphics />
        </div>
        <div
          id="console-bottom"
          className={clsx(classes.cell, classes.bottom)}
          style={{ gridColumnEnd: 'span 2' }}
        >
          console-bottom {this.state.DBGDRAW}
        </div>
      </div>
    );
  }
}

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase(
  'UR/LOAD_ASSETS',
  () =>
    new Promise((resolve, reject) => {
      // console.log(...PR('LOADING ASSET MANIFEST...'));
      (async () => {
        await ASSETS.PromiseLoadAssets(GS_ASSETS_DEV_ROOT);
        // console.log(...PR('ASSETS LOADED'));
        resolve();
      })();
    })
);

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default withStyles(useStylesHOC)(DevWizard);
