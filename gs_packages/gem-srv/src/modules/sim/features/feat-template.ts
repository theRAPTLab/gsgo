/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Make-Your-Own (TM) GFeature with this template file!

  To make a feature called 'foo', follow these standards:

  1. Copy the 'feat-template.ts' file to 'feat-foo.ts'
  2. Search/replace all the 'MyFeature' strings to whatever the feature should
     be called in the script. Please use PascalCase (e.g. 'FooFoo', not 'foofoo'
     or 'fooFoo'). There are 4 places, not including this paragraph.
  3. In the file `modules/sim/sim-features', add an import to your new feature
     to make it available to the simulation script compiler

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/*/ required libraries /*/
import UR from '@gemstep/ursys/client';
import GFeature from 'lib/class-gfeature';
import { Register } from 'modules/datacore/dc-features';
/*/ add your other libraries here /*/
import { NumberProp, StringProp } from 'modules/sim/props/var';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// these are debug utilities
const PR = UR.PrefixUtil('MyFeature');
const DBG = false;
/*/
  declare your module-wide variables here that are shared by ALL agents that
  are using this feature (things like lists that are useful for all agents,
  for example
/*/

/// FEATURE CLASS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class MyFeature extends GFeature {
  /*/
    if your feature provides methods to the scripting engine, define them in the
    constructor. Method code is shared between all agents so it is defined only
    once. FYI This is not the case for properties; see decorate() below
  /*/
  constructor(name) {
    super(name);
    if (DBG) console.log(...PR('construct'));

    this.featAddMethod('myMethod', this.myMethod);
  }

  /*/
    This is where each agent that uses the feature gets a chance to add
    feature-specific properties. These properties, unlike methods in the
    constructor, are created in each agent instance to provide persistence.
    These 'feature properties' are stored in their own object that is named
    after the GFeature itself, so there is no collision with similarly-named
    properties in other GFeatures.
  /*/
  decorate(agent) {
    super.decorate(agent);
    this.featAddProp(agent, 'myString', new StringProp('defaultValue'));
    this.featAddProp(agent, 'myNumber', new NumberProp(0));
    const fancyProp = new NumberProp(0);
    fancyProp.setMax(Math.PI * 2);
    fancyProp.setMin(0);
    fancyProp.setWrap();
    this.featAddProp(agent, 'fancyProp', fancyProp);
  }

  /*/
    This code needs to be invoked by the simulator startup to enable advanced
    features and is currently inactive so ignore for now.
  /*/
  initialize(phaseMachine) {
    super.initialize(phaseMachine);
    /// TODO: Hook this into api-sim or sim-feature so all features get a chance to
    /// initialize their class-wide hooks into the simulation phase machine
  }

  /*/
    This is a method that is hooked in the constructor, and is available to the
    script engine under the name defined there. The method is always passed the
    agent instance that is being invoked, and a variable list of parameters.
  /*/
  myMethod(agent, someVar, anotherVar) {
    agent.getProp('myString').value = someVar;
    console.log(...PR('hey, I got', anotherVar));
    m_StaticMethod();
  }
} // end of feature class

/// CLASS HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_StaticMethod() {
  console.log('this is like a static class function in C++');
}

/// REGISTER FEATURE SINGLETON ////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const INSTANCE = new MyFeature('MyFeature');
Register(INSTANCE);
