[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S12 JUN 08-JUN 21**

* W1: Agent simulation execution engine starts. Basic agent set/get, value types, condition types, phasemachine
* W2: Agent collections, featurepacks, filters, and event+phase management started

**SUMMARY S13 JUN 22-JUL 05**

* W1: features,agents,phases. gsgo clone repo. agent, agentset, event, pm module_init. agent template functions. agent and features into factories, composition. agent API and event forwarding. Conditions class design and message within workflow. test function encoding. 
* W2:  condition class engine, simulation-data consolidations. program+stack machine research

**SUMMARY S14 JUL 06-JUL 19**

* W1: document [architecture](https://whimsical.com/Hd6ztovsXEV4DGZeja1BTB) so I can design [script engine](https://whimsical.com/N9br22U6RWCJAqSiNEHkGG).
* W2: capture activity [interactive intents](https://docs.google.com/document/d/15_z_fw7Lp0qwFL_wPGhRSvNs4DiLxf0yoGR6JFmZdpA/edit) and define [stack machine opcodes](https://docs.google.com/spreadsheets/d/1jLPHsRAsP65oHNrtxJOpEgP6zbS1xERLEz9B0SC5CTo/edit#gid=934723724).

**SUMMARY S15 JUL 20-AUG 02**

* W1: opcode design, agent-script interaction design, diagram entire system
* W2: refactor to match system model, implement opcode/function execution engine, simplify system

**SUMMARY S16 AUG 03-AUG 16**

* W1: Added last pieces of script engine: condition objects, agent sets, tests, execution of subprograms.
* W2: Update [script engine docs+diagrams](https://gitlab.com/stepsys/gem-step/gsgo/-/merge_requests/9) as it stands now. Push repo. New wireframe based on Joshua diagram.

**SUMMARY S17 AUG 17-AUG 30**

* W1: Wireframing from Joshua, placeholder components
* W2: Port PTRack, issues with PixiJS and React and SSR.

**SUMMARY S18 AUG 31-SEP 13**

* W1: New FakeTrack progress, resurrect appserv architecture for pixiJS integration
* W2: Refit URSYS. Sprite and display list system architecture for clickable interactions

**SUMMARY S19 AUG 14-SEP 27**

* W1: Pool, MappedPool, Agent to DisplayObject, DisplayObject to SpritePool. Introduce testing modules.
* W2: Renderer, Sprite class, Asset Manager, Render Loop, APPSRV lazy loaded routes, URSYS hardening.

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

---

**DECEMBER 1 DEADLINE**
an agent or agent template that can be created
static or faketrack controls

+ set the skin from a list of assets? - good
+ some way to load/save? - make cheese API to save a file (port)
  + include both templates and instance list
+ simple prop set like nectar count - we have
+ get faketrack integrated into Movement feature
+ spawn list for instancing
+ how to show the selection dropdown for each type
+ Target Content Areas
  + Use Fish/Algae content area to model: x-gemscript (aquatic_blueprints001.gs)
  + If we get done, move to blueprints002.gs (advanced)

A good chunk of the next six weeks will be for just getting the UI to talk to the SIM engine, decoding. 

---

# SPRINT 23

## NOV 09 - Save Agent Blueprint, Instance, Simulate

### 1. Save the Agent Blueprint

```
[X] update the source in Compiler
[X] compile the blueprint and store it to AGENT_BLUEPRINTS
[ ] load blueprint and initialize agent with programs
[ ] how do extensions of agent templates work?
[ ] restart simulator via sim-api
```

`KeywordFactory` contains all the compiler methods, and blueprints. The blueprint stuff should move to `AgentFactory` though

* probably should save the SOURCE, not the compiled template.
* in BLUEPRINTS, save smc or scriptunits? **scriptunits** for portability

There's a difference between a Blueprint Source and a Compiled Blueprint.

* Blueprint source is in `ScriptUnit[]`, and is one fail
* Compiled Blueprint is a `IAgentBlueprint` 
* Keyword compiles one ScriptUnit at a time
* `ISMCBundle` is the compiled output

**working on class-blueprint**

* [ ] class-blueprint save
* [ ] agent-factory MakeAgent
* [ ] agent-factory GetBlueprint

use class-blueprint somewhere.

### 2. Blueprint class has to also include source

The blueprint class has to also store the source (`ScriptUnit[]`) .

* A blueprint object is loaded into the UI to render.
* `defBlueprint` is no longer needed; a single blueprint object contains only source for a single blueprint.
* blueprint contains the associated `smc` objects that represent particular things. They are arrays of `smc_ops` and so on

## NOV 10 TUE - Restarting Hermit Burn

We're in hermit mode. The world is dead to us for the next 48 hours. Where did I leave off?

* [x] `StageSimulation()` calls `GLOOP_LOAD` hooks (including program)
* [x] `StartSimulation()` calls `GLOOP` to step (including update)

* [x] `sim-agents:AgentProgram()`  attempts to make an agent through `AgentFactory.MakeAgent()`, but the blueprint isn't compiled yet

**Q. How to use a blueprint bundle to make an instance?**

A. blueprints consist of smc_programs or a function. We need to create an agent instance, then run the various programs on them to set things up.

**Q. Problem: sm_object methods aren't working**

this is crashing on `prop skin setTo 'bunny.json'`, which is doing this:

```
const progout = [];
progout.push((agent: IAgent, state: IState) => {
  const prop = agent.prop(propName);
  prop.method(methodName, [...args]);
});
```

The retrieved prop has its method called on it, but that's disallowed because props are of a var type; they must be invoked directly. 

* [x] fix `AgentProgram()` in `sim-agents`
* [x] fix `AgentUpdate()` in `sim-agents` 

* [x] Fixed issue with addProp not setting an initial value

Yay, it minimally works! Can write script and it updates. However:

* [x] SAVE reprograms and restarts

## NOV 12 THU - Cleanup and Refactor

Want to **document** and also do some expansion of **features**

* [x] remake `randomPos` into test keyword
* [x] add `jitterPos` to `Movement` feature

Next, let's review our code a bit to make sense of the flow

* [x] whimsical diagramming

Here are things I'd like to do:

* [x] rename KeywordDef to just Keyword
* [x] move BLUEPRINTS
* [x] move SMOBJS
* [x] move TESTS
* [x] move KEYWORDS
* [x] move KEYWORD management to class-keyword for automatic keyword registration
* [x] change `btn*` to `user*` to indicate these are user-initiated  actions
* [x] consolidate agent-factory, keyword-factory into `script-transpiler`

Ok, that's all done! **next up**: conditions, expressions

## NOV 13 FRI - Conditions Review

Ok, first up! Expression parser review! 

* [ ] Review Expression Parser and Tokenizer originals
  * [x] `expression-eval` not significant changes
  * [ ] `script-parser` based on `jsep`
    line 581: removed call expression parsing CALL_EXP
    line 629: added lastIndex tracking
    line 643: added range calculation, .range property

I want to be able to parse object dot notation, conditions, and expressions. The challenge is that the script language is based on spaces delimiting alphanermic, but not for punctuators. So something like `Movement.property()` will not work because the node turns into a call expression.

**RESEARCH** - I turned script-parser (based on jsep) into class-parser-gobbler. It seems to now work with expressions and calls; just need to **pass the context object into the evaluator**. It's possible to pass ANY object into the evaluator, even references to built-in objects like `Math`. 

There are **two choices**: 

1. evaluate expressions at runtime by passing the saved ast
2. compile ast into GEMscript

It might be easier to evaluate expressions at runtime for now.

NOTE: The evaluator can't do **assignments** to context.

* [x] How to write GEMscript source that allows **expressions**?
  A string beginning with `\x02` and ending with`\x03` (STX, ETX). Check `charCodeAt(0)` and end of string; if it is, then it's an expression and run the string through the expression parser. Alternatively, use `{{ }}` or `[[ ]]` as delimiters, which is probably better.
  use `string.substring(0,2)` and `string.slice(string.length-2)` to read the first and last character pairs of a string.
* [x] How to do GEMscript **conditional expressions**
  An expression evaluator is fed the AST and a context object (like `{agenta, agentb}`) , and produces the result `true` or `false`. 
* [x] How to do GEMscript **assignment**
  The persistent variables are our **agent properties**, so the regular `prop setTo expression` works. The expression can contain reference to agent property values inside of math.

* [x] How do CONDITIONS get saved and evaluated at runtime?
  A condition is a `TMethod` that returns true, false plus `TMethod`s that run if true or false. TMethods can be a **function** following `TOpcode` semantics, or an **array** of `TOpcode` function. In either case, a `TState` object consisting of a data stack, a scope stack, and a condition register are passed to and from the `TMethod`.  A **keyword** for conditions might exist, accepting an expression string or a TEST (scriptunit(s)), and then either a program name or a scriptunit (an array) or a source (array of scriptunits). 

## NOV 14 SAT/SUN - TODO

ScriptUnit, ScriptUnit[] are the "human readable" source comprised of an array of literal values, with the added literal "expression" of the form `"{{ expression string }}"`.

**Assignment keywords** can be assigned an expression or a literal value. 

The generated code for an assignment keyword with an expression argument think-aloud

```
SCRIPTUNIT: ["setAgentProp","x", ""{{ 1 + agent.prop('y') }}"]
=>
setAgentProp(propName, expr) {
  let ast = parse(expr);
  return (agent,state)=>{
    let result = evaluate(ast,{agent});
    agent.prop(propName)._value = result;  
  }
}

SCRIPTUNIT: ["agentProp","x", "setTo", "{{ 2 }}"]
=>
agentProp(propName, methodName, ...args) {
  args.forEach( arg => expressify(arg) };
  return (agent,state)=>{
    const m = agent.prop(propName)[methodName];
    if (!m) return `no method ${methodName}`;
    m.call(agent,..args);
  };
}
// convert expression strings in an arglist to ast objects
expressify(arg) {
  if (typeof arg!=='string') return arg;
  if (arg.substring(0,2)!=="{{") return arg;
  if (arg.slice(arg.length-2)!=="}}") return arg;
  // return an ast object
  let expr = arg.substring(2,arg.length-2);
  return parse(expr);
}
```

**SUNDAY** hopping in for an hour or two max. Where I left off on Friday was:

* [x] add the `{{ expression }}` argument support in script language

## NOV 16 MON - Adding Expressions/Conditions

Last night I got expressions out of `{{ }}` working. However, I need to fix the script tokenizer so it recognizes strings.

* [x] import `class-expr-parser` into `script-parser`, replace `Parse`
* [x] update text tokenizer so I can test scripts directly with strings
  * [x] where is it? The key routine is in `script-parser/TokenizeToScriptUnit`
  * [x] `TokenizeToScriptUnit()` uses simple string split. We need to actually parse.
  * [x] make parser ignore // lines
  * [x] make new parser `class-script-tokenizer` just for our TScriptUnit format
  * [x] we now have TWO parsers: one for Text, one for Source that also handles expressions

Now that we have baked expressions into the system, when do we evaluate them?

* [ ] agent.exec_func has to detect an expression object
* [ ] agent.exec_smc has to detect an expression object

for functions, they expect to receive a value, so we want to evaluate before it's called. 

**Where are all the places we can either Parse or Evaluate?**

## NOV 17 TUE - Adding Evaluator to Keyword Class

* [x] added `evaluateArgs(...args)` to agent class
* [x] update featureCall to use `evaluateArgs()`
* [x] update addProp to use evaluateArgs

The general process:

* wherever the `TOpcode` pattern is followed, we can use `agent.evaluate()` to parse an array of args or a single args, and it will resolve the stored AST to a runtime value using `agent` as the context. 

**Yay it works!!!** Next up: adding CONDITIONS :grimacing:

* conditions are tests that return true or false. these are TMethods..
* conditions have a consequent, which another TMethod that runs.
* conditions also have an alternate, which can be executed if condition fails

```
FREE WRITING
conditions exist as
IF [test] [consequent] [alternate]
WHEN [agent] [test] [consequent] [alternate]
```

* [ ] I'm not sure what this will look like, so let's try writing some keyword operations.

What is a list of tests? Let's look through pseudocode again to make a canonical list, from which we will make a bunch of keywords:

```
for regular agent blueprints, the TOpcode structure works fine. However, for CONDITIONS, they need a different function signature to execute at runtime.

AT RUNTIME, conditions always operate on a SMObject, AgentSet or AgentPairSet.

It looks like this for a single agentset
AgentSet -> agent -> if test(agent) agent.queueUpdateAction(conseq)
conseq is a program that runs, conceivable on agent.
the test function 

we also need to eventually generate an AGENT-TEST key, which means that the tests have to have names. Since tests are expresions or functions, it's not easy to generate a unique string key from the expression itself, so we'll have to store the tests themselves under another name that can be used to look up the key.

This happens during condition runtime. These are functions that just run. 

(1) The functions are generated by a condition-generating keyword:
* stores the conditional expression in TESTS under a key based on the parameters passed to the condition-generating keyword. These parameters are the agentset(s) and the testname.
* return a conditional runtime function that looks up the generated name for a result. If it doesn't exist, the results are generated and stored. Then, the conditional runtime function runs conseq and alter

(2) At runtime during CONDITIONALS phase:
* loads test results using the stored key from TEST_RESULTS (which will generate them if they're not already made)
* run the passed/failed through the conseq and alter programs

(3) what do the conseq and alter programs look like?
* they are NEW TConditional functions that receive (a,b)=>{ } function signatures. 

TConditional
TOpcode = (agent, state)=>{}
conseq = TOpcode or TOpcode[]
alter = TOpcode or TOpcode[]

conseq is generated from SOURCE (ScriptUnit[]) which is normal GEMscript generated by a Keyword

SO... the conversion looks like

[define]
[update]
[condition]
when Bee.honey > 10
then 
	self.costume = 'blah'
	self.honey = 0;
else 
	self.costum = 'bloop'
	self.honey increment

[GEMscript source]
looks like: WHENSET, AGENT, TEST, CONSEQ_SRC, ALTER_SRC
"when", "Bee", {{ agent.honey > 10}}", [ ["setAgentProp", "costume", "blah"],[ "setAgentProp", "honey", 0], [ ["setAgentProp", "costume", "bloop"],[ "agentProp", "increment" ]]

[COMPILER]
WHENSET keyword has part A and B
* if TEST is EXPR, save in TESTS
* otherwise if TEST not in TESTS throw Error
* get the TESTfunction (this will be unique instance)
* create AGENT+TESTNAME key
* in SETOPS map, see if 'AGENT' exist
* if not, add TESTfunction to its set (can have multiple)
* in CONSEQ, ALTER tables, store CONSEQ by AGENT+TESTNAME key
* 

[RUNTIME-CONDITION PHASE]
A. iterate over all SETOPS (keyed by Agent+TestName)
* get SETOP, extract AGENT(S)+TestName
* for all SETOPS run the test
* save in TEST_RESULTS (passed, failed) by AGENT(S)+TestName
B. iterate over all TEST_RESULTS
* TEST_RESULTS use AGENT+TESTNAME key, use this key to find CONSEQ
* if CONSEQ exists then then passed.forEach(agent=>agent.queueExec(conseq))

```



**where did I leave off** - I outlined how I think the conditionals will work. The trick is to run the conditions in two parts:

A. KEYWORD looks up TESTNAME in TESTS map

B. KEYWORD uses AGENTA, AGENTB as a key into a TEST_CANDIDATES map that stores the actual filter test in a Map<key,set>. The set contains the executable test function code, so there could be multiple ones.

B. at runtime, iterate over TEST_CANDIDATES keys and grab all the test functions. Extract the AGENTA, AGENTB from the key, and run the test. Store the passed,failed into a TEST_RESULTS map by AGENTA,AGNTB,TEST_NAME

**I'm still fuzzy on this logic** so I will need to diagram it

* Map1: key: TESTNAME, value: (a,b)=>boolean
* Map2: key: AGENTA+AGENTB+TESTNAME, value: test function set 
* Map3: key: AGENTA+AGENTB+TESTNAME, value: { passed, failed }
* Map4: key: AGENTA+AGENTB+TESTNAME, value: ISMCbundle with conseq, alter functions

Some tests can be hardcoded, to the `(a,b)=>boolean` convention. However, some might be generated on the fly through an expression. These will probably just generate a random test name then rather than attempt to reuse something similar.

Expressions used as a test when defining conditions will be added to the TESTTABLE with a unqiue name, so it can at least use the same runtime engine without special-casing it. PRE-DEFINED test though, like `touch` will be handcoded for efficiency, and therefore will always create the same key signature:

```
AgentA, AgentB, 'touches'
const testFunction = GetTest('touches');
runtime test key: "AgentA:AgentB:touches"
testFunction is AgentPairTest: looks like (a,b)=>{ return {passed:[{a,b}],fail:[{a,b}]}
save testFunction to ConditionMap<key,testFunction>
at runtime:
	(A. filter)
	iterate over ConditionMap for every key,value
	value is the test function to give to the agentpair filter engine
	run the loop for AgentA, AgentB instances, running the test based on the key
	(B. execute consequent for passing agent pairs)
	load the array from CONSEQUENT table 
	each element fo the array is a consequent (e.g. a program)
	apply every consequent to the agent pair to make it do the thing
	
run the consequent for all passing agent pairs, which does the thing to each
'AgentA:AgentB:touches' => (a,b)=>{ /* something that implements the touch test for agents */
```

WHERE IS THE CONSEQUENT/ALTER arrays saved when compiling the blueprint? And how do we run them. 

## NOV 18 WED - SYNC WITH BEN

Focus: try to make programs that "do things"

* Currently, the program source is written in `Compiler.jsx` as `defaultText`

* there is a cheeseball text language with this format (this is called "the text")

  ```
  // comment in front of line
  // [keyword] [string|expr|number|boolean]
  // keyword ...args
  defBlueprint "Bunny"
  addProp frame Number 2
  useFeature Movement
  prop skin 'bunny.json'
  featureCall Movement jitterPos {{0-5}} {{0+5}}
  prop "maximum fun"
  ```

* **keywords** are defined in `modules/sim/script/keywords/_all.ts`, which imports all the other keywords that are in that directory, so it's easier to import all the keywords at once
* each keyword is an instance of `lib/class-keyword.tsx`, which is the **translator** between "source code" (tokenized version of "text" into `ScriptUnit`, which is an array of the form `["keyword", ...args]`
* each keyword implementation is responsible for
  * converting a single ScriptUnit into compiled lines of code to be added to a program being assembled (e.g. making blueprint program)
  * converting a single ScriptUnit into rendered JSX, for insertion into an element in a GUI somewhere. this includes the component definition itself,
  * handles serialization between a React-style state object and ScriptUnit (converts object to array, basically)



QUESTIONS FOR MEEE

**Q. How to set 'AI' versus 'STUDENT' inputs in the Movement feature in these two cases**

* a student is controlling an agent, and it's dead, stops reacting, but moves with input
* an ai-controlled fish, on the otherhand, just stops moving

**Q. How to access properties inside of an expression `{{ agent.prop('x') }}`** 

**Q. Should we rename ScriptUnit to SourceUnit? I THINK SO**, but maybe it's a different kind of Script. a "script" versus "objscript" vs "gemscript" or ughscript"

**Q. How to make compiler tell you about unimplemented keywords politely instead of crashing**

* if keyword is unrecognized in sourceText (not sourceUnit), emit a null keyword that won't crash program, but still let you know that something was supposed to happen

**Q. How to define getter/setter in Typescript interface? (e.g. prop.tsx)**

**Q. For singleton Agent, have `defInstance` keyword instead of `defBlueprint?`**

**Q. Resolve defining conditions in the GEMscript Text**

* can we do multiline? How do you delimit a subprogram in the text format
* this means more parser work, **by implementing a stack and delimiter keywords**

**Q. What are the function signatures for `exec-*` in Agent?**

* `exec(TMethod, ...args)`
* `exec_smc(TSMCProgram, stack, ctx)` - default [...args] { args, agent }
* `exec_function(function, ctx, ...args)` - default { args, agent }, ...arrgs
* `exec_program(progName, [...args], ctx)` - default [...args], { args, agent }
* `exec_ast(TExpressionAST, ctx)` - default { args, agent }

#### How to add a route

To add a route for `CompilerGUI`:

Duplicate src/app/pages/Compiler to CompilerGUI
edit src/app/boot files to add the route:

* SystemRoutes to export LazyCompilerGUI
* SystemShell import LazyCompilerGUI, and add to render function

## NOV 19 THU - Last Push on Conditions (I hope)

* [x] where did I leave off? Let's rename Source to ObjScript? NAH...HOLD OFF
* [ ] try to register condition programs at blueprint compile time
  * [x] move script-parser, script-evaluator to lib (they are pure modules)
  * [x] `addTest BunnyTest {{ A.prop('frame')._value }}`
    * [x] `addTest.tsx` to implement - uses an expression for the test
      * [x] access `ExpressifyArg` from `lib/script-parser`
      * [x] access `RegisterTest` from `runtime-datacore`
    * [x] run `addTest` conditions in `agent.setBlueprint`
  * [x] make a global agent instance ub `class-agent`
  * [ ] make `runtime-globals` module
  * [ ] can we execute the condition through global agent?
    * [x] Where does it run? `SIM/CONDITIONS`
    * [x] move old sim condition code to `test-conditions`
    * [x] make new `ifTest` for runtime tests of named conditional
    * [ ] where to run it? during **agents update** so it runs every time

**MAJOR PROBLEM** - when defining an expression as the test, we don't have a way to pass in the agent context to the expression at evaluation time.

* when is the test evaluated? `ifTest(testName,conseq)`produces an SMC program. Note  that `conseq` also needs a context.
* what should the context be? it's always an agent object. maybe we have to pass-it-in as context explicitly, or as a third parameter. 

* [x] add ctx to IState and implementor SM_State as constructor for it
* [x] add context as a third optional ctx argument for `agent.exec`
* [x] fix all the agent.exec subcalls to pass along the optional ctx prop

**ifTest works!!!** we can now execute some kind of consequent by calling `agent.exec` again



>  **Target For Wednesday** - 1200 EST - be ready to start scripting the aquatic with Ben peer programming kind of thing. 




---

BACKLOG

```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List

Runtime:
[ ] Create Agent Template
[ ] Instance Agent Template
[ ] Control

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc
```

---