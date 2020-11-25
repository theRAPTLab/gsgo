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



## NOV 20 FRI - Last Push on Conditions Part II

We got one of the 4 conditions done. It occurred to me that **immediate expression test** doesn't need to store an anonymous function; it can just store the ast directly.

* [x] add `ifExpr {{ expr }} {{ conseq }} {{ alter }}` support...10 minutes to write!

To implement the last three  AgentSet, AgentPairSet, and Event conditions, we need to extend text parsing to **support multiline input**. Technically we don't need to do this because the keyword generators can emit TMethods directly, but without a GUI we need to expand the text interface.

Here's the script syntax I'm thinking:

```
if {{ agent.prop('foo') }} [[
  if {{ agent.prop('bar') }} [[
    featureCall Movement jitterPos -5 5
  ]] [[
    dbgOut('false')
  ]]
]]

onAgentPair Bee touches Honey {{ agent.prop('range') }} [[
  exec {{ agent.prop('x').increment }}
  exec [[ programName ]]
  setProp 'x' 0
  // the expression context passed is agent, subjectA, subjectAB
]]

onAgent Bee [[
  // return boolean
  agentProp x lessThan 0
]] [[
  // do something with subjectA
]]

on Tick [[
  agentProp x something
]]
```

So how do I **parse** this into ScriptUnits? Currently, processing a script line-by-line creates ScriptUnits pushed onto a `program` array. So the *extension to `class-script-tokenizer`* might look like this:

```
programStack = []
index = 0
function CompileSource(units:TScriptUnit[]) : ISMCBundle
	- 
function ExpandScriptUnit(unit:TScriptUnit) : TScriptUnit
	- returns new ScriptUnit with "{{ }}" and "[[ ]]" expanded
	
THE ALGORITHM!!!
line processor:
	check for leading // - quit
	check for [[
		if [[ and EOL
			index++
		if [[ and NOT EOL
			check for ]] on same line
			this will expand into [[ program ]] syntax
	check for leading ]]
		index--

```

* [x] Why are comments being turned into an array of letters?
  * [x] script-parser Tokenize() is returning everything...wascrashing in jsx output because of `comment` shadowing of variable (was picking up the class, not the local var!)

**that was a sidetrack** but now we can get back to **[[ ]] blocks**...

* [ ] CompileSource receiveds ScriptUnits, so **what makes ScriptUnits from text?**
* [ ] **script-parser** is what has `Tokenize()` and `TextToScriptUnits()` for full text and single lines, and it relies on **class-script-tokenizer** to do its
* [ ] We can add a function similar to `gobbleExpressionString()`, for the `[[ progname ]]` syntax

```
EXPORTS FROM TRANSPILER
CompileScript     : Script => SMCBundle
RenderScript 	    : Script => JSX
TextifyScript     : Script => Text
ScriptifyText     : Text   => Script

To insert our [[ ]] processor, ScriptifyText is the routine we need to look at. It's been moved to `transpiler`. 

splits lines at \n
each line is trimmed and put through m_LineToScriptUnit
the ScriptUnits are returned as a whole Script

in m_lineToScriptUnit, it calls the scriptConverter class tokenizer
in class-gscript-tokenizer, tokenize(line) is the main entry point. It sho

* in tokenize(line), we can look for **inline [[ ]]**
* to gobble multiple lines, though, we need to push this logic into m_lineToScriptUnit

```

The `ScriptifyText` calls `m_LineToScriptUnit` per line. We have to first **merge lines** based on the `[[` and `]]` found. 

**PreTokenizer Algorithm Continues**

* we want to parse sequential blocks until the final `]]` is detected
* the algorithm is find all the top-level open/closing `[[` and `]]`
* it's called `m_DeblockifyText()` in `TRANSPILER`
* It extracts all the blocks independent of the rest of the text

So I can detect the blocks now...but how do I compile them recursively? Insert `;` delimiters?

**This will split by linefeeds and ;** `txt.split(/\s*[;\n]+\s*/)`

* I think we have to make an intermediate version of the block format by using ;  parsing in the script tokenizer. We can combine the text back together.

* At this point, I need to be able to parse a `[[ ]]` as a **subprogram**, so I need to recursively scan for these blocks of lines, and ScriptifyText() each block. 

* ScriptifyText() will split the first level, and use DeblockifyText to create a `[[ ... ]]` string that is a **parameter** for a keyword. Like expressions, blocks use special syntax inline to designate. 

  * If a block node has just one element, it's parsed as a **program name**, so the scriptifier will automatically generate a `exec programName arg arg` whenever it sees ``[[ progrname ]]` syntax
  * **When compiling the text to scriptunits, the block start/end marks transitions for program compiling into program array.**
  * blockstrings are resolved before `m_LineToScriptUnit()`, it should call ScriptifyText on that block string. this is handled inthe gsccript-tokenizer

  

  Tomorrow, rewrite `ScriptifyText()` so it can walk the new datastructure and create **program arrays** on the fly as it parses each line.

## NOV 21 SAT - (Aside) Compiling/Executing Program Blocks

The Deblockifier takes the GEMscriptText with our new syntax and emits an array of captured strings of that are demarqued with [[ ]], which is similar to how we package expressions with {{ }}.

The produced array consists of groups of "regular keyword arguments" and "block arguments" in the aforementioned [[ ]] wrapper. The array is then turned back into text strings.

For example:

```
onAgentPair Bee touches Honey {{ agent.prop('range') }} [[
  {{ agent.prop('x').increment }}
  [[ TEST:programName ]]
  setProp 'x' 0
  // the expression context passed is agent, subjectA, subjectAB
]]
```

turns into a long string:

```
onAgentPair Bee touches Honey {{ agent.prop('range') }} [[ {{ agent.prop('x').increment }}; [[ TEST:programName ]]; setProp 'x' 0; ]] 
```

**NOTE** There are **line terminators** in the form of a **semi-colon** added to the inside of the main block. This is used to reconstruct the ScriptText string array so they can be reprocessed by the compiler.

This condition has compiled into a new TextLine of the form "keyword ...args" which can then be parsed by `m_LineToScriptUnit()` to emit a ScriptUnit of this form:

```
[ 'onAgentPair', 'Bee', 'touches', 'Honey', '{{expr}}', '[[block]]' ]
```

**NOTE** The ScriptUnit is comprised of either strings or numbers, so it is completely serialized. This is our base representation of GEMscript code. A complete Script is just an array of ScriptUnits.

At compile time, **CompileScript** takes a Script (an array of ScriptUnits) and does its keyword processing. The algorithm currently just walks the array of ScriptUnits unit-by-unit, performing the following steps on each:

1. apply ScriptUnitExpander to the entire unit array
2. read keyword from unit[0]
3. get keywordProcessor kwp for the keyword
4. call kwp.compile(unit) and receives a bundle of programs
5. add the bundle programs into the blueprint data structure, which is an object with named program types like default, update, conditions...
6. back to (1) until all ScriptUnits in the Script have been processed

The completed blueprint object is the sum of all programs generated by all keywords, in the order it is processed.

THE TRICKY PART

Expressions are represented as strings of the form "{{ expr }}" in a ScriptUnit, but the compiled output needs to evaluate the expression. This is handled through the **ScriptUnitExpander** in the compile loop. What this does is check a string to see if it has the {{ }} wrapper, and if it does it uses ParseExpression() to convert the string into an **Abstract Syntax Tree** (aka **AST**) object node, which then replaces the original string in the ScriptUnit. Only then does the keywordProcessor compile the expanded ScriptUnit.

The compiler expects parameters of specific type *in the order they are passed*. In other words, it's  up to the compiler method to know how to handle each type. Since compiled methods always receive an agent instance, the utility method agent.evaluteArgs() can be used to get the actual value of the expression at runtime. 

THE ADDITION OF PROGRAM BLOCKS

Theoretically, I can add the processing of [[ ]] blocks to the **ScriptUnitExpander** and **agent.evaluateArgs()**:

1. **In ScriptUnitExpander**, replace the "[[ ]]" with the compiled contents of the block. This means running compile recursively to generate all the programs (and potential nested programs) so they can be stored with the program output
2. **In evaluateArgs()**, if an Array is received assume it is a PROGRAM and run agent.exec()  on it, replacing the argument with the returned value from the program. Unlike ScriptUnitExpander, this doesn't need to run recursively because the program blocks have already been "inlined" by the compiler's recursive pass (I think)

So that's the next immediate goal for today.

CAN I CREATE THE TEXT BLOCK FORMAT IN SCRIPT UNIT FORMAT 2.0?
* [x] insert `m_ExtractBlocks()` and `m_StitchifyBlocks` into `ScriptifyText()`
  * [x] the output of extracted blocks is `[ [ "normal line", ], ["[["],...,["]]"] ]`
  * [x]  fix `m_StitchifyBlocks` to emit appropriate text format

Now, let's if we can actually expand blocks into programs

* [x] `m_ExpandScriptUnit()`: can I detect `[[ ]]`?
  * [x] Look at `m_ExpandArg(arg)`, add `m_expanders` expansion table
* [x] update `gscript-tokenizer` to handle `[[ ]]`
  * [x] add to `gobbleToken()`
  * [x] add to `gobbleVariable()`

Finally, we have to update **m_expanders** in `transpiler` to handle the block expansion.

* [x] Can we call `ScriptifyText()` from inside `m_expanders`?Apparently **YES**
* [ ] bug with gscript-tokenizer: the **gobbleBlock** actually needs to keep track of levels, using a similar approach to levels as `m_ExtractBlocks`

HOW TO PROCESS THIS?

```
[[ if {{ true }}; [[ prop x; prop y ]] ]]
- or -
[[ if {{ true }}; [[ {{ prop x }}; ]] -- here the ; shouldn't be there because the ; should be used to demarque the end of a textscript line, not separate terms
```

**The problem happens during compile, when it's doing the recursive call** and the lines with the **semi-colons** are not being split correctly.

The semi-colons are currently used to glue-together the output of `m_ExtractBlocks` but this isn't entirely correct. We need to remember the original lines somehow so we know how far to go. Maybe there is a specific `marker` array (an empty array?) that designates the EOL. **We actually don't know where the end of the keyword is** for multi-line statements. We can probably **infer it** as the terminal `]]` by itself marks the end of a keyword.

PICK UP FROM:

* handling **semi-colons** correctly as EOBs?
* trying an **EOB** marker if it's necessary
* recursive script building...what should it look like as a final data format?
* **special block syntax**: a `]]` by itself is END OF MULTI LINE, and a continuous chain of blocks must be linked by a `]] [[`. A block `[[` can start anywhere at the end of a line.

## NOV 22 SUN - ARGH

there are three operations

* convert text to blockArray
* convert blockArray to textLine
* process textLine into ScriptUnits, recursively expanding block arrays into programs

1. extract blocks produces array of string arrays. each entry in the array has either a "normal strings" array or a "block strings" array. The block strings array can contain additional "normal" or "block" string arrays. It can also have an "EOB" marker, indiating the end of a keyword has been reached after a series of [[ ]] blocks one after the other. These have to be inserted everywhere there is a detected end of statement.

2. when converting blocks into strings, we have to do the following:

```
if array is normal
	iterate over lines
	set lastLine to line
	add line to lines[]
if array is EOB 
	reset lastLine to ''
if array is a block, we're adding to lastLine
	iterate over blines
	if [[ lastLine += [[
	if ]] lastLine += ]]
	otherwise lastLine += bline+\r to encode linefeed
	update lines[lines.length-1]=lastLine
```

3. to parse a block expression through `m_expandify`, we need a recursive builder

```
compile: onAgent Bee [[ agentProp x lessThan 0\r ]] [[ if {{true}} [[ prop x\r prop y\r ]] ]]
	expandify: [[ agentProp x lessThan 0\r ]] and [[ if {{true}} [[ prop x\r prop y\r ]] ]]
		process a: [[ agentProp x lessThan 0\r ]]
			lines = 'agentProp x lessThan 0'.split(\r)
			compile lines by line in progA
			return progA
		process b: [[ if {{true}} [[ prop x\r prop y\r ]] ]]
			lines = 'if {{true}} [[ prop x\r prop y\r ]]'.split(\r) ** ERROR **
The algorithm has to defer compilation to the innermost [[ ]], so that's a scan operation

NEW ALGORITHM - FIND INNERMOST EXPRESSIONS
the expandify block has to expandArgs each time

"onAgent Bee [[ agentProp x lessThan 0\r ]] [[ if {{true}} [[ prop x\r prop y\r ]] ]]"
- expandify: ... "Bee [[ agentProp x lessThan 0\r ]] [[ if {{true}} [[ prop x\r prop y\r ]] ]]"
	return string, [block1] [block2]
	- expandify [block1]: ... "x lessThan 0"
		return string, string, number
	- expandify [block2]: ... "{{true}} [[ prop x\r prop y\r ]]"
		return expr, [block3]
		- expandify [block3.1]: ... "x"
			return string
		- expandify [block3.2]: ... "y"
			return string
		
So the basic idea is to call expandify until they all return.
And the m_expanders block code has to expand every line
			
```

* [x] check algorithm in `m_ExtractBlocks`

* [ ] check algorithm recursion in `m_ExpandArg`

  * [x] it seems to work, but it's hard to see what it's compiling

  * [ ] losing last word before EOB. units are gone. This is happening on the restitched code.

    * [x] `gscript-tokenizer` isn't emiting the first argument after keyword as token

    * [x] the tokenizer SEEMS to be returning the Bee identifier, but it's breaking here:

      ```
      in gobbleVariable()
      
      /* HACK GEMSCRIPT ADDITION FOR [[ tmethod ]] */
      if (this.exprICode(this.index) === OBRACK_CODE) {
        this.showProgress();
        return this.gobbleBlock(); // in gobbleToken() also
      }
      /* END HACK */
      ```

    * [ ] the issue is that gobbleToken() is hitting [[ after an identifier and is assuming it's an array instead of gobbling it. And this is overriding the found identifier so it disappears.  We need to change the logic OR change the identifier from `[[ ]]` to `<< >>` as a temporary workaround

      * [ ] changed to << >> in gscript-tokenizer
      * [ ] change to << >> in transpiler
      * [ ] there's some string issue in the runtime compiling...the recursion is passing an entire string that has some elements already converted to stuff?

  

  OK this is super annoying already. I think the output of the << >> is being hosed somewhere, but I can't find it. It's happening during SUB compilation at runtime. I see the error happening in **<< prop me ifProg {{ true }} << prop x prop y prop AA prop BB >>** which is incorrect... there's a missing close/reopen which is why text parsing is broken.

  

  This is seen in PARSING TEXT right now, so that means the units are busted.

  * fixed bug in transpile `endStartBlock` that needed to check if level > 0, not level ==1 (this might have some side effect)

  Still seeing a problem parsing the ifProg units that are nested 2 deep. The epansion at the top level seems to work.

  I'm seeing the problm in deblockfied: it's **split** in a weird place. It's because I pushed the node in deblockfy when `>> <<` is detected. 

  The issue seems to be here:

  ```
  m_expanders:
    '<<': (arg: string) => {
    	...
      const extract = arg.substring(2, arg.length - 2).trim();
      const lines = extract.split(LSEP);
      console.log(`converting "${extract}" into lines`, lines);
  ```

  At this point we don't want to expand all the lines, because it breaks all the pieces into weird bits.

  We need to break lines only in level 0, and preserve the rest of them. 

  

  Again, I see the issue with the third term of onAgent

  ```
  << prop me \r ifProg {{ true }} << prop x \r prop y \r >> << prop AA \r prop BB >> >>
  ```

  being converted into THREE ScriptUnits

  * expand `prop me`
  * expand `ifProg`, `{{ true }}`
  * expand `<< prop x \r prop y >>`, `<< prop AA prop BB >>`

  This should be just TWO ScriptUnits

  * `prop me`
  * `ifProg`, `{{ true }}`, `<< prop x \r prop y >>`, `<< prop AA \r prop BB >>`

  The routine that is tokenizing the line is having a hard time finding the {{ }} << ... >> pattern, because there's a linefeed being inserted by the block extractor.

  * AHHH, the moment we hit the second << then the level check pushes the buffer

  

  

  * [ ] also not seeing the compiled block arrays appear
    * [ ] seems they aren't being returns by the argument...changed so prog pushes **spread** program array

### BACK TO THE DRAWING BOARD

I need to restate this algorithm succinctly instead of relying on code to hold it together. That's stupid.

Given this syntax:

```
onAgent Bee <<
  prop x
>> <<
  prop me
  ifProg {{ true }} <<
  	prop x
  	prop y
  >> <<
  	prop AA
  	prop BB
  >>
>>
```

... I want to see SCRIPTUNITS at the end of all this ...

```
block code:
onAgent Bee
<<, prop x, >>
<<, prop me, ifProg {{ true }} << blockified format >>
```

ExtractBlocks  puts the `<<` and `>>` as separate items in the array. 

*** NEED TO BURN IT DOWN AND REBUILD ***

---

## NOV 23 MON - Task List to Recover

### Completing the Compiler

1. step away from the text block parser because it isn't easy or obvious.
2. make examples for manual ScriptUnit compiling by hand
3. make tests for examples
4. specifically parsing of: expressions, program blocks
5. integrate faketrack into simulation input
6. once that works, can actually write interactions, conditions

### Making Script Examples for IU/Vanderbilt

1. start with aquatic and try writing direct ScriptUnit code

### Framing the December 1st Deliverable - Ben will keep the flame here

* can we have them program anything with direct scriptunit entry?
* provide some basic keywords that make things change on the screen
* provide some basic features to handle movement
* provide some basic sprites they can use
* for unimplemented keywords: print out the keyword (like debug printing code style) so researchers can at least make-up placeholders on the fly as they try to write programs.

RIGHT NOW

* Ben is de-facto in charge of scripting development of keywords, needed features, using/defining the syntax in terms of what it needs to do with what parameters
* Sri is creating the final bits of the compiler to handle conditions which are comprised of a test, a p-consequent, and a p-alternate.
* When the compiler text-to-blueprint works, we can focus on the stuff Ben has been working on above. And then implementing whatever needs to be there for the basic experience.

## NOV 25 WED - RESETTING

I have to rewrite the block extractor and script unit maker so it is **one** module producing script units directly. This should hopefully solve the problem I had yesterday and it will also allow me to bring back the `[[ ]]` syntax!

But first:

* [X] make unknown keyword handling part of the script engine for ben.

That's out of the way now, so we can move on to the major attractions:

* [ ] rewrite block compiler to be the main script unit compiler
* [ ] change the keywords to emit a single prog, not a bundle (let block compiler handle it)
* [ ] change the block compiler to also redirect to a specific bundle
* [ ] add the new unknown keyword handling

**Rewriting the compiler**
* [x] make a test case file
* [ ] confirm that the compiler can actually compile them.
* [ ] 

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
