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

* W1: parser/tokenizer/evaluator, compiler/decompiler
* W2:

---

**DECEMBER 1 DEADLINE**
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
> It just occurred to me that the **smc compiler** will need to have an expression parser that accepts the string and saves its ast. The evaluation of this AST has to be saved at templatae creation time, so it's available for evaluation.

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

* [ ] show rendering area
* [ ] make one instance





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
```

---