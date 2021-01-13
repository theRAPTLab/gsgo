# DATA

DATATYPE = {
  INSTANCE : "instance",
  ACTION   : "action",
  VALUE    : "$value",
  STRING   : "string",
  NUMBER   : "number",
  BOOL     : "boolean"

}

VMTYPE = {
  SOURCEOBJECT : {
    AGENT         : "agent",
    AGENTPROPERTY : "agentProperty",
    VALUE         : "value"
  }
}
DB = DATABASE = {
  MODELS    : [ ... ] -- 
  AGENTS    : [ ... ] 
  INSTANCES : [ ... ]
  EVENTS    : [ ... ]
  SOURCES   : [ ... ]
}

OP = operations = {
  agent   : [ ... ] -- id, label, targetType, opType
  number  : [ ... ] -- id, label, targetType, opType
  string  : [ ... ] -- id, label, targetType, opType
  actions : [ ... ] -- id, label, sourceTypes, targetType
  features : [ ... ] -- type, commands {}, settings {}, actions{}
}

## OPERATIONS DATA STRUCTURE
The elements in OP table are the source object type and all possible operations that may be invoked on it. 

id         = unique id identifying agent|number|string|action
label      = displayed name
targetType = expected target (look up in this table)
opType     = a grouping value?

agents, number, strings, actions are the source types implied in each table
features uses its own object structure that I'm skipping for now

## DATASTORE MODEL OBJ
id, label, creationData, modifiedData

## DATASTORE AGENTS OBJ
Seems to have agent ids with a properties and features list.
The initial values are also set here.
It's unclear if these are actually agent templates...oh, I see that there's an INSTANCES group.

## DATABASE INSTANCES OBJ
Seems to initialize the agent instances themselves
-
id, agentId, modelId, label
properties: id, label, type, value

## DATABASE EVENTS OBJ
These are "interactions" like "when bee touches flowers"
id, agentId, label, filters, actions

## DATABASE EXPRESSIONS OBJ
each expression has a source id, the operation, and the targetIt
these should be expressed more as operation arg1 arg2
id, sourceId, opID, targetId
--
is it necessary to store it like this/

## DATABASE SOURCES OBJ
these seem to be something used by expressions. The expressions index into a bunch of sources so it can keep track of them.
we're missing 

----

## What's Up with UISTATE in APPLOGIC

* isLoggedIn
* agentIsBeingEdited
* selectedAppTab
* selectedAgentId
* selectedInstanceId

questions:
* modal elements seem problematic (e.g. isLoggedIn, agentIsBeingEdited) if they have to be explicitly set by a UI control rather than inferred by a mechanism that determines what can and cannot be done at a component level.
* selections like "selectedAgentId" are probably better expressed as "selectedItem"

RequestUpdateBroadcast() has two calls:
BroadcastDATA - send the entire DB object to each listener
BroadcastUI - sends the entire UISTATE object to each listener
Also the UISTATE parts of applogic provide accessors like SelectAgentId

## What's Up with Agents, Model Manipulation in APPLOGIC

There are a lot of accessors here to retrieve particular data structures and return them. My impression is that there might be a way to simplify them.

----
# DISPATCHER
???

----

# DRAWING

Looking at the AgentEditor, what do we see? This is the top level.
* uses applogic to get properties and so forth
controlpanel-sub
* PropertiesList
* FeaturesList
* EventsList
scriptpanel
* PropertyEditor (if selectedProperty has value)
* FeatureEditor (if selectedFeature has value)
* EventEditor (if selectedEvent has value)

The EventEditor is probably the most exciting one because of the nesting.
* get agentId, event from props
* get list of filters that match this agentId
* get list of actions fthat match this agentId
event: id, agentId, label, filters, actions

Next it displays a FiltersList and an ActionsList
* FiltersList - FilterEditor with filter, eventId, key = f.id
* * FilterEditor - loads Expression with expression=filter, dataType = BOOL

<Expression> is what seems to do the heavy lifting.
* source is what? (the expressions, figures out the options from the source datatype
* target is what? if targetId App.GetExpression

APPLICATION REVIEW 2:

* initial tab is RUN, which shows "script controlled" and "user controlled" elements. 
* selecting an instance shows the properties/features and their inital settings. Presumably can set them to different starting values.
* edit mode: the instances remain, but AGENT TEMPLATES now appear.
* selecting a template shows properties, features, and interactions
* selecting a property shows EDIT PROPERTY label, type, initial value
* selecting an INTERACTION is where things get interesting

```
an expression contains what?
sourceId, targetId
id, opId

The VISIBLE design of an ExPRESSION consists of at minimum two parts
[SOURCE] [opId] [EXPRESSION]
the type of the source
EXPRESSION can be used to chain-on expressions. 
It's not really an expression is it?
```

#### How Expressions work in the UI

An "expression has at minimum an AgentTemplate, an AgentProperty, and the available actions available. **How to extract script from it?**

```
when BEE touches FLOWER
and when BEE.nectarCount > 10
and when BEE.nectarCount > FLOWER.nectarCount + Hive.nectarCount+20
do
[Bee].nectarCount incrementBy 1
[Flower].nectarCount decrementBy 1
---
smc condition program looks like this
  prebuilt test: 'touches' (requires A1, A2) -> produces agentset pairs
  inline test: A1.prop gt 10 -> filter A1 test -> produces agentset pairs that match BEE condition
  inline test: A1.prop gt (A2.prop [HiveInstance].prop 20 add add] -> produces agentset pairs that match
smc execution program looks like this
	bee.nectarCount add 1
  flower.nectarCount sub 1
---
how it works:
* during CONDITION phase, a set of agent pairs are produced that match
* the allowable executables are constrained by the starting agent set, which is used to execute the program that affects is
* if there are global exec programs like TIME advance 1, the matching result pairs get to run that for each time it matches. 
---
how does the compiler then work? IT has to scan a data structure from left to right, or walk a tree of some kind.

WHEN TOUCHES BEE FLOWER :  condition.filter.push(smc_touches(BEE,FLOWER)) <-- produces agent sets
  if [Bee].prop > 10    :  exec: condition.exec.push(smc_agentProp(nectarCount), smc_lt(10)) - bool, [exec2]
  [exec2] if [Bee].prop > [Flower].prop + [Hive].nectarCount + 20 
  											: pushBeePropValue
  											: pushFLowerPropValue, pushHiveProp, add, pushValue(20), add 							
  											: compareValues
  											: ifTrue queue Bee    : [ Prop(nectarCount) 1 add ]
  											:        queue FLower : [ Prop(nectarCount) 1 sub ]
  											
So our data structure needs to be able to handle a conditional chain, and we probably need to worry about order or precedence and grouping at some point, but maybe not initially.
  											
```

So there are several issues:

* the way expressions have to be **constrained** by the initial WHEN clause. This runs a particular test that is set by the constraints of the arguments.
* We have to figure out how to generate the appropriate smc_code (or look it up) for each term in the expression.
* How to provide data structures to the script ui so it can make things. 

*Based on today's scan, I may try to re-implement a data structure design that tries to eliminate all the ids i the data table and replaces them with tokens in a list of some kind. There is a lot of coupling between the JSX components and the data model and app logic that I'm wondering if I can eliminate if I get rid of ids.*

*They might be able to be implied by the actual agent definitions anyway through some **intermediate saved language**. That same language could be used to drive the script generator too, I think.*

---

