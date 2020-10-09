/// LIBRARIES /////////////////////////////////////////////////////////////////
import React from 'react';
import PropTypes from 'prop-types';

/// COMPONENT /////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default function NoMatch(props) {
  const { location } = props;
  const hash = location.pathname.substring(1);
  return (
    <div>
      ViewNoMatch: route no match <tt>#{hash}</tt>
    </div>
  );
}
NoMatch.propTypes = {
  // eslint and proptypes interact poorly and this is OK
  // eslint-disable-next-line react/forbid-prop-types
  location: PropTypes.object
};
NoMatch.defaultProps = {
  // this disables another eslint complaint
  location: null
};
