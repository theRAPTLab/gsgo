/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
import React from 'react';
import GEM_CONFIG from '@gemstep/globals';

/// CONSTANTS /////////////////////////////////////////////////////////////////

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ViewMain extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    console.log('constructed ViewMain');
    console.log('@gem-step config', GEM_CONFIG);
  }

  componentDidMount() {
    console.log('componentDidMount ViewMain');
  }

  componentWillUnmount() {
    console.log('componentWillUnmount ViewMain');
  }

  render() {
    return (
      <div>
        <h1>App Server</h1>
        <p>ViewMain</p>
      </div>
    );
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// requirement for URSYS MODULES and COMPONENTS
ViewMain.MOD_ID = __dirname;

/// EXPORT REACT COMPONENT ////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// include MaterialUI styles
export default ViewMain;
