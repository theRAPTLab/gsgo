/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  ViewMain - Main Application View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
import React from 'react';

/// CONSTANTS /////////////////////////////////////////////////////////////////

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ViewMain extends React.Component {
  // constructor
  constructor(props) {
    super(props);
    console.log('constructed ViewMain');
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
