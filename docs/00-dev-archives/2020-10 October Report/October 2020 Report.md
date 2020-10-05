# GEM-STEP October 2020 Progress Report

## Overview of Work to Date

We're starting to hit the point where systems are coming together. It has been a longer time coming than expected, but we have built a lot of good infrastructure that will be reusable in the future. 

Before we get into current developments, here are the highlights of our development to date for GEM-STEP:

1. Made a **Development Environment for Managing Multiple Related Codebases**. With the number of independent servers and web application codebases, this was critical to make sure all related code was in one repository. 
2. Extracted **Relevant Code from STEP/PLAE projects** to merge into our current development stack. Most notably this is the **PTrack** module.
3. Built the **Admin Webapp Framework with NextJS**. This wraps our favored web technologies into a clean prototype building framework. To date it has been more useful for wireframing screen flow concepts, but when we start writing the admnin interfaces it will be an improvement over our old system. 
4. Made the **GEMscript Scriptable Simulation Engine** from the researcher specifications, further resolving details until we could implement. It's a stand-alone module that can exist in multiple code environments. 

With the GEMscript engine finally in a working state, in August we needed to create ways of *visualizing* what it was doing. The script engine was capable of defining simple programs and executing them in agent instances, but the visualization tools did not exist. We took this as two parallel tracks of development:

5. **GEMscript Simulation Renderer:** This is the pipeline that converts agents data into abstract "display objects" that can be transported to a **renderer** that converts them into "visual objects". The renderer can be on the same machine as the script engine or across the network. 
6. **GEMscript User Interface:** The User Interface is distinct from the renderer in that it is used to manipulate the data model itself, not its appearance. The critical screen experience we are working toward is the **Agent Modeling / World** area, which harkens back to the researchers original specification.

As of October 5, we have **(1)** the Renderer and **(2)** a rough implementation of the Agent Modeling / World user interface.  These are still separate codebases, but moving forward we will merging them together so we can experience what the modeling/simulation experience is like. 

## Development Highlights

This is a more technical description of the key pieces we've built for GEM-STEP to date. You can **safely skip this section** and proceed to the **Next Tasks** section to see what is next on our list of systems work. That said, the **Scriptable Simulation Engine** section goes into considerable detail about what can currently do and how we have tried to meet the needs of GEMscript.

The highlights are listed in reverse chronological order, so if you just want to see what's new just read the first few sections. The sections are:

* GEM-STEP Renderer
  * Pool class for efficient management of resources
  * MappedPool for efficent transformation of objects into derived objects
  * SyncedMap for managing sets of Pools and MappedPools
  * Agent to DisplayObject to VisualObject Pipeline
* GEMscript Engine
  * Observations
  * Implications for Script Engine
  * GEMscript Program Design
  * Handling Conditional Execution
  * Stack Machine Code Model
    * SMC Opoerations
    * SMC Program Generation
    * SMC Program Execution
    * Expanding the Opcode System
    * Overall System Design Diagram
* PhaseMachine Class
* Universal Cross-device Messaging System

### GEM-STEP Renderer (September 2020)

In the earliest version of STEP (2014) we had designed a system that could run on a single powerful laptop acting as a web application server on a LAN. With the extensions to STEP, PLAE, and ISTEP, we have added more and more devices with increasing data demands on the old infrastructure until it started to break (video synchronization with annotation is the most notable example). To address these problems in GEM-STEP, we had to rearchitect the original STEP model to work across multiple machines as a single coordated system. 

The GEM-STEP Renderer is responsible only for drawing graphics without having to do any simulation or other calculation. It receives a *DisplayList* periodically from a source and faithfully renders them to the screen. 

We developed some cool stuff to make it easy to extend this system:

#### "Pool" Class

This is a data structure that maintains a number of objects that can be allocated and deallocated. It is useful when creating/destroying objects is computationally expensive (i.e. creating a graphics sprite), and reusing them is faster. With this generalized class, we can now manage pools of all kinds without having to write custom code for each case.

#### "MappedPool" Class
This performs two operations: 
1. it compares a source set of objects with a destination set, determining what objects have been added, need update, or were removed
2. it creates/deletes objects in response to changes. This was a key operation in the first version of STEP, used first for converting PTRACK entity data into objects in the world simulation. 

For the Renderer it was necessary to convert the set of agent instances in a corresponding set of display objects, and then to convert a set of display objects into sprites. Our generic "Mapped Pool" uses the Pool class to manage instances that are added/removed. It's a useful abstraction for any operation that requires differencing sets of data that share a common reference ID. 

#### "SyncMap" Class

Using the Pool and MappedPool classes still require some boilerplate code, which reduces the readability and "expressiveness" of our code. The SyncMap class eliminates the boilerplate by creating and managing instances of these classes for you, so you can focus on the behavior of your code, not its implementation.

To use a SyncMap, you do the following:

  * create a new instance `syncmap` and set the `onAdd()`, `onRemove()`, `onUpdate()`, and `shouldUpdate()` functions that will be called.
  * call `syncmap.syncFromArray( arrayOfObjectsWithId )` to calculate  `updated`, `added`, and `removed`  items since the last invocation of this command.
  * call `syncmap.processSyncedObjects()` that will filter each change through the `onAdd()`, etc. functions.
  * call `syncmap.getSyncedObjects()` to retrieve the current list of "synced" objects. 

The exciting thing about this class is that it makes **differencing operations on sets of objects** easy to do while also efficiently managing the resources for speed; to customize the differencing operations, you provide the `onAdd()`, etc functions. The code is all in one place in a relatively compact structure that can be modularized and reused.

#### "Agents" to "DisplayObject" to "VisualObject" Transformation Pipeline

These are very similar to concepts we implemented in STEP before, so don't represent anything particularly new.  However, in GEM-STEP we've made the distinctions between them much cleaner due to the Renderer existing as a stand-alone module. 

The Agent objects are controlled by the simulation module and by students providing active input. These are pure data constructs. While we could just walk through every Agent instance and *DIRECTLY* draw a Sprite for each one, this couples the drawing operation to the simulation so they must exist on the same machine. So we have split the operation into two transformations:

1. **Convert Agent Objects into Display Objects**: Display Objects have only the necessary data that *DESCRIBES* how to draw something. It doesn't know that it is an agent, it just knows that it is supposed to draw a particular picture at a coordinate on the screen. This conversion is done through SyncMaps by the Simulation Engine.
2. **Convert Display Objects into Sprites**: Sprites are the actual code bits that make something appear on the screen. For every frame, the set of display objects (a "display list") is run through another SyncMap to apply the drawing instructions to the matching Sprite instance. This conversion is done by the Renderer when it receives a new display list, which can be from over the network or the local machine. 

A big advantage of this approach is that display objects can be much more efficiently encoded for transport over the network, and they can also be buffered in memory for "scrubbing" behavior. There is some work to be done on compression of the display object, so we are hopeful that we will get excellent performance from this approach. Currently over a wireless LAN, sending 

For conceptual symmetry, we will have the **reverse operation** of creating an **input pipeline** that goes from clients to the simulation engine. Examples of the inputs are clicks to select objects and Annotation events. Encoding these events into  **ControlObjects** and sending them to a particular **Input Processor** is what we will be formalizing in the near future to support the Faketrack-style controllers.

### Scriptable Simulation Engine (August 2020)

**This new module is the heart of GEM-STEP's modeler**, and took much longer to develop due to the amount of detailed program modeling we needed to get our heads wrapped around it. 

We made some simplications for the computation model that we don't think will  affect the researcher vision for the tool, but that is what you guys will be telling us! 

#### Observations

As a general philosophical point of reference, we kept some observations in mind to help us make technical design choices:

* We took Corey's observation that teaching computational concepts wasn't the main goal of the tool---modeling was! This combined with the experience of watching the grad students try to model activity units further underscored the point of trying to find **more conversational** and **less computer-y** ways of expressing intent.
* We observed that while it was difficult to discern the "programmer's intent" from the very early scripting examples from the graduate students due to the variation in programming literacy, it became much clearer when we thought in terms of **intent** of the code to **depict a behavior or interaction** through some kind of **visible expression** of the underlying invisible **data model**. This insight informed how we implemented certain features in the scripting engine.

#### Implications for Script Engine

These observations were particularly helpful in figuring out how to approach the more powerful (and therefore difficult-to-implement) features of the system. Some of the rules of thumb we added:

* **Scripted agent changes and effects** are handled by simple property assignment as much as possible. These are well-suited for modeling **persistent effects such as changing a costume, moving a sprite, choosing a type of input, etc. 
* **Bundle complicated code into Features, so students can focus on behavior and intent, not computation**. When it is not possible to express the intent with a simple property change, the complicated programming is bundled into a **Feature** that is assigned to the agent at template creation time. While the general scripting language allows the kind of counter-based program modeling we saw in early script drafts, many of these features are better handled with specialized code. The initial features we foresee are *Movement* and *Costumes*. Features include their own properties and methods that can manipulate the built-in properties like `x, y, skin`. 
* **No user method declarations!** The GEMscript examples don't call for user-defined functions. Instead, the focus is on what the early GEMscript draft calls **Interactions** as the primary anchor for blocks of script comands. We think this will be OK; introducing methods/functions might complicate the modeling activity more than necessary, but we will find out in trials if this is a desirable feature.
* **But method invocation is OK!** While users can't defined methods themselves, we can provide them to perform actions that have an **momentary trigger effect** or **timed effect**. Any case, we will know more whether this is a good decision once we start implementing all the effects.
* **Avoid complicated conditional statements.** We are not completely sure if this is the way to go, but we are implementing conditions as either **set filtering operations** or **stacked filtering conditions** that terminate in the execution block. This can implement an AND operation. For OR operations, we are thinking that parallel statements can be used (e.g. `if a==1 executeProcA` followed by `if a<10 executeProcA` being equivalent to `if ((a==1) or (a<10)) executeProcA` It makes it a little easier to implement than having to parse expressions, and suggests a simpler isual approach.
* **Defer implementing the ability to enter arbitrary expressions.** This is primarily a decision made to get our first pass of the scripting engine completed. Internally we have the means of calculating expressions, but writing an expression parser is something we don't need right away to test simple arithmetic operations and comparisons. It is an entirely different ball of wax which we describe in the Script Engine internals section of this document. The combination of Features and Property-based Changes, plus additional smarts we can put into the property classes (ranged numbers, for example) might make it unnecessary. If needed, though, we will add expression parsing; it just may take considerable time to research ways of doing this with pure Javascript instead of using a desktop tool (unavailable on Chromebooks) or doing a server-round trip to do the evaluation for us (maybe too complicated to keep track of, prone to lag). 

#### GEMscript Program Design

We make the distinction between "Agent Templates" and "Agent instances" as distinctly different types of entity.

* **Agent Templates** are **functions** producing Agent Instances *that can be defined by students* . Anything that can declared and/or can be arranged in an order of execution is by nature a **scripted program**, not Javascript.
* At **Definition Time**, Agent Templates perform only these functions:
  * Define a **Base Template** that serves as the foundation for this Template (like a super class).
  * Define **User Properties** with type and default value
  * Define **Features** to add, which automatically add their own properties and methods, along with any user-supplied default values
  * Define **Interactions** that are the "when" clauses. As far as we can tell, all interactions are a form of **scripted test** followed by a **scripted program** that executes if the test evaluates true. 
* At **Instantiation Time**, Agent Templates are used to generate multiple instances to be saved in the simulation engine's Agent Array. This is handled by our simulation engine code, but there is one more program function:
  * Define **per instance initialization** for each individual agent instance. This overrides the default value set in the Agent Template.

From this understanding, we have four distinct **kinds of scripted program**:

1. Agent **Template Property and Feature Definition** Program
2. Agent **Template Property Initialization** Program
3. Agent **Instance Property Initialization** Program
4. **Conditional Definition** Programs, which are comprised of:
   * A **Test Program**, returning TRUE or FALSE
   * An **Effect Program** conditionally executed on TRUE or FALSE result from the preceding Test Program(s)

These programs are implemented internally not as GEMscript syntax, but are expressed in what we call **stack machine code** or SMC. 

#### Handling Conditional Execution

We have a lot of different kinds of conditions/interactions that will be expressible in the GEMscript Modeling Interface. Here are some examples using a **made-up set of keywords** to get the idea across (these are something we'll be developing with you closely as we get real experience with the tool). 

```
// interaction 1
when prop x greaterThan prop xMax
    prop x setTo 0

// interaction 2
when Bee touches Flower insideRadius 10
    Bee.nectar get Flower.nectar
	  Flower.pollen give Bee.pollen

// interaction 3
onFrame 
    Sun.time increment
    Moon.time increment
    if Flower.death lessThan Sun.time 
       Flower bloom
       
// interaction 4
when TimerA expires
    Bees explode
    Flowers explode
 	  TimerA reset

// interaction 5
// stacked filters producing set of matching Bees
for Bee.count greaterThan 100
and Bee.health lessThan 10
and World.time greaterThan 1200
   Bee clone  
```

These are all what are considered **conditions** internally, though the student-facing nomenclature can follow what it needs to for clarity. 

A **condition** is comprised of two programs:

* a **test program** producing true or false that "filters" either a **single agent set** or **pairs of agent sets**
* any **effect program** that is run depending on the result of the test program

It is not yet clear yet *WHERE* the interaction editing  will appear in the modeling interface, but GEMscript engine treats as a special kind of Program for several reasons:

* Although the condition may be defined inside an Agent Template, the conditions may be "hoisted" to a higher-level object for efficiency. For example, the `Bee touches Flower` test is a potentially expensive computation and .we don't want to run it for each bee+flower instance. We want to run it ONCE and then send the results to each affected agent or agent pair.
* Some test programs can run only after a particularly point in the simulation loop, and some effect programs also require execution in a particular place. We have to detect the type of condition and therefore run those programs in one of potentially dozens of places. For a discussion of this, see the **Phase Machine** section of this document.

The Conditions engine is the least-defined part of the script engine, but these are our goals. Once we are able to do simple Agent Programming with the Modeling Interface, we think that will be a good time to fully develop the feature. That said, there are a few **key ideas** that we have:

* Generate a **Condition Signature** so if we detect multiple agents using the exact same condition, we can direct them all to the same single condition that runs once. The signature can be used to store all conditions as references for reuse.
* Use an **ActionQueue** to inform each agent what requests have been made of it. When all the conditions run at the same time in the simulation loop, they will use the queue to tell each agent what to execute by providing the program. 
* The ActionQueue can contain either an **event** or **program**. Events are inspected during the Agent Update phase, while programs are run during the Agent Execution phase (see the **Phase Machine** section of this document for more information about phases).
* **Per-agent conditions** that test for conditions unique to an instance are queued in its own Condition Program store. These conditions also stuff the test results into the ActionQueue for later execution.

At this point in time, the **most pressing condition engine challenges** are:

* how to generate unique condition signatures for hashing
* writing and testing the large number of conditions with many variations

Again, this is something we'll be tackling as we get the Modeling Interface working and can experience it in practice.

#### Stack Machine Code Model

We have talked a lot about programs in the previous section, but not what programs actually are. 

The Stack Machine is the execution engine that we built to allow for arbitrary ordering of operations. For speed of execution (and ease of development) we have a base set of **operations** or "ops" that know how to operate on **Stack Machine Objects** which implement the following common properties and methods:

* `prop( name )` returns a property object that itself is an SMObject
* `method( name ) `invokes a function reference or SMC program
* `value` is used to get/set the "value" of the object

The following are all SMObjects, and thus implement these common elements:

* Agent - our base type for all simulation objects
* Property - our value storage object, with its own methods
* Feature - a collection of methods and properties

As you might have guessed from the name, SMC programs run as a simple stack machine, which is somewhat like an 8-bit microprocessor in its simple concepts but applied at the Javascript object level. 

##### SMC Operations

An `SMC_operation` is implemented as a function that receives an `SM_State` object and the agent instance to operate on. It looks like this:

``` typescript
// EXECUTABLE OPCODE EXAMPLE
const add = (agent: IAgent, STATE: IState): TOpWait => {
  const [a, b] = STATE.popArgs(2);
  STATE.pushArgs((a as number) + (b as number));
};
```

The `add` opcode pops two numbers off the stack as `a` and `b`, adds them together, and then pushes the result back on the stack. An SMC Program is merely an array of such functions, called in-order and passed the same agent and state objects to provide persistence. As each opcode executes, it can mutate the agent and use the stack to pass results to the next instruction; it's very much like an 8-bit machine language in concept because that's what we grew up with. As a nod to modern Javascript, these functions can optionally return a `Promise` to hold completion of the operation, which is useful for timing operations. 

There is a extensive set of basic opcodes available, and since they are functions they are easy to add if you can think in terms of Reverse Polish Notation and understand our SM_Object model (more on that later). 

##### Generating SMC Programs

To generate these functions into program form, we use a **opcode generator** that emits `TOpcodes` (the function signature of the above example). The complete opcode generator for `add`  looks like this (with Typescript clutter removed)

``` typescript
// OPCODDE GENERATOR EXAMPLE
const smc_add = () => {
  return (agent, STATE) => {
    const [a, b] = STATE.popArgs(2);
    STATE.pushArgs((a as number) + (b as number));
  };
};
```

The `add` function returns an anonymous function every time it is called. This is used to "compile" our opcodes into executable Javascript without going through a parser stage.We do require that the GEMscript UI will be able to call the appropriate opcode generators in-order to generate the program. 

Here is an example of a Javascript code block that generates a program, using 4 opcodes: 

```typescript
// GENERATE PROGRAM EXAMPLE
const program=[];
program.push( smc_push(1) );  // push immediate value 1
program.push( smc_push(2) );  // push immediate value 2
program.push( smc_add() );    // pop 1, 2 then add, and push 3
program.push( dbgStack(1) );  // debug print top of stack (3)
```

This program just adds 1 and 2 and stores the value on the stack, which isn't very exciting but demonstrates the basic idea. The contents of the program array looks like this (simplified and )

``` typescript
// CONTENTS OF PROGRAM ARRAY
[ 
  (agent, state) => {
    STATE.stack.push(gv); // gv (1) is bound from generator call
  },
  (agent, state) => {
    STATE.stack.push(gv); // gv (2) is bound from generator call
  },
  (agent, state) => {			// calculate and save result!
    const [a, b] = STATE.popArgs(2);
    STATE.pushArgs(a+b);
  },
  (agent, state) => {			// debug print
		const { stack } = STATE;
    u_dump(num, stack, desc);	// num, desc are bound from generator
  }
]
```

A point of Javascript programming that makes this work: The variable assignment for `gv`, `num`, and `desc` are not visible here because they were part of the **generator** function that made these functions. Since these are anonymous functions, however, they remember the context in which they were formed; the values here are the arguments provided by generator function, and bound through the magic of **closures** to retain the context. In this way, we can generate arbitrary functions and not worry too much about how to manage all this interlinked state. 

It might be clearer if you compare the implementation of the `smc_push` generator with its output (again, with Typescript clutter removed):

``` typescript
// OPCODE GENERATOR DEFINITION
const smc_push = (gv) => {
  return (agent, STATE) => {
    STATE.stack.push(gv);
  };
};

// OPCODE GENERATOR INVOCATION
let anOpcode = smc_push(12);

// CONTENTS OF GENERATED OPCODE
(agent, STATE) => {
    STATE.stack.push(12); // effectively this is what happens
};
```

##### Executing SMC Programs

To run an SMC program, you execute a simple loop as follows:

``` typescript
// PROGRAM EXECUTION (with made-up example objects)

let program = PROGRAMS.get('ExampleProgram');
let agentArray = AGENTS.getAll('Bees');
agentArray.forEach( agent => {
  agent.execute(program);
}
```

The `SMC.Execute()` function declares a STATE object consisting of a stack and condition flags and just calls every function in the program array.

``` typescript
// SIMPLIFIED EXECUTION LOOP INTERNALS

class Agent {
  ...
	execute( programArray ) {  
		const state = new SM_State( stack=[] );
		program.forEach( op => op(this, state) )
  }
}
```

##### Expanding the Opcode Systems

As mentioned before, we have a bunch of pre-existing opcodes which you can find in `src/app/modules/sim/script/ops`. These are easy to write, but tedious to work with because they do very little by themselves. 

However, because ultimately we are "compiling" arrays of functions, we can write **command generators** that **combine** pre-generated calls of opcode generators. These command generators can then be combined into bigger things with  **subprogram generators**. The output of all these . These commands can then be made available to the scripting interface to expand the language. 

In the cases where we need to write for speed, there is nothing stopping us from writing a function that operates directly on the agent instance itself. **All you need to do is generate a function that follows the opcode function generator signature:**

``` typescript
// SMC COMMAND GENERATOR TEMPLATE

function cmd_MyFancyCommand( names, places ) { 
  const program = [];
  // do any pre-calculations here and declare values you 
  // want bound to the generated opcode
  return (agent, stack) => {
 		// mutate the agent and stack as needed
    // use any precalculated values here that will be bound
    // through the magic of closures
	}
}
```

This should in theory give us tremendous flexibility without sacrificing too much in execution speed. We can choose what opcodes to expose to students and what to hide in the GEMscript Modeling Interface.

##### Overall System Design

This is a high-level system overview, covering many of the concepts we've discussed in this section.

![2020-1005-module-hierarchy](2020-1005-module-hierarchy.png) It is slightly out of date, but it does show the general relationships between all of the system parts for future reference.

### PhaseMachine Class (June 2019)

There are a lot of moving parts to GEMscript that require synchronization for all the pieces to work predictably. One of the first pieces of code we ported from the previous STEP versions was our runtime phase manager, which implemented a simple game loop. 

At the very basic level, a game loop looks something like this:

```
ANATOMY OF A GAME LOOP

1.  READ INPUTS
2.  UPDATE WORLD STATE
3.  UPDATE AGENT STATE
4.  PROCESS PHYSICS RULES
5.  PROCESS LOGICAL RULES
6.  AGENT THINKING
7.  AGENT EXECUTION
8.  RENDER AGENTS TO SCREEN
9.  CHECK FOR END CONDITIONS
10. JUMP BACK TO 1
```

These events happen in this particular order because each phase provides information that the subsequent phase needs. For example, after control inputs are read, we now know the intent of players and can update the controllable variables of their agents. These variables directly affect the calculation of physics or logical  conditions that have meaning as a game rule. The results of that affect what the agents want to do, and finally they may decide to take an action based on their thinking. At the end of it all, we want to check for conditions that may cause an overall change in the game state (win/loss?) and finally update what everything looks like on the screen. 

In the first version of STEP we hard-coded the loop because there was only one system, but in later versions we started decoupling the various systems from each other in favor of a message-based "hook" system. So if there was a piece of code somewhere that needed to process something during "PROCESS RULES OF THE GAME", instead of having to be called directly from a hardcoded game loop it could merely express interest in it and receive notification. 

For comparison, here's what a hard-coded coupled loop might look like: 

``` js
// A HARD CODED GAME LOOP
// modules are called directly
function DoGameLoop( intervalMs ) {
    INPUTS.ReadInputs( intervalMs );
    WORLD.Update( intervalMs );
    AGENTS.Update( intervalMs );
    PHYSICS.Update( intervalMs );
    LOGIC.Update( intervalMs );
    AGENTS.Think( intervalMs );
  	AGENTS.Execute( intervalMs );
		REFEREE.Evaluate( intervalMs );
  	RENDERER.Render( intervalMs );
    GUI.Render( intervalMs );
}
```

This is pretty easy to reorder if there is just one such loop, but in practice we have several loops that may be started from different places. An example of this is how the STEP applications startup. In addition to the Game Loop, there is the Application Startup Sequence, each "phase" of which must complete for the next phase can run. It can get pretty complicated; here is what the current GEMSTEP phase map looks like.

![2020-1005-system-phases](2020-1005-system-phases.png)

There are two distinct phase maps here: the **Application Phases** and **Simulation Phases**.  

For GEMSTEP, we wrote a new abstraction called **PhaseMachine** that helps us define phases in a simple declaration rather than hard-coding calls in a `DoGameLoop()` function. 

Here is what the basic call looks like:

``` js
// PHASE MACHINE HOOK EXAMPLE
UR.SystemHook('SIM/INPUT', ( intervalMs ) => {
  // do stuff to get inputs
});
```

Other modules can attach to the same hook and they will be called. We can write multiple  `PTrack`, `FakeTrack`, and `Annotation` modules that all hook the `SIM/INPUT` machine and they will all just run at the right time.

There are several other advantages to this approach:

* You can see the entire map and order of execution in one place, which is great for reasoning about the system and enforcing order-of-execution.
* Any module can tap-into the phase map *without having to reference another module*, eliminating some of the circular-dependency issues our earlier code faced.
* It is easy to search the codebase for a specific implementor of a hook, since they are standardized strings. They mark exactly where code execution begins.

Here's a simplified example of **PhaseMachine Definition** for the Simulation Engine:

```js
const GAME_LOOP = new UR.class.PhaseMachine('SIM', {
  GLOOP: [
    // get state and queue derived state
    'INPUTS',
    'PHYSICS',
    'TIMERS',
    // agent/groups autonomous updates
    'AGENTS_UPDATE',
    'GROUPS_UPDATE',
    'FEATURES_UPDATE',
    // process conditions and collection
    'CONDITIONS_UPDATE',
    // agent/groups script execution and queue actions
    'FEATURES_THINK',
    'GROUPS_THINK',
    'AGENTS_THINK',
    'GROUPS_VETO',
    // agent/groups execute queue actions
    'FEATURES_EXEC',
    'AGENTS_EXEC',
    'GROUPS_EXEC',
    // simulation
    'SIM_EVAL',
    'REFEREE_EVAL',
    // display output
    'VIS_UPDATE',
    'VIS_RENDER'
  ]
});
```

Another key reason for using PhaseMachine is to **enforce order of operation.** This ensures that one operation is complete (e.g. loading assets from the Internet) before the next phase runs (i.e. code that requires the assets to be completely loaded before it can do anything). You just need to **return a Promise** and PhaseMachine will happily wait for it to resolve. Unfortunately there are no simple examples of this. 

In GEM-STEP we use PhaseMachine to synchronize to the network as well. 

### Universal Cross-device Messaging System (2016-DATE)

**URSYS** is the code that allows machines to talk to each other over the network, and it is designed to meet our desire for highly readable and expressive code. It grew out of our experiences with the first version of STEP, when we had to write a lot of asynchronous network code and it suuuuucked. URSYS fixes that by using a "message passing" design. Instead of writing pages of code, the calls now look like this:

```js
UR.Send('NET:DISPLAY_LIST', data); 
...
UR.Receive('NET:DISPLAY_LIST', data => {
  console.log('I got data', data);
});
```

The sender and receiver can be any device connected to the application server. We can also do **remote procedure calls** with a similar structure:

``` js
UR.Call('NET:GET_DISPLAY_LIST',data)
.then( data => {
  console.log('I fetched this data',data);
});
...
UR.Receive('NET:GET_DISPLAY_LIST', data => {
  const { config, otherStuff } = data;
  ... construct display list ...
  return displayList;
})
```

This implementation hides an enormous amount of code. This diagram gives you an idea of what is being managed behind the scenes for just for the call described above:

![2020-1005-ursys-calls](2020-1005-ursys-calls.png)

For GEM-STEP we've packaged this and other features into a portable version of the **URSYS library**, which makes it easier to prototype derivative networked projects with a single import. The library self-initializes connection to the URSYS network without any additional configuration, and improvements we've made to the code module system make it easy to just start using it when combined with our Javascript module templates.

A key extension we will be making for GEM-STEP is adding **messaging between servers**, which is a requirement for the distributed computing environment that GEM-STEP may need if we must support multiple simulation servers that talk to shared presentation and video servers. 

Here is our draft of the network architecture that we need to meet the specification:

![2020-1005-communcations](2020-1005-communcations.png)

Currently, URSYS-based systems have to be hosted by a central "message broker" that is also the web application server. In iSTEP, we found this performance limiting and difficult to synchronize, so we will try to address this as we move closer to classroom testing. There is quite a bit of work to do on the networking side of things.

## Next Tasks

With the alpha deliveries of the Framework, the Simulation Script Engine, and the Renderer, we have most of the infrastructure to get to hands-up iteration. However, there are several major engineering sasks that are on our docket, roughly in the order we need to do them. They are all potentially lengthy and complexly interrelated tasks: 

#### GEMSTEP SYSTEM FEATURES

These are the next big systems on the immediate horizon. There is quite a lot of system design and definition, but they all draw on code knowledge from previous versions of STEP, so the technical challenge should be less than our first year of the project.

* **Review/Refinement of the Core Experience** - We see a lot of time coming up refining the model and improving the experience once you get your hands on it. While the bones of the system are in place, there are many details to suss out.
* **Annotation Streaming, Run Capture, Run Saving and Restore, Asset Management** - The next phase of system design requires implementation of all these features. They're essential to the modeling experience.
* **User Management and Administration** - We have quite a bit of past work to draw from, and we have a newer webapp framework that should be nice to work with. This task is what informs our Database design, as does the day-to-day workflow of students and teachers. 
* **Database / Database Server Design** - While we have database code from previous projects, but the requirements of GEMstep mean we will have to redo a lot of it from scratch. There are a lot of kinds of data and many different groups and roles. 

#### GEMSTEP INFRASTRUCTURE SUPPORT NEEDS

These tasks flesh out the larger scope of GEM-STEP operations for handling interaction across multiple groups of students, specialized servers, and potentially dozens of laptops and mobile devices. In particular, the last three challenges on this list are less clear in their technical challenge, as we need to do some additional discovery as to the feasibility of some of them.

* **URSYS Device Addressing and Role Manager** - URSYS allows servers and devices to talk to each other seamlessly, but currently doesn't have the means to handle multiple logical groups of devices in an intuitive way. 
* **Internet Support over WAN** - With COVID19, we are looking at how to support remote learning outside of the classroom network. This is potentially time consuming because of having to be concerned about increased latency and also security/privacy concerns. We are not experts in network security and may need to farm this out.
* **WebRTC Video, Video Storage, and Synchronization with other Datastreams** - Running video reliably over the network is hard enough; we also need to support "scrubbing" of simulation runs and try to synchronize video with it. The approach we tried last time didn't work well, so we will have to look into ways of improving the experience. We have some ideas, buit this is expected to be very difficult if not impossible task. To our knowledge, there are NO realtime video scrubbing systems that work over the Internet inside a browser. 
* **Mobile Device Support** - We again will be supporting two kinds of devices: (1) the "simulation server" for each group with a larger screen/more powerful processor, and (2) connected iPads with touch support to create Annotations and FakeTrack-style input into the modeling environment. We have had difficulties in the past with iPad performance with web video, which had made necessary the need for a custom app IOS app that sorta worked. IOS development is not our strong suit, so it will be a challenge to meet these needs without losing too much momentum. 

If you got all the way down here, thanks for reading! :-)