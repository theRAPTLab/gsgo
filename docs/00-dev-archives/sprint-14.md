**SUMMARY S14 JUL 06-JUL 19**

* W1: document [architecture](https://whimsical.com/Hd6ztovsXEV4DGZeja1BTB) so I can design [script engine](https://whimsical.com/N9br22U6RWCJAqSiNEHkGG).
* W2: capture activity [interactive intents](https://docs.google.com/document/d/15_z_fw7Lp0qwFL_wPGhRSvNs4DiLxf0yoGR6JFmZdpA/edit) and define [stack machine opcodes](https://docs.google.com/spreadsheets/d/1jLPHsRAsP65oHNrtxJOpEgP6zbS1xERLEz9B0SC5CTo/edit#gid=934723724).

---

## July 08 - Revisiting Conditional Execution

It's Wednesday! When I last left off, was stuck on the conditional engine. I need to have a look to see where that was. 

I spent a couple hours working on a new Whimsical diagram. I have the following classes outlined:

modules: agents, agentfactory

classes: agent, gvar, gstring, gboolean, gnumber

There are some **holes**:

* [ ] in `gboolean` there's a reference to a `condition` object with a `.state` prop, but this not defined. Maybe this should be just another gboolean?
* [x] need to outline `simulation` and `simulation-data` modules

There are some **conceptual gaps** in the system. Listing what does work and is yet to work:

* [x] document agent prop setting/getting works
* [x] document agent methods execution
* [x] document agent feature methods execution

Now the system feels **completely defined**...yay! What are some of the things that are missing???

Well, we are missing the execution engine, which itself needs the equivalent of an AST to parse.

* [ ] ScriptMachine definition
* [ ] How  does the ScriptMachine get invoked with a particular agent context?
* [ ] How to program the ScriptMachine? Manual AST? Mini-interpreter?

We also have to make the distinction between **individual** agent execution and **agent set** execution. These use similar expressions but have different implementation requirements

* [ ] Referring to a PROPERTY in an AgentSet-wide ScriptMachine program
* [ ] Invoked a METHOD in an AgentSet-side ScriptMachine program
* [ ] Defining a **CONDITIONAL** FUNCTION in ScriptMachine - this is a test that returns true, OR a filter to return a set
  * [ ] Time based
  * [ ] Property Comparison Based
* [ ] Defining an EFFECT FUNCTION in ScriptMachine
* [ ] Defining an EXPRESSION in ScriptMachine
* [ ] Defining a COMPARISON in ScriptMachine
* [ ] Handling deferred execution of CONDITIONAL FUNTION
* [ ] Handling deferred execution of EFFECT FUNCTION

## July 09 - Where to Insert ScriptMachine?

I outlined Working on this [ScriptMachine definition](https://whimsical.com/N9br22U6RWCJAqSiNEHkGG) on Whimsical. It's a companion to [software design](https://whimsical.com/Hd6ztovsXEV4DGZeja1BTB) diagram.

There are some key ideas for the script engine:

* Works with **gvars** as the primary data type.
* Executes script operations AKA **ops**. An op is a kind of object distinct from gvar.
* Ops are gathered into **codeblocks**, which is an array of ops that have access to a passed **agent context**
* Agent contexts also have **props** containing gvars and **methods** that are Javascript functions.
* Agent contexts also have **features** that also use agent contexts for storage. 
* Agent contexts also have **queues** for receiving **events** from update to think to exec stages of the sim loop.
* Codeblocks can pop **args** and push **results** on the **agent stack**. These are all gvars.
* Codeblocks have access to a **local stack** for temporary storage.
* Codeblocks can be **named** or **anonymous**. 

There is a kind of **CONFUSION** between types of methods. The script interpreter works with a stack, but what about methods defined on the agent itself? Or do they all interpret script code?

We probably need to define a simple example

```
define Agent "Bee"
	// add feature
	addFeature Movement
		prop .input setTo "student"
	// define user property
	defineProp .nerd as Boolean
  	setTo true
  // specify condition
  if prop .nerd isTrue
  	prop .x add 1
		
```

An important caveat is that agents are controlled ONLY through prop values.

Methods are authored by us, and are packaged into FeaturePacks to hide implementaiton.

When a method is called, we only expect to receive PARAMETERS to configure a feature.

## July 13 - Inserting Script Machine

I started to refactor the way that the script engine works. I keep half-implementing a scripting solution when I hit **conditions** and **expressions**. 

### 13 Monday 0015

At programming time, I am creating a stack-based program to avoid making a Concrete Syntax Tree (CST) using the `AddTemplate()` interface. The programming operation creates a number of "operation functions" that are executed one-after-the-other. The result of each operation is put on the **value stack**, and is a gvar or literal value. 

There are special case commands:

* **invoke** will pop the last value on the stack and attempt to access a method on that object, as well as any arguments that are passed. It's here where the arguments my have to be additionally decoded into other instructions *recursively*.
* **conditional** invocation executes a **block** of instructions, which maintains a **scope stack**. However, I wonder if I am better off just implementing a more mature solution than reinventing the wheel.

I'm a bit stuck on the best way to write the interpreter for conditional execution. I'm torn between writing the parser directly and then a CST viewer. This still means defining the grammar, but maybe this IS the way to do it correctly.

Will sleep on it...

### 13 Monday 1545

There are two tasks apparent to me:

1. Write a **canonical source** in GEMSCRIPT
2. Hand-compile this into the **concrete syntax tree**
3. Hand-execute CST using a **CST walker** that works with our **agent object**, **gvars**, and our missing **conditions** and **code blocks**

I have reviewed the source scripts for GEMSCRIPT again and am reminded that none of the scripts are really complete, or should even be followed as a guide. The general takeaway is that it should be as simple and direct as possible. That **makes the implementation much easier** since I just need to limit this to a subset.

I think my first pass script will just focus on simple incrementing/decrementing of properties, position, skin, and costumes. For logic, we will just work with conditions returning true/false that can execute a code block consisting of statements that:

* define an **operation function** (ops) that receives **context agent, stack** and push/pop parameters via stack
* defines a **block** of ops
* **invoke** a block of ops
* **conditionally invoke** a block of ops based on the popped value from stack
* invoke a **nested** block of ops
* push/pop a current **scope** [either agent, property, feature] for the current op

What I need to flesh out is whether to do this using [pointfree](https://github.com/thi-ng/umbrella/tree/develop/packages/pointfree-lang) or not. After reviewing it, it actually is implemented using **PegJS** so I think I might just implement my own version as an engine first.

### 15 Wednesday 0130

Working on the stack machine...committing to it.

### 16 Thursday 0030

Started at 0015, but got sidetracked into Typescript BS that I probably didn't need to do. Took two hours and killed my buzz. Now getting back into it.

* [x] write opcode functions that return a (agent,stack,scope) SMOpExec function

* [x] Agent.method(name) should get methods from passed stack, but return an SMOpExec function

  

Defined ops:

* pushVar, pushProp, setPropValue
* addProp
* popRef, refProp, refAgent
* callRef, propRef

I should be able to **make a program using stackmachine-ops** now. Then I will write code to **execute** it.

### 16 Thursday 0700

let's write a program! We have initialize and update working in our test `agents` module, so the proof of concept works!

There are some things to work out:

* callRef, propRef semantics
* whether the stack can store anything other than a GVar
* Make sure that Agents and GVars have the same prop/method interface so they can be used interchangeably with callRef, propRef

### 16 Thursday 1545

I feel like I can make a spreadsheet of the operating codes. I'll spend 15 minutes transcribing the current ones...90 minutes later, I'm finding I have to fix some operations, notably the **scoped invocations**.

* [ ] make sure GVar and Agent both have a method() and prop() interface

* [ ] GVar will inherit Agent's prop and method maps

* [ ] GVar becomes the base type of Agent, which becomes a GAgent


```
// stack machine opfunctions can call agent or prop variables directly
interface StackMachineObject {
  call: (name:string, ...args) => any;  	// invoke a method with args
  prop: (name:string) => GVar;            // get a prop by name and return value
}
```

Ok, there are some **problems** with how I'm implementing this. I need to know specific features. I need to make a one-for-ine opfunction list for every existing comment in the class-agent. Then I need to make the same list for 

### 17 Friday

The was spent designing and writing a stack machine reference. There are several resources:

* [StackMachine Interaction Intents](https://docs.google.com/document/d/15_z_fw7Lp0qwFL_wPGhRSvNs4DiLxf0yoGR6JFmZdpA/edit?usp=sharing) - These are the intents gleaned from the original IU "Early Tinkerings" examples
* [StackMachine Opcodes](https://docs.google.com/spreadsheets/d/1jLPHsRAsP65oHNrtxJOpEgP6zbS1xERLEz9B0SC5CTo/edit?usp=sharing) - Opcode Reference WIP

These opcodes are defined using a particular function signature that receives a "stack machine context" consisting of a scope stack, an argument stack, and an agent. Arguments are passed/returned through the stack. Methods and properties are referenced using the scope scope that implements those interfaces. State changes and memory is handled by the agent object. 

The next step is to write some kind of conditional check that runs at the right place in the simulation loop.

