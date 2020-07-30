/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GROUPS = new Map();
const STR_ANON = '<anon>';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/**
 */
class AgentSet {
  constructor(agentArray = [], nameOfSet) {
    if (!Array.isArray(agentArray)) throw Error('arg1 must be array of agents');
    if (typeof nameOfSet === 'string') {
      if (GROUPS.has(nameOfSet)) throw Error(`group ${nameOfSet} already exists`);
      this.name = nameOfSet;
    }
    this.set = new Set();
    this.populate(agentArray);
  }

  populate(agentArray = []) {
    if (this.set && this.set.size > 0) {
      console.log(`purging values in set '${this.name || STR_ANON}'`);
      this.set.clear();
    }
    agentArray.forEach(agent => this.set.add(agent));
    return this;
  }

  clear() {
    this.set.clear();
  }

  members() {
    return [...this.set];
  }

  touches(nameOfSet) {
    console.log(`touches ${nameOfSet}`);
    return this;
  }

  filter(filterFunc) {
    const filtered = [];
    this.set.forEach(agent => {
      if (filterFunc(agent)) filtered.push(agent);
    });
    return new AgentSet(filtered);
  }

  queueEvent(eventName) {
    console.log(`queue ${eventName}`);
    this.set.forEach(agent => agent.queueEvent(eventName));
    return this;
  }
}

/*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*:

notes to self.... thinking through conditions on agent sets
first...what are these supposed to have? what are they good for?
1. caching results of intersection tests
2. caching results of conditional tests
3. retrieving all the members of an Agent class

if [AgentType1 AgentType2] filteringConditions -> AgentSet
if [AgentType] filteringConditions -> AgentSet

filteringConditions have some built-in types
. touches(agentSet1,agentSet2) -> set of touching agents
. condition(agentSet) -> set of passing agents
. agentSet | filterCondition -> set of filtered agants // equivalent to above

timerConditions are separate from agent operations, but affect sets of agents
potentially...

example 'when' clauses

  when [Bee touches Hive]
  . runs during "Interaction" phase
  . touches is an intersection test between Bee and Hive
  . interaction op produces an AgentSet which queues intersection events
  . Bee and Hive must implement Movement + Body features
  when [Bee.energy greaterThan 0]
  . runs during "Conditions" phase
  . the condition consists of a property and a test resolving to true/false
  . condition op produces an AgentSet which queues condition events
  . properties are designated by the agentType and propertyName
  when MyTimer.elapsed greaterThan 10
  . runs during "Timers" phase
  . same form as the conditions version

pseudocode for touches

  in programming phase
  . when('AgentGroup1', 'AgentGroup2', 'TestName') <--- SIGNATURE
  ... AgentSets is for doing stuff to sets of agents, and imports Agents
  ... the sets of all agents by type are in Agent static map
  ... Tests are named functions
  ... Tests for interactions always use form AgentType1, AgentType2, options
      . internally, the test iterates over the sets and returns an AgentSet
  ... Tests for conditions always use form AgentType, options
      internally, the test iterates over the set and performs a conditional test
      (wait, is a conditional test the same thing? nooooo...not technically)
      returns an AgentSet
  ... BUT HOW does the signature get created and cached?
      a.  The initial encounter of 'when' creates a function expression that is
          added to the INTERACTIONS phase under its signature key to calculate ONCE.
      b.  Every agent using the same signature subscribes to this function, which
          works by queuing the interaction event in each agent instances queue






:*- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -*/

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AgentSet.when = nameOfSet => {
  const set = GROUPS.get(nameOfSet);
  console.log(`when ${nameOfSet} returns`, set);
  return GROUPS.get(nameOfSet);
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AgentSet.defineGroup = nameOfSet => {
  if (GROUPS.has(nameOfSet)) throw Error(`group '${nameOfSet}' already exists`);
  GROUPS.set(nameOfSet, new AgentSet([], nameOfSet));
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default AgentSet;
