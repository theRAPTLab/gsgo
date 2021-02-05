[PREVIOUS SPRINT SUMMARIES](00-dev-archives/sprint-summaries.md)

**SUMMARY S20 SEP 28-OCT 11**

* W1: DisplayObjects w/ actables (drag). Generator and Tracker. URSYS diagram+enable network calls.
* W2: Sim-driven rendering. X-GEMSTEP-GUI review+integration. URSYS + gsgo refactor. 

**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

**SUMMARY S23 NOV 09 - NOV 22**

* W1: Save/instance agent blueprint, runtime expression evaluation
* W2: Start conditions, start a second gemscript tokenizer for blocks

**SUMMARY S24 NOV 23 - DEC 06**

* W1: handle multiline blocks, agentset and event conditions
* W2: finalize event conditions, delivery, break

**SUMMARY S2025 DEC 07 - DEC 20**

* W1: Port FakeTrack/PTrack into GEMSRV
* W2: Simplify agent prop, method, features for use by non-Sri peeps
* W2.1: Prep for Dec 23 demo, review features with Ben

**SUMMARY S2101 JAN 11 - JAN 24**

* W1: Ramp up 2020. Draft of System Overview docs.
* W2: Script Engine review of patterns, issues, needed fixes

**SUMMARY S2102 JAN 25 - FEB 07**

* W1: Parse dotted object ref, expand args. Add keywords `prop`, `featProp`, `featCall` touse dotted object refs. Need to insert context into runtime in three or four places.
* W2: inject correct context for runtime.




---

# SPRINT 2102 - JAN 25 - FEB 07

There are four things to look at:

* [ ] how to do the object dot references
* [ ] adding new `prop`, `do`, and `call` keywords
* [ ] how to set context per program phase
* [ ] how the execution module might look

### Object Dot References

There are two parsers. We want the script tokenizer one, not the expression one. That is `class-gscript-tokenizer`.  This is based on **jsep** that's been changed to scan our script format **line-by-line** returning an array of character-based tokens. There are some problems with the multiblock scanner (see comments for `gscript-tokenizer`)

So what does it handle?

* gemscript extension: directives (#) returns 
* gemscript extension: [[ ]] and {{ }}
* numeric literal `isDigit`
* string literal `isQuote`
* identifiers: `isIdentifier` and not a unary op

## JAN 25 MON - Script Parser Review

I'm looking at `gscript-tokenizer` to see what it's doing. How do I see what it's parsing? Probably need to use the test module.

* go to **Compiler Route** and uncomment **import test-parser**
* test-parser tests both expression and our script-unit compiler. we should split them up
  * test-expr-parser, test-script-parser
  * **ERROR** can't parse dotted identifiers so need to fix that.

The error seems to be coming from gobbleToken() misclassifying the period as the beginning of a numericliteral, called by line 311, which is:

```
    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    }
```

On comparison, our script tokenizer actually implements different logic, since it just wants to recognize certain patterns in the text. It doesn't implement `gobbleExpression()` or `gobbleBinaryExpression()`, instead just using a modified `getToken()`!!!

> **BUGFIX** Our version of `gobbleIdentifier()` returns the string. However, `gobbleVariable()` is probably what should be getting called. It turns out that our `gobbleToken()` called `gobbleIdentifier()` instead of `gobbleVariable()` so that fixed it after adjusting the node output to retain the period and afterpart

### ScriptUnits expanded parsing

Now that we have identifiers/variables that can have dots in it, we need to handle this case and somehow tell the compiler what to do with them.

* Transpiler has `ScriptifyText` which converts things to ScriptUnits. This just calls the gscript-tokenizer
* `CompilerScript()` takes ScriptUnits and convert them into a program bundle.
  * compile units by line, adding result to the bundle being built. 
  * The heavy lifting is done by `r_CompileUnit()` which uses `r_ExpandArgs()` to recursively convert our data types into javascript data types.
  * `r_ExpandArgs()` accepts the unit and handles:
    * ARRAYS are assumed to be nested scripttext that must be tokenized, returning as objcode (array of functions)
    * STRINGS are tested for inline `{{ }}`, returning an AST object
    * STRINGS are tested for inline  `[[ ]]` , returning an identifier that is a program name
    * everything else is returned 'as is'

It's important that these values are already converted to native javascript types for speed, as they are bound through closures into the compiled functions. It's up to the specific keyword to be able to handle the argument based on its order in the ScriptUnit.

#### Extending r_ExpandArgs()

We'll use `object` to handle program names and ASTs by adding a special identifier. 

There is some trickiness though...the string type has to detect "unquoted" idenitfiers versus "quoted". I think this means that the script tokenizer needs to return objects somehow? Or we detect it somehow

```gobbleToken
MultiBlock:247 return { block }
Token:337 return { value: arg }
NumericLiteral:398 return { value: number }
StringLiteral:446 return { value: str }
Identifier:474 return { identifier: literals[identifier] }
Identifier:478 return { identifier: }
Variable:511 return { variable: [identifier, dotIdentifier, ... ] }
ExpressionString:544 return { expr: str } // no {{ }}
Block:584 return { '[[ string ]]' } - inline program name

?Comment: return { _comment, cstring }
?Group:525 this might not be used, but it returns a token which is probabaly broken
```

I've converted this to node types as described above, so now it is a matter of adding special processing for these types in the transpiler in `r_ExpandArgs()` for the special cases. 

## JAN 28 THU - Conversion of Transpiler

gscript-tokenizer is now producing an an array of objects that define their type. This makes it a bit harder to read though in the console.

```
token: token string 
objref: parts of an object reference foo.bar
directive: #, array of directive parameters
value: number
comment: string
block: array of strings
```

## JAN 29 FRI - Compiler-to-Runtime Arguments

Yesterday I got the **objref** argument type handled in the following locations

* script-parser: returns object types { token }, { block }, etc for all parsed elements
* transpiler: `r_ExpandArgs()` now handles these object types
* expr-evaluator: `EvalArg()` called by `setProp()` currently
* dc-script: `UtilDerefArg()` seems to be a variation

There are now several execution contexts for programs to keep in mind:

* agent context (acts on agent instance) - `define`, `init`, `update`
* global context for tests (single/pairs) run through Global agent instance - 
* global context for events (registers agent type for instances to all receive) - runs during `CONDITION_UPDATE`

Each of these contexts must be provided to the **program** running via the `GAgent.exec()` function which accepts:

* `program ` - a TMethod
* `context` - a context object
* `...args` - a variable number of arguments in runtime format (if there is only one arg, it's assumed to be a context object)

So the $199 question is 

* **how** does each context construct the `context` object when it calls exec?
* **how** do the arguments at compile time get put into the `context` object? 

### Let's look at the `when` example

```js
/*/	when A test B [[ programblock ]]
		...is expanded into...
		'aName' 'testName' 'bName' Array<TMethod>
		...which is converted into a program...
/*/
/// A, B, testName, consq are pulled from arguments and bound bia closure
/// into the following function
(agent,state)=>{
  PairAgentFilter(A,B,testName).forEach(pairs=>{
    [aa,bb] = pairs;
    aa.exec(consq,{ [A], [B] })
    bb.exec(consq,{ [A], [B] })
  });
}
/** which is executed eventually by this code in sim-conditions **/
GLOBAL_COND = [...GetAllGlobalConditions()];
GLOBAL_COND.forEach(entry => {
  const [key, value] = entry;
  GLOBAL.exec(value);
});
/*/	Note that in this case, the function has everything it needs because it is
		global program (redirected via # PROGRAM CONDITION) and it runs on every
		update. This is not idea though because we want to push the test outside
		of the when keyword
/*/

```

### Let's look at the agent block example

This is just normal code that is executed during agent updates, on Tick type stuff

``` 
// setting a prop for an agent during define or init
prop agent.x setTo 1
prop agent.Costume.pose setTo 2
prop agent.x setTo {{ agent.y + 1 }} // complicated math
// setting a prop for agent pairs inside a when
when Bee touches Flower [[
prop Bee.x setTo 1
if {{ Bee.energy < 10 }} [[
  prop Bee.energy sub 1
  prop Flower.energy add 1
  do Flower.Costume makeParticles 100 
]]

// setting a prop conditionally inline test
if [[ 
  push Bee.energy lt 10
]] [[
  prop Bee.energy sub 1
  prop Flower.energy add 1
  do Flower.Costume makeParticles 100 
]
```

**HOW???**

an `objref` gets expanded into an actual object in `r_ExpandArg` from [prop, prop]

* `x m args` should be expanded to `agent.prop('x').m(args)` 
* `agent.x m args` should be expanded to `agent.prop('x').m(args)`
* `agent.Costume.pose m args` should be expanded to `agent.featProp('Costume','pose').m(...args)`

We might not even need `prop`, except for features calls. Then `prop` is for conceptual symmetry to `call`

* `call agent.Costume.m args`  expands into `agent.featExec('Costume','m',args)`

>  **CONDITIONS IMPLEMENTATION NOTE**
>
> The output of `when` is directed into `# PROGRAM CONDITION` program, so it's stuffed into global condition that is run inside of `sim-conditions.Update()`. This handles both global conditions and events curently.

So the only thing left to do is **TRY THE DAMN THING**

*inside agent prop, objref, method, [args]*

* x - objref 1 = agent.prop(or[1]) - method
* agent.x - objref 2 = agent.prop(or[2]) - method 
* agent.Costume.pose - objref 3 = agent.featProp(or[2],or[3]) - method

*inside when*

* objref 1 = agent.prop(or[1]) - method
* objref 2 = A.prop(or[2]) - method
* objref 3 = A.featProp(or[2],or[3]) - method

*inside on is same as inside agent because it runs in agent context*

So how is this objref converted into that at **compile time**?

* inside agent: agent is always available, objref has to be looked-up at runtome and can't be hooked during compile
* inside when: agent is global agent, [A] and [B] are provided by calling test. should probably be defined outside of blueprints

## JAN 31 SUN - Wiring Up

let's try to implement the new `prop` command to detect cases correctly:

```
prop agent.x setTo 10
```

* [x] make `prop` command
* [x] console.log `prop` processing 
* [x] update DEFAULT_TEXT to use new prop syntax

BUG: unknown argument type in `r_Decode` transpiler line 129 - needed to return on `value!==undefined` when value is 0

* [x] inspect output of prop during compile: it `objref: []` 
* [x] figure out how to convert into runtime reference - at compile time, we can create a custom function that the runtime can all to do the conversion. Signature should be `(agent, context)=>object`

Now I think I know how to construct the runtime functions that `prop.compile()` needs to generate. It's a function that accepts the passed contezt and agent at runtime and spits out the reference.

* [x] case 1: implicit agent (`x`)
* [x] case 2: explicit agent (`agent.x`, `Bee.x`)
* [x] case 3: explicit agent feature prop

* [ ] BUG: `state.ctx` not being set from `agent.exec`
* [ ] FIX: convert gagent.featureMap to a regular IKeyObject, as sm-object does

#### TEST CASES

```
prop x method ...parms
prop Bee.x method ...parms

featProp Costume.pose method ...parms
featProp Bee.Costume.pose method ...parms

featCall Costume method ...parms
featCall Bee.Costume method ...parms
```

Now I have to:

* **fix the lost context** for each of the **three exec contexts**
* write a **test module** that can exercise each of the cases.

If I want to write a test module for context calls, it would have to have a text that creates a bundle. We'll use `test-keywords` as our test module, which is similar to `test-compiler` in its design.

1. compile test blueprint
2. execute it inside agent context
3. execute it inside when context
4. execute it inside event context
5. repeat

## FEB 03 WED - Inserting Execution Context

First execution context is for `x`, `agent.x` prop references in the agent context. This is in the `prop.tsx`, `featProp.tsx`, and `featCall.tsx`  commands..

* [x] Programs using `prop` are handled in by the `GAgent.exec()` function. This is called by `sim-agents` on update, think, and exec via `GAgent.agentUPDATE()`, etc
* [x] Modify agentUpdate/Think/Exec to include `{ agent: this }` to provide context by default
* [x] Also modify to include its own blueprint name
* [x] Comment `prop.tsx` to make the two cases clear
* [x] Comment.`featProp.tsx` to make the two cases clear
* [x] Comment.`featCall.tsx` to make the two cases clear

Second execution context happens inside of **`onEvent`** keyword.

* [x] The `onEvent` keyword subscribes an eventName to a particular agentBlueprint name along with the `smc_code` to run when compile is run via `SubscribeToScriptEvent()` in `dc-script`
* [x] To queue, the system currently registers an UR mesage called `SCRIPT_EVENT` which is hooked by `dc-script` to push an event object onto its `EVENT_QUEUE` array, which is read during `sim-conditions` and sent to all instances of the registered types
* [x] The execution context is in `sim-conditions` where the `EVENT_QUEUE` is iterated over. The agent context is always the agent itself running the consequent, so `{ agent, [agentType]: agent }`

Third execution context happens inside of **`when`** clauses. THIS IS THE HARD ONE

* [x] These programs execute in the global context, which is handled by `sim-conditions` for execution and `when.tsx` for determining which agents are passing the test.
* [x] The `when` keyword is inserting the context already, so it should be accessible by the `prop` `featProp` `featCall` keywords
* [x] The `GlobalCOnditions()` are in `dc-programs` and are a Map of test signature to array of consequent functions. So `Bee touches Flower` is the signature, and it contains the list of all the consequents that should be run.
* [x] We have to make sure that `ctx = {[AgentA] and [AgentB]}` is  available to the consequents being run. However, the problem is that we don't know what the pairs are. 

To make the pairs available, we need to shift the hacked-in nature of `when` clauses so the tests are properly run during `CONDITION_UPDATE` instead of hacked into `AGENT_UPDATE`

* [ ] **TODO** the `when` keyword is not using cached test results, which is an important optimization
  * [ ] needs: test signatures based on `AgentA Test AgentB` caching results
  * [ ] needs: add test execution at the appropriate GAMELOOP phase
* [ ] **TODO** the `when` keyword is executing consequents immediately instead of queuing them
  * [ ] need to review the queueing features of `GAgent`. May need to define message format.
  * [ ] how is the complete context passed in the queue? As part of message?

PLAN OF ACTION

* the tests in the `when` `compile()` function need to be moved to `sim-conditions`.
* when registers key signature with consequent to populate data structure
* during condition update, iterate over key signatures
* execute key signature and collect passing elements
* for every passing element, execute the consequent with appropriate ctx

### Writing Signature

Tests have a particular signature comprised of the test followed by arguments. The syntax is:

```
when A testName B args
when A testName args
```

ConditionKey is all the args used to define the `when` turned into a string. 

To use the CONDITION_CACHE structure in dc-tests:

* [ ] The `when` compiler calls `RegisterWhenCondition(args, conseq)`  which creates the condition entry
* [ ] During `CONDITIONS_UPDATE`
  * [ ] iterate over all the keys in `CONDITION_CACHE`
  * [ ] extract the testName and feed it with args to get passing agents
  * [ ] iterate over the passing agents and execute `conseq` for each agent

Ok, there is an additional wrinkle:

* at compile time, the `when` keyword has to know to run its conseq only for that particular blueprint. 
* that means that the test should run during the defining agent's UPDATE phase
* The defining agent, the tested agents are potentially all different blueprints!!!

I think all the agents need to have to receives the passing conditions for each instance.

**e.g. all instances of Bee receives [conseq, A, B] and execute during AgentUpdate.**

* [x] add `GAgent.queuePassingCondition()` 
* [ ] add `GAgent.agentCONDITION()` that runs the conseqs that have queued up

* [ ] in condition update, we will want to queuePassingCondition to each instance. That would mean there is a triplet of agent instances in each conseq. 

Another possible approach is to have the `when` keyword itself add the conseq to its own array, and it is able to **query** the test results and run that conseq over and over. The compiled code can do that. 

I think that is a bit cleaner if the conseq can load pairs.

```
# BLUEPRINT Dolphin
when Banana touches Beach [[ 
  prop Banana.x
  prop Beach.x
  call Dolphin.Costume scream
]]
```

The code that could execute that:

``` js
[kw, A, testName, B, ...args] = unit;
const conseq = args.pop(); // remove the last argument
const { bundleName } = CompilerState();
RegisterWhenCondition(args,bundleName);
return [
  (agent, state) => {
    const pairs = GetResults(A,testName,B,...args);
    // assume last argument is the conseq TMethod
    pairs.forEach( pair => {
      const [A, B] = pair;
      const ctx = { [A]:A, [B]:B, agent };
      agent.exec(conseq,ctx);
    }
  }
]
```

## FEB 04 THU - Implementing new When handling

* [x] `RegisterWhenCondition()` sets up tests to create filtered pairs, stored by test signature
* [x] Run all conditions during `CONDITION_UPDATE` in `sim-conditions`
  * [x] split RegisterInteraction to RegisterSingleInteraction, RegisterPairInteraction
* [x] `when.jsx` has code access filtered pairs by test signature, and runs consequent
  * [x] update 'when' to use Single, Pair registration

### To add another type of interaction, here is what you need to do

* register a test function using `dc-named-methods` `RegisterFunction()` that handles either single or paired agent instances as input, and returns true/false if they pass the test
* use the `when` keyword in your script, providing a consequent to run on passing agents
  * use `when A testName [[ consq ]]` for SingleAgentTest
  * use `when A testName B [[ consq  ]]` for PairAgentTest
  * the consequent can refer to { A } and { A, B } in expressions and also use the new dotted object references`prop`, `featProp`, and `featCall` keywords 

## FEB 05 FRI - To Test New Interactions

```
when A touches B 10 [[
  prop A.Costume setPose 1
  prop B.Costume setPose 2
]]
```

I was originally going to write a runtime test module, but there are complications on how to actually test the WHEN conditions which require two agents. 

* **TODO** - need to do dotted reference expansion for values of properties?
* **TODO** - PROGRAM UPDATE for when clauses? WHat happens to PROGRAM CONDITION?
* **TODO** - make sure can pass parameters to tests
* **TODO** - see if I can simplify prop, method access for Features, Props, FeatureProps

CURRENT PROGRESS:

* [x] confirmed that when clauses are running 
* [x] try to get dbgOut to print expressions (added to todo)
* [x] can I swizzle the expression context (no)
* [x] write a simple keyword tester
* [x] finish EvalArg to handle objrefs

### Making a simple keyword tester

In `test-script-runtime` ...

```
Create testing blueprints
Instantiate agents
Compile a line of text
Execute program with context
Check results
```

To broadly support objrefs, we also need to swizzle agents in `expr-evaluator`, and we no longer allow implicit agent references.

* **TODO** fix `when` to be able to pass parameters to tests

---

**ADDITIONAL THINGS TO IMPLEMENT**

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

* After I get OnTick working as the basic scriptevent in the user event system, will outline what's in the current engine as of today for the team, with an eye toward using this a foundation for introducing how to write simulations with it (a kind of informational and concise primer?) Then afterwards document the most recent things.

**TODO** AFTER ALPHA DEC 1

* **parameter passing** between scripts is kind of ambiguous, because of the number of execution contexts. Need to document all the execution contexts and try to make sense of it.
* no **filter result caching** in place yet
* no real tests implemented yet
* combine test functions into functions table, require that name begins with TEST_AB, TEST_A, or TEST
* the state object needs to have its **context** loaded so this values are available at runtime. How do we insert it before it runs? Maybe 
* provide a better debug output experience
* make sure that Agent blueprint inheritance is implemented
* `queueSequence [[ ]] [[ ]] [[ ]] ...`
* `on TimeElapsed 1000 [[ ... ]]`

**BACKLOG**

```
Renderer + Display Lists
[ ] implement/test entity broadcasts
[ ] how to integrate multiple display lists together?
[ ] finalizing coordinate system
[ ] bring back location

Network:
[ ] design device persistant naming and reconnection between reloads
[ ] maybe use JWT to establish identities? 

Input:
[ ] Read Event List
[ ] Update Display Object from events that change things
[ ] Convert local interactions to Agent or Display Object changes
[ ] Write Event List
[ ] Important formal input mechanisms
[ ] Asset capture 

Observations:
[ ] NOTE: The difference between PhaseMachine and messages synchronicity
[ ] extension: text script format `[define]` to output a define bundle, etc

Conditional When Engine:
[ ] slow...speed it up

Persistant Data
[ ] server?
[ ] assets?
[ ] bundle-based asset management outside of git?
[ ] handle app packaging, asset packing, identitifying groups, students, orgs that it belongs to. 

```

---

