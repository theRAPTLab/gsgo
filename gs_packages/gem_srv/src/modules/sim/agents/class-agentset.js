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
  constructor(agentArray = [], setName) {
    if (!Array.isArray(agentArray)) throw Error('arg1 must be array of agents');
    if (typeof setName === 'string') {
      if (GROUPS.has(setName)) throw Error(`group ${setName} already exists`);
      this.name = setName;
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

  touches(setName) {
    console.log(`touches ${setName}`);
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

  getMembers() {
    return [...this.set];
  }
}

/// STATIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
AgentSet.when = setName => {
  const set = GROUPS.get(setName);
  console.log(`when ${setName} returns`, set);
  return GROUPS.get(setName);
};

AgentSet.defineGroup = setName => {
  if (GROUPS.has(setName)) throw Error(`group '${setName}' already exists`);
  GROUPS.set(setName, new AgentSet([], setName));
};

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default AgentSet;
