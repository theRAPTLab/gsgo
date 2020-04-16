/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  SystemShell - React App Container

  Loaded by SystemInit which wraps a HashRouter around it

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// LIBRARIES /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';

/// SYSTEM ROUTES /////////////////////////////////////////////////////////////
import SystemRoutes from './SystemRoutes';

/// CLASS DECLARATION /////////////////////////////////////////////////////////
class SystemShell extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidMount() {
    // console.log(`%ccomponentDidMount()`, cssreact);
  }

  render() {
    const classes = this.props.classes;
    // omg an error???
    if (this.state.hasError) debugger;
    // otherwise return component with matching routed view
    return (
      <Switch>
        {SystemRoutes.map(route => (
          <Route exact={route.exact} key={route.path} path={route.path} component={route.component} />
        ))}
      </Switch>
    );
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// default props are expect properties that we expect
/// and are declared for validation
SystemShell.defaultProps = {
  classes: {}
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// propTypes are declared. Note "vague" propstypes are
/// disallowed by eslint, so use shape({ prop:ProtType })
/// to describe them in more detail
SystemShell.propTypes = {
  classes: PropTypes.shape({})
};

/// EXPORT REACT CLASS ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default SystemShell;
