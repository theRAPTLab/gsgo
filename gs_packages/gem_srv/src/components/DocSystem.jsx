/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CommonUI View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { TextView } from '../blocks/URLayout';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
**Modules** are functional units of the system that may be deployed on differnt servers.

#### Simulation Module

* Simulation Engine
* Simulation View
* Simulation Stream Generator
`;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default () => <TextView>{NOTES}</TextView>;
