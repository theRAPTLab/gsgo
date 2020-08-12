## Stack Machine Objects

The Stack Machine implements code that pertains to **scriptable objects**. The main interface for this is an `SM_Object`, which is of type `I_Scopeable`. The objects defined below are run in one of three contexts:

* an DECLARATION phase (smc_define)
* an INIT phase (smc_initialize program)
* a RUNTIME phase (smc_update)

These are all scriptable by defining custom programs at runtime, and execute through the stack machine. The common `method()` and `prop()` calls are used to invoke scripted features.

There is a fourth context! The simulation also uses these objects directly by managers, so there are additional functions defined on the SM_Object and its descendents directly. 


### SM_Objects

**SM_Objects** are the base class for **Agents** and **Agent Properties**, which are the fundamental scriptable elements in GEMSCRIPT. 

SM_Object base class defines the essential **property** and **method** accessor functions, as well as **meta** and **value accessors**. 

* `get/set value` - All SM_Objects have a getter/setter named `value`. Methods `get()` and `set(value)` are also provided.
* `prop('property')` - Returns another SM_Object stored in the property Map by 'property' name. 
* `method('key', args)` - Invokes a function stored in a method Map by 'key', returning values to the `method()` caller. 
* `addProp('property', smo)` - Stores a SM_Object by 'property' in the props Map
* `addMethod('key',f_or_sm)` - Stores a function _OR_ a SM_Program in the methods Map
* `serialize()` - returns an array in key-value order

### Agents

**Agents** are the most basic element in GEMSCRIPT. They implement the SM_Object `method` and `property` interface with a few twists:

* `prop('property')` - Overrides SM_Object.prop to intercept errors, returning the property store in the props map.
* `method('key',args)` - Overrides SM_Object.method to invoke a function OR SM_Programs stored in the methods map.

An SM_Program is just an array of functions that receive agent and SM_State objects. Methods are *always* scriptable, but may be implemented as one or the other. 

An Agent has basic properties like its position, name, and skin. To extend the basic functionality of an agent, **Features** are added:

* `addFeature('feature')` - Stores a reference to 'feature' from a FEATURE LIBRARY in the agent's feature map. The feature is also called via a `decorate` function which adds additional properties to the agent for exclusive use by the feature. 
* `feature('feature')` - Returns the Feature by name, which is an SM_Object-like object that uses a passed agent instance to perform its work. To invoke a Feature method, you must always pass 'agent' as the first element.

Agents are never directly invoked by another agent. Instead, they respond to **messages** of type SM_Message. The primary call is:

* `queue(message)` - Interface for queuing an SM_Message into one of three possible phases: update, think, and exec. 

The agent can (1) modify itself or (2) send a message to another agent. Both these scriptable actions can be executed using the agent's `exec_smc()` function. This is the primary way that scripts are run in the system, since everything in GEMSCRIPT is some form of agent. 

* `exec_smc(program,stack)` - Given am SM_Program and a stack, execute all the opcodes, returning the stack to whoever called this. 

The simulation runs several agent-related PHASES in each simulation step. All agent instances receive the following calls:

* `AGENTS_UPDATE()` - called during AGENTS_UPDATE simulation phase
* `AGENTS_THINK()` - called during AGENTS_THINK simulation phase
* `AGENTS_EXEC()` - called during AGENT_EXEC simulation phase

### Properties

**Property Objects** extend SM_Object to make use of the `value` get/set features, as the primary use for a property is to hold a value and manipulate it. They are stored in an Agent's `props` map and can be used as arguments on the SMC datastack or scopestack.

Property Objects do not use any of the method or property features of SM_Object. However, each type of property has its own set of methods defined in the class itself. These direct methods manipulate the values, providing math and logical operations. Each method also returns another instance of the appropriate property class. For example, for a NumberProp n, executing `n.set(10).eq(10)` will return a BooleanProp with value = true.

Current property objects are:

* `BooleanProp`
* `NumberProp`
* `StringProp`
* `DictionaryProp`

NOTE: These property methods are not currently used for calculations using SM_Programs, but might be useful for non-SMC functions (e.g. used in Features) They might not be useful after all.

### Features

**Features** are a special object that implement `I_Feature` and subclass `Feature`. This is NOT a direct descendent of SM_Object, but they implement extended `method`, `prop` and `addProp` calls. These versions differ by having an additional **agent** argument. That is necessary because Feature code does not have any storage of its own, but uses that of a provided agent. 

When a Feature is added to an Agent using `addFeature`, the agent also invoked the feature's `decorate(agent)` function. This function can add both properties and methods to the agent's props and methods maps. 

At runtime, code can invoke a Feature method or retrieve a Feature property. Because Feature implements the `method()` and `prop()` calls, it can be used with the SMC scopestack to implement something like `useFeature 'feature' property 'prop' add 1'` or `useFeature 'feature' method 'setcostume' 'skin.png'`

Like `Agent`, a Feature implements `method()` to invoke a function or an SM_Program stored in the methods map. This does NOT use an agent's method map, but its **own map**. Feature subclassers can implement its own direct calls as well for code that does not need to be scriptable. 

Like `Agent`, a Feature's method map is used primarily for scriptable elements, and its class methods are used for non-scriptable calls (e.g. by the simulation engine sequencer).






