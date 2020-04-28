/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  CommonUI View

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { TextView } from '../page-blocks/URLayout';

/// CONTENT ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const NOTES = `
#### Agents
The "kinds of" objects that can exist in the model.
Multiple copies of the same Agent can be placed into the special
* User-defined Agents
* World Agent
* System Agents

#### Scripts
Defines what an Agent is and how it interacts with other Agents.

#### Assets
Can be used as values to be used by Scripts
* Background Image
* Costume
* Sound
* Constants
* System Parameters

#### Conditions
A test evaluating either "truthy" or "falsey". The test can either be applied to a Set, Agent Property, or Value. When a Condition is truthy, one of the following happens.
* **Action** - script block execution on truthy Condition
* **Event** - generated message sent to Subscribers
* **Set** - the set of objects in the original Set that passed the test

#### Inputs
User inputs into the simulation
* Direct Controls - PTrack, FakeTrack
* Script Controls - user-scripted AI

#### Time
* Time Intervals - periodic timers (60hz, user set) for Condition tests/Events
* Timers - time elapsed counters (user set) for Condition tests/Events
`;

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default () => <TextView>{NOTES}</TextView>;
