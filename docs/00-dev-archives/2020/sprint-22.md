**SUMMARY S22 OCT 26 - NOV 08**

* W1: Parse/Evaluation, Source-to GUI and SMC, GUI compiler API
* W2: Tokenize, GUI for ModelLoop, script-to-blueprint-to-instance

---

# December 1, 2020 Goals

an agent or agent template that can be created
static or faketrack controls

+ set the skin from a list of assets?
+ some way to load/save?
+ simple prop set like nectar count
  Possible Content Areas: Aquatic Ecosystem, Decomposition, Moths, and Water solutions

A good chunk of the next six weeks will be for just getting the UI to talk to the SIM engine, decoding. 

---

# SPRINT 22

### Reviewing Token, Expression data types

  I did a bit of review of the expression-engine code in [this file](01-architecture/03-expressions.md).  Followup questions:

  * What **doesn't** this code handle? 
  * What does the AST look like for a number of expressions?
  * Do I need to work backwards from the evaluator?
  * My version of the evaluator produces **compiled smc programs** that have to work with the other keyword. That means it works with the same state model.

  #### What doesn't the code handle?

  Looking at [this program source definition](https://cs.lmu.edu/~ray/notes/esprima/) for comparison:

  * there are no declarations (functions, vars, class)
  * no block statements, returns, breaks, continue, if, switches, while..
  * no method definitions.
  * no assignment to storage?

  However, there are all kinds of Expressions. **Anything that can produce a value is an expression.** 

  #### What does the AST look like?

  Let's see if we can import the expression-engine. There are a couple more options:

  * [expression-eval](https://github.com/donmccurdy/expression-eva) is built on [jsep](https://github.com/EricSmekens/jsep), a simple javascript expression parser. This looks cleaner than the code I was looking at

  * playing with it in `test-expression`, and it is much cleaner than the other implementation as it build on `jsep`. I think I can modify the `evaluate()` function in here to produce smc-code directly



## OCT 27 TUE - Taking a whack at another parser

*NOTE:* I lost some progress notes between October 22 and 26. Grr. So now I have to remember what I did.

**sidetrack:** was having trouble getting Intellisense to work with global typings files. [This answer's 2020 update](https://stackoverflow.com/questions/42233987/how-to-configure-custom-global-interfaces-d-ts-files-for-typescript) indicates maybe why it doesn't work: any `import` or `export` will break automatic type discovery. This is because typescript tags use of import/export as a MODULE, otherwise it's a SCRIPT. That said, "ambient modules" that magically define everything is discouraged these days.

## OCT 28 WED - Resuming the Parser Whacking

I didn't quite get started on this yesterday. Where am I? I'm writing a parser of some kind to **turn a line of text into our source array format**. 

Let's do some free writing... 

The intention: parse a string and break it into:

* strings
* numbers
* identifiers.
* expressions

I think if we include a custom version of JSEP we can just expose their tokenizer for our use? But then again. We need this code to identify expressions, which are a new construct in the GEMscript language.

* [x] port parts of jsep over
  * [x] `gobbleBinaryExpression()`
  * [x] `gobbleToken()`
  * [x] `gobbleNumericLiteral()`
  * [x] `gobbleStringLiteral()`
  * [x] `gobbleIdentifiers()`
  * [x] `gobbleArray()`

let's make sure this still works:

* [x] does it actually work? YES, apparently
* [x] try some expressions like arrays
* [x] note that **assignment** doesn't work here (it's just an expression parser)

Next we want to **fail** on particular things we don't support, and also just emit the tokens as pure values.

* [x] the code works just by starting at the start of the screen and continually trying to read expressions.
* [x] for gemscript, our lines look like `keyword identifier or whatnot` 
  * [x] what happens if we pass it an actual keyword? what is the syntax tree?
  * [x] reimport jsep raw again...something got nuked in it in the previous port

The `jsep` code (implemented as `parse`) returns an abstract syntax tree for evaluation. We actually just want to grab the individual keywords. Let's test the output of likely gemscript syntax things:

```
// this is interpreted as 3: keyword, identifier, expression
"setPropValue health 1 + this.pollen"

// this is interpreted as 3: keyword, 
"setPropValue alpha 1 + ((this.pollen +1/ 10)) + 1"

// this is interpreted as 2: keyword, beta(expression) + 1
"setPropValue beta ((1 + this.pollen) / 10) + 1"

// this is interpreted as 2: beta + expression
"setPropValue beta +((1 + this.pollen) / 10) + 1"

// this is interpreted as 3: prop.foo setTo expr
"prop .foo setTo 1 + this.pollen"
```

So I've noticed:

* **whitespace** is not sufficient to separate keywords, particularly 
* **dot** will look like a member expression if it's preceded by an identifier. It's not space delimited.
* **parenthesis** will look like a call expression if there is an identifier before it

So that means we have to impose some of our own rules.

## OCT 29 THU - Emit a Range

#### When I pick this up on Thursday...

* [x] what happens if I just remove the call member check? (this works by removing check for code)
* [ ] what if I make the space somehow hard when processing property expressions? probably not as an identifier. **this is not straigtforward** because of whitespace rules. Whitespace is insignificant in this tokenizer

The current state of the tokenizer codebase in `util-source-parser`: 

* it is hacked to ignore procedure calls

I want to add:

* emit the string that is the expression, wrapped in `_EXPR{}` 
* parse the contents of `_EXPR{}` to feed it to a keyword.

Ok, to **emit the string** I think I have to modify util-source-parser to examine its ranges. I don't know if this actually has ranges unlike some of the other ones. 

* the `jsep` tokenizer doesn't output character ranges. Therefore we have to save them ourselves by using `index` in a clever way. I'm trying`lastIndex`
* This tokenizer also isn't recursive, so we have to track ranges ourselves.
* The top-level call is `gobbleExpression()`in a loop of nodes, so I think we can just s**tuff the string directly into the node!**
* I think I can then inspect the node type, which is `Compound` containing `Identity`, `Literal`, or `BinaryExpression` to **reconstruct** the source array!

Ok, let's try to wedge this code in there:

* [x] modify `util-source-parser` to store `range` and `raw` properties in the returned compound.body
* [x] write a `ParseToSource()` decompiler function

ZOMG it works. 

* [x] clean up util-source-parcer
* [x] move ParseToSource to util-source-parcer
* [x] confirm test-expression still seems to work
* [x] replace jsep, expression-eval...does it **still work** with `test-expression` and `test-keygen`? **yes**
* [x] commit cleaned up work-in-progress

>  **NOTE**
>
>  It just occurred to me that the **smc compiler** will need to have an expression parser that accepts the string and saves its ast. The evaluation of this AST has to be saved at templatae creation time, so it's available for evaluation.

Next: let's add a TEXTFIELD that contains a bunch of lines with a COMPILE button.

* [x] add 'compiler' route with`<Compiler>`
* [x] move code from `<Generator>` and `api-sim` to `<Compiler>`
* [x] change layout to be two-column, one side source and the other react

Render source into the left side, then generate compiled JSX on the right side, replacing the hardcoded tests.

* [ ] render source into 'source column'
* [ ] when sourceToReact button clicked, compile script into JSX programmatically
  * [ ] hook button to handler

trying to separate the lines so we are parsing stuff that looks like

`keyword identifier|literal|binary_expression ...`

I think it's crashing on endTemplate because there are no arguments, so it's parsing emptystring? NO, it's that sometimes there isn't a Compound type if it's just a single argument (the keyword) so we handle Compound as a special case.

OK, it works going from SOURCE to REACT, not not the other way back yet. I don't think we have something that generates it. 

* we have to change our internal representation of SOURCE to REACTUI to SOURCE to SOURCELINES to REACT
* then change REACT to update SOURCELINES, which should then update UISOURCE

## OCT 30 FRI - Review and Condense

* [ ] disconnect test-keygen, test-expression
* [ ] create new `script-source` module to combine functions together, to replace KEYGEN export from `class-keyword-helper`

## OCT 31 SAT - Refactor

The Agent Template Compiler has access to

* KEYWORD master dictionary
* returns AgentTemplate object with the 4 kinds of SMC programs

The Keyword Master Dictionary contains:

* loaded KeywordDefs in a Map<string, KeywordDef>
* methods to compile, serialize, and render by keyword

The KeyworDef declares:

* compiler function
* renderer function
* serialize function

The current AgentTemplate being edited consists of:

* SOURCE: an indexed array of ScriptUnit, which are arrays of parameters
* handle update of SOURCE given a ScriptUnit

The conversion processes are handled in **KeywordDef** classes

1. convert a string to ScriptUnit
2. convert a ScriptUnit to a string
3. convert ScriptUnit to SMC equivalent
4. convert ScriptUnit to JSX

**Fixes**

* [x] first let's make this work with ScriptUnit arrays again, not stateobjects
  * [x] when a JSX element change event happens, it must update and send an array
  * [x] passes serialize from ScriptElement rendered component
  * [x] remove RegenSRCLine because no longer needed

**breaking down test-keygen**

this adds keyword helpers and creates a source.

* [x] move source to agent-template class
* [x] move keyword declarations to a keyword dictionary class
* [x] Reorganize classes into a semblance of organization.

eval/parse for script-to-jsx and jsx-to-source

* [x] source-to-react uses parseToSource in util-source-parser
* [x] move modules
* [x] consolidate keyword-dict as main module
* [x] keyword-dict export util-parser, util-evaluate
* [x] update Compiler to use only KeyDict

We have the basic round-trip installed now!

**what's next?**

* [ ] compile SMC in UI
* [ ] AgentTemplate hookup

## NOV 02 MON - Look at SMC in UI

Hooked up SourceToSMC. Now need to make it actually do something.

## NOV 03 TUE - Make the SOURCE/GUI tab one pane

* [x] make source/wizard overlap each other
* [x] show rendering area

## NOV 4 WED - Agent Interface and Source/GUI Integration

I would like to make it so that the source panel will compile into an agent template. There is a lot of infrastructure to build here. Currently, all the agent template functions are hacked in `tests/test-agent`, so I need to:

* [x] identify the test program being compiled
* [x] write the source for the test program, and put it into the gui default

```
AgentFactory.AddTemplate('Bunny', agent => {
  // built-in
  agent.prop('x').setTo(50 - 100 * Math.random());
  agent.prop('y').setTo(100 - 200 * Math.random());
  agent.prop('skin').setTo('bunny.json');
  // additional used for costumes (hack)
  agent.addProp('spriteFrame', new GVarNumber(temp_num));
  agent.addProp('currentHelath', new GVarNumber(100));
  agent.addProp('isAlive', new GVarBoolean(true));
  agent.addFeature('Movement');
```

Let's convert this to some kind of source, currently stored in `Compiler.jsx`

NEXT:

* [ ] compile the source and store it somewhere in `agent-factory`

The compiled template is generated by `KEYDICT.CompileSource(src)`, where `src` is a KeyObject array. It uses the text source to generate the array, via the various specifical `Keyword`.

I outlined the script-evaluator, script-parser, and keyword-dict modules. KeywordDict is the **primary** interface to all these elements:

* register keyword helpers that...
* convert Source to Template, JSX, ScriptText
* evaluate expression
* tokenize expression(s) to Source

Our sourceText is in `Compiler` so first we need to generate the template via.` CompileSource()`. This text is converted to Source aka ScriptUnit[] line-by-line via `TokenizeToScriptUnit(expr)` ...

* There are a **lot** of parsing issues with the script language that will have to be worked out!!!

So we won't worry about that right away. 

**left off here ... **



* [ ] add `expr{ ... }` parsing
  error `prop x setTo random -50,50` turns to  `prop x setTo expr{random -50} 50`
* [ ] generate a new instance from the template on save
* [ ] launch the simulation with the new instance
* [ ] delete the old `agentfactory` module

## NOV 06 FRI - Where are we?

The parsing side will have to wait. We'll use ScriptUnits for generating all of our source code for now, since it is the common element for sourceText, UIRendering, Compiling.

So I just need to wedge-in the AgentTemplate building. We'll continue on with the current work with AgentTemplates conversion and not worry about expression parsing yet.

Our **compiler functions** will be based on **keywords** now, but the same SMC protocol will be used. There are also **glue operations** that we already have to manipulate stack results.

**ScriptUnits as the intermediate script** 

* ScriptUnits
* SetProp only take the top value of the stack
* Rules: ScriptUnits are it can handle simple expressions
* Rules: ScriptUnits handle assignment and data featuching as sdistinct operations on a stack
* Just need to think in terms of the stack machine for implementing the INTENT of a keyword; later can see how to simplify it.
* **ScriptUnit Centric** use OPS, CMDS and the SMC Protocol (data stack, agent, ref stack)

FIRST UP: Write a dummy Script from ScriptUnits

**Compiler** has defaultText which is compiled to Source, which is an array of ScriptUnits.

A ScriptUnit is an array of parameters, but maybe it should be an object.

* [x] start coding directly in ScriptUnits

* [x] make sure we have keywords for everything

  * [x] defTemplate
  * [x] defProp
  * [x] useFeature
  * [ ] ~~random~~
  * [ ] ~~propPop~~
  * [x] randomPosition
  * [x] prop
  * [x] on

  

Next: **can we look at the template function???**

> we have a template available now. The program is compiled from source, which creates the blueprint. Let's rename template to blueprint while we're at it.

**TIME FOR A REST**

will actually implement the template invocation tomorrow.

## NOV 07 SAT - Rehydration Day

I am very dehydrated today, so drinking a ton of water. But **where did we leave off?** It's time for **TEMPLATE INVOCATION**

**Q. Where are Templates Stored?**

> Right now **Source** is in Compiler.JSX, and it will have to be moved. Templates have to first be compiled, then instanced. The existing code examples are in (1) test-agents and (2) sim-agents

(1) In TestAgentProgram(), we have some code that adds a `TemplateFunction` through `AgentFactory.AddTemplate` by name, but surely this is no longer the case. 

(2) In sim-agents, our update syncs display objects to agents, which are then rendered. In datacore, `AGENTS_Save()` stores the agents into an AGENT map by type into AgentFactory.AddTemplate. These are decoration functions. The key functions are **AddBluePrint()** and **MakeAgent()**. there's a program called `test_smc_agent_update` that's defined in **stackmachine.ts** that is what's actually running. 

(3) There are **two** agent factories. The old one stores blueprint decorators and creates new instances from them. The newer one doesn't really do anything yet, but is probably intended to host the new style of managing templates. 

* [x] confirm that the test program still runs by re-enabling test-agents
* [x] add DO_TESTS flag to sim-agents

A **Blueprint** is an object with several arrays that are the programs that run at different times:

* `define` define templates, agents, and features in use
* `defaults` are the initial value setting programs, running after define
* `conditions` are programs to run and receive updates
* `init` are all other code that might run in the agent

So here's what needs to happen in the order it needs to happen:

1. compile blueprint source
2. store the compiled blueprint somewhere

Before we start, we'll commit `dev-sri/script-bridge` and make a new branch `dev-sri/model-loop`

### Compile & Store Blueprints

What does it take to **define what blueprints to instance**?

The compile button should somehow send the program to sim-agent.

* [ ] instance list: `[['blueprint', 'name', smc_program],[]]`
* [ ] iterates over the instance list, creating each agent

* [x] get text-to-source working well enough for testing

## NOV 08 SUN - Instancing Blueprints

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
