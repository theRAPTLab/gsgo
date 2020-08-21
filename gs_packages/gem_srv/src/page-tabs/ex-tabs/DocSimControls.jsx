/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Documentation TextView

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { TextView } from '../page-blocks/URLayout';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
**Controls** are the UI elements that allow students and teachers to work with the simulation.

#### Models
The collection of
* Class
* Groups
* Student Users
* Teacher Users
* Admin Users

#### Sessions
* Run
* Streams
* * Display Stream
* * Input Streams
* * Video Streams

#### Playback Controls
Has the LIVE or PLAYBACK modes.
* Playback Controls
* Stream Selector
`;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default () => <TextView>{NOTES}</TextView>;
