**SUMMARY S21 OCT 12 - OCT 25**

* W1: fast compile. source-to-script/ui compilers.
* W2: researched and integrated arithmetic expressions

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

## OCT 12 MON - Rapid March toward Full Sim Cycle

There's a few things on my immediate list (from DEC 1 GOALS)

* [ ] port tab system from nextjs template to custom template
* [ ] study x-gemstep-ui data structures
* [ ] goal: working UI that can create scripts
* [ ] goal: working sim world
* [ ] goal: working fake track

### Porting Tab System

#### REVIEW: ADMIN-SRV VIEW SYSTEM

This is based on FlexBox, unfortunately, but that might not be so bad.

```
in page-blocks/URLayout:
<View> children, className
<Row>
<Cell>
<CellFixed>
theme-derived is what defines the page magic:
urScreenPage: flex, flexFlow column nowrap, height 100vh, overflow hidden
urScrollablePage: display flex, flexFlow column nowrap
	urScreenView: display flex, flexFlow colum nowrap, flexGror 1
	urApp: display block
```

### Speeding-up Compile

I suspected that the build system for GEM_SRV was double-compiling. When I looked at `wp.base.loaders.js` (our webpack configuration base) I saw both `babel-loader` and `ts-loader` compiling files one-after-the other. First Babel handles all the JS, then Typescript handles all the TSX. 

Long story short, by having `babel-loader` handle **both** js and typescript, the compilation drops from **29 seconds  to 7 seconds.** 

Changes made:

* in `wp.base.loaders`, changed the test for `babel-loader` to `/\.(jsx?|tsx?)$/` from just `jsx?`
* also comment-out the `ts-loader` test, since babel will be handling it all now
* in `.babelrc`, add  ` "@babel/preset-typescript"` to end of presets. 

### Digging into X-GEMSTEP-GUI

First looking at the data structures.

## OCT 13 TUE - Next Steps on the GUI Integration

There's two things I want to do initially:

1. Figure of it it's possible to actually connect the current X-GUI to the script engine. It might be doable if we write replacements in the script engine.
2. Think of how I will actually save agent templates and agent instances, because this will be the structured data that the script engine ultimately has to read. I'd like to simplify the highly-coupled elements of the database structure and eliminate as many id-based operations needed to render the UI and instead make use of initial constraints to implicitly define scope.

I'll probably start with 2 first, and then maybe do the TAB SYSTEM afterwards. I think 2 is going to be the bottleneck for moving forward.

### Define Concepts

There are some concepts to nail down their definitions in the database too, so they conform to the internal script engine naming, which itself is strongly bound to the GEM-STEP specifications that were laid out. 

* There are only 4 main kinds of object in the system: Agent, Property, Variable, and Feature.
* Then there are two main kinds of context specifiers in WHEN conditions for agents: the TWO AGENT version and the SINGLE AGENT version. These limit what you can choose for follow-up filtering conditions on the left-side of the expression, though you can refer to agentsets of instances and individual instances I think.
* Then there are the global built-in time and simulation conditions.

Every one of the 4 main kinds of object in the system can expose its properties and methods, so these are what are used to populate dropdowns based on what the scoping object is. Then the selected dropdown object provides the next set of dropdowns, and so on.

### Prototype Advanced Visual Representations

I'd like to also design a representation of a real expression (as in algebraic) layout, though I don't think we can deliver this by December. It would be nice to know what it looks like. The minimum is how to represent parenthesis.

* [ ] how to save agent templates as a serializable format
* [ ] how to represent agent templates as a block-editable UI structure
* [ ] make a list of all the statement types in Whimsical
  * [ ] assignment
  * [ ] comparison
  * [ ] event
  * [ ] method invocation
  * [ ] arithmetic expression
  * [ ] code block
* [ ] make a list of all the SMObjects that can define the lead of something

#### LATE NIGHT KICKOFF

the question is where to put the script controller. Maybe somewhere in sim?

* [x] script...we need to figure some stuff out with the plan so switch to paper
* [x] in `converter` we're prototyping data structures...first
* [x] basic compiler pattern for defTemplate and defProp
* [x] basic render pattern for rendering source

This actually worked fairly well...there's a `CMD` data structure that has the keywords defined for the leading command, which includes **args** for syntax, **compile** for generating smc_code, **render** for generating JSX, and some **meta** for scope checking.

* How can we have all components **update their specific code** element?

  * the root statement holds a reference to an object that represents the line that it rendered
  * the root statement is responsible for drawing all its children, and uses the line to generate it
  * when a change occurs on a statement, the reference to the object is updated
  * when the object is updated in any way, the UI refreshes and forces the entire tree to draw
  * will this work?

* Each source line that walks also maintains a scope so subsequent commands can rely on it. This might not be necessary if the commands use full agent.prop addressing all the time; then we use the scope feature to know what parameters to use. ScopeIn and ScopeOut have to be carefully written for each CMD.

* **There is LEFT-to-RIGHT evaluation that happens for real commands.** For example:

  * refer to an agent instance or agent set
  * refer to an agentset global property (like count)
  * set an agent prop value to immediate or calculation group (expression)
  * copy an agent prop value
    * to another prop
    * part of a calculation group (via stack)
  * invoke an agent method or feature method to do something
  * perform a calculation on a property
  * perform an arbirary arithmetic calculation
    * immediate values
    * smobject prop values
    * available operators
  * compare a calculation to a property value or calculation
  * conditionally execute program if true or false

* for **interactions**, we have a complicated declaration

  

```
whenAgentSet filterCondition -> AgentSet to Iterate
  conditionProgram(for each agent)

filterCondition = [
  agentset conditionalTest
  agentset conditionalTest
]

whenAgentSet filterCondition creates a unique hash which stores the filter condition in a table of tests that are run early in the simulation cycle

whenTwoAgentSet filterTwoCondition -> AgentSet1, AgentSet2 to Iterate
```

## OCT 14 WED - more operations

We have the definitions section, which is easy, working OK. Now we need to express programs that can manipulate other things.

* [x] made the base class `SM_Keyword`, implemented `defTemplate`
* [x] implement `defProp`and `useFeature`
* [x] move the compiler and renderer functions into `SM_Keyword` as static methods
* [x] remove window tests, formalize converter.ts as a test module, move to tests

## OCT 15 THU - implementing additional keywords

We want to start implementing the following keywords.

### handling properties and methods in agents

free writing mode engaged! I'm trying to  get moving on the next bit, which is to try to assign properties and stuff. So let's see if we can do that I might need to sketch this out. 

```
let's think about expressions for a bit:

paren_expr : '(' expr ')';
expr : test | id '=' expr;
test : sum | sum '<' sum;
sum  : term | sum '+' term | sum '-' term;
term : id | integer | paren_expr;
id : STRING
integer : INT
STRING : [a-z]+
INT : [0-9]+
WS : [ rnt] -> skip
```

In the example above we're declaring a grammar for TinyC. So what does it mean?

```
A terminal is the smallest block in an EBNF grammar. These are the atomic units.
A non-terminal is anything that groups terminals and other non-terminals into a hierarchy.

KINDS OF EBNF TERMINAL
identifiers = name of variables, etc
keywords = strings to identify start of definition, modifier, or control flow
literals = values, characters
separators and delimiters = colons, semicolons, etc
whitespace = ignored
```

The biggest bugaboo I'm looking at is how to handle expressions cleanly. Ben took a stab at it and it seems a bit cumbersome because it wraps stuff in both a UI layer and an implied conceptual layer; there is no baseline representation like we have with our simple keyword-based language.

The ideal cases might look like this:

```
// 1. assign a literal to a property belonging to an agent
agent.prop = 1 

// 2. assign an expression that evalutes to a value
// to a property belonging to an agent
agent.prop = agentB.prop + ( agent.prop + 1 + 2) * 3

// 3. comparison of property belonging to agent with expression 
// that evaluates to a value and yielding TRUE to invoke method
// of agent
if (agent.prop < ((agentB.prop + 10) * 5)) agent.method
```

I'm not sure what we learn from this, but I'm tempted to break each one down.

Example 1:

* agentPropAssignValue(name,value)

Example 2:

*  `scopePushAgentProp(agent)`
*  `agentPropPushValue(agentB,'prop'), pushNumber(1), add(), pushNumber(2), add(), pushNumber(3), mul(), add()`
*  `scopedPropPopValue()`

In Example 2, we have a bunch of stack operations. Can we convert it back into GEMscript equivalent? Let's scan it left-to-right and see if we can do it

```
// agent.prop = agentB.prop + ( agent.prop + 1 + 2) * 3
// always start with push
opPush agentProp   // FIRST ON STACK
// see "+ (" force push for new expression group
opPush agentB.prop // SECOND ON STACK
// + select add and value = 
opAdd 1 
opAdd 2 // still 2nd value
// see ") *" so get operand
opMul 3
opMul 3 // transformed value on stack
```

I think I need to read more about **parsing** and **evaluation of expressions**...let's do that.

### handling arithmetic expressions and calculations

Ok, the basics!

* the tokenizer creates a bunch of nodes that have a TYPE and a VALUE
* the parser walks through the tokens one at a time, and recursively creates an Abstract Syntax Tree. The parser code is written in such a way that order of precedence rules are part of the tree builder, and it builds a tree that can simply be walked to be "evaluated"
* the evaluator takes the AST produced by the parser and is "walked" to calculate the value.

Here is a [simple buggy implementation](https://github.com/philipszdavido/expr_parser_js) and here is an [advanced implementation](https://github.com/plantain-00/expression-engine) as examples I found on the Internet. 

I think we just need an **expression parser**, not a full GEMscript parser. Everywhere we can put an expression, we have a special **ExpressionComponent** that itself produces the tokens that will be handled by our owb ExpressionParser. Then it can be plugged into any of the keywords we're developing!

That also means that I can just **use an expression placeholder** and to work out the rest of these keywords for quicker coverage.

Also note that expressions are no longer just strings, but actual array of javascript literals (including objects and arrays)

```
agentMethod methodName ...args
setProperty propName expr => value in agentProperty
calc expr => value on stack
if exprString programBlockTrue programBlockFalse

whenAgent template expr => agentSet on stack
filterAgentSet template expr => agentSet on stack
programBlock

whenAgentPair template1 template2 testname => agentPairSet on stack
filterAgentPairSet template1 template2 exprString => agentPairSet on stack
programBlock
```

### handling arbitrary program blocks

The keywords probably need a block designator. 

```
defineBlock
... keywords
endBlock -- left on stack...is this a new var type?

var-agentset
var-agentpairset
var-program 
var-array
var-dict
```

This `defineBlock` keyword compiles each of the keywords into an array that can be pushed right on the stack for execution. 

**I'm not sure how to provide program blocks as arguments to keywords** 

For our simpler commands, we have literals as numbers and strings and booleans, but they're strings.

`defineProp propName value`

**Instead of using strings, maybe we send arrays of objects from the serialized components**, that way we don't have to do data conversion from strings, and we can have datatypes like arrays, objects, etc.

### handling comparisons and conditional execution of programs

Handled by the expression engine, which leaves values on the stack which can then be invoked by pushing it on the scope stack

### handling interactions

an interaction looks like

```
whenAgent template expr => agentSet on stack
filterAgentSet template expr => agentSet on stack
programBlock

whenAgentPair template1 template2 testname => agentPairSet on stack
filterAgentPairSet template1 template2 exprString => agentPairSet on stack
programBlock
```

### handling messaging between agents (queuing)

```
defineEvent eventName { }
sendAgentSet template 
```

defineEvent.compile has a source line that looks like `['defineEvent','eventName',args]`

### handling system events (like tick)

```
onTick programBlock

onCondition expr programBlock
```

### handling conditional triggers and trigger events

```
onCondition exprString programBlock
agentSet send 'event' {data}
```

### addressing instances

our program source can't include actual instances, and we are not using ids as an addressible element. Instead, we address them by name, group, and other properties to create the appropriate set. Instances can have unique names so scripts can be written to **select** them.

```
forAllAgents templateName testExpr programBlock
```

## OCT 16 FRI - Three Questions to Answer

Yesteday I figured out a few questions to try:

* [x] see if I can emit JSX from the current keyword definitions, and render a cheesy string of components
  * [x] look into rudimentary tree walker code (not tuned)
  * [x] note that returning jsx is a bit slow
  * [x] try jamming the JSX into Generator
* [x] move `modules/` out of `app/` since they aren't necessarily part of an app
* [x] update the program source format to use arrays to make sure that works
  * [x] Now accepts both a string format to tokenize and an array format of object literals

That went pretty well! Not only did it largely work for proof-of-concept, but it didn't take that long either.

* [ ] sketch out the **remaining keywords**, using a placeholder for expressions (we don't need to actually calculate them yet. We just want to generate programs that refer to them)

```
onCondition condName condExpr programBlock
whenAgentSet template condExp programBlock w/AgentScope
whenAgentPairSet template template condExp programBlock w/AgentPairScope
doCondition condName data ...
agentSend messageName data ...
agentQueue messageName data ...
forAgentSet template programBlock w/AgentScope
agentProp propName setTo expr
agentProp propName value
-- also look at the opcodes --
```

## OCT 17 SAT - Looking at a Keyword Helper component

Will resume with the **keyword** stuff on Sunday. In the meantime, I want to try something with the keyword class.

```
function ScriptElement(props) {
	const { keyword, args, children } = props;
	return (
	<>{children}</>
	}
}
<ScriptElement keyword="defTemplate" args={args}>
	{children}
</ScriptElement>
```

Ok, there is some **complexity** here:

* `class-sm-keyword` is not a React component, so it does not maintain any kind of React state
* the subclassers of `SM_Keyword` are not React components either, so its rendered JSX output has no state that can be managed by React events unless it's expanded.
* Therefore, we need to make some kind of **composite** object to handle React state (so we can write UI stuff) and also be self-contained with the logic to render stuff. 
* This suggests a **revised sm-keyword** pattern, where the React component is created using data from SM keyword

I'm a little ways through structuring this. `defTemplate` has the beginnings of defining the STATE in each of these components. I can walk the tree, but I need to pull the state out of each element somehow and I don't see this. 

* [x] how to read the changed values from the components? Is it possible?
  * [x] It doesn't seem to be possible; we are stuck with the original state which mutates and probably makes NEW objects under-the-hood
* [ ] ALTERNATIVE is to maintain our own LIVE data structure to regenerate JSX so we can change our own  source structure and then rerender JSX from that.

The effect hooks in react work in a similar way, maintaining order by  virtual of the order that the hooks are created by render function. 

So when we generate our data structure, we're rendering from source directly into JSX. We need to pass an additional index to the generator.

* [x] in `class-sm-keyword` `m_RenderLine` now calls `cmdObj.render()` with an extra index line so this index will be passed to the rendered 
* [ ] We also need to cache the parameters so we can update them when we receive `{index, state}` from a UI update, then do a render again.
* [ ] Basically, `RenderSource()` is an initial render, and updates to it should be something called `UpdateSource()` which rerenders the JSX with the new aggregate state.

## OCT 18 SUN - Add State Object Render Representation

How does this work? 

* [x] implement base SM_Keyword` keywordObj(parms: string[]): KeywordObject`
* [x] add `m_RenderKeywordObject(): KeywordObject` 
* [x] add `RenderSourceStates(source)`
* [x] update `defTemplate` w/ `keywordObj()`
* [x] update `defProp` w/ `keywordObj()`
* [x] update `useFeature` w/ `keywordObj()`

Ok, test-keygen is now getind the render source states. Now we render those.

* [x] `Generator.uiUpdate()` is now obsolete
* [x] `defTemplate.render()` 
* [x] endTemplate.render()
* [x] defProp.render()
* [x] useFeature.render()

Yay, the state is now being updated outside of React through our update mechanism. We will write source from our outside-react state!

## OCT 19-20 MON - Bonus Coding

Leaving off form last night, here is where we are right now. Mondays, Tuesdays are not serious work days and are reserved for meetings and such so deep coding work is not usually something I can get to.

Anyway, I'm letting React update its components, but also mirroring state changes on the keyword level back to our own structure of "Keyword Objects". These Keyword Objects can compiled back into source code. 

1. change the `arg` object back to array to preserve order of parameter definition
2. write `KeywordObjToSource()` function

## OCT 21 WED - Resuming Changes

First up: I want to change the `arg` object in a KeywordObject to be an array. The advantage of this is that the order of parameters is preserved for regenerating source code. The meaning of the argument value is also documented by the KeyWord instance's `args` array.

* [x] **remove** `KEYGEN.RenderSourceToJSX(source)` is old method
* [x] update `MakeKeywordObjs()`
  * [x] this is stored in the KeywordClassInstances
  * [x] update defProp, defTemplate, useFeature
* [x] update arg to args in `KEYGEN.RenderKeywordObjs()`
* [x] update arg to args in all `keywordObj()` implementors 
* [x] update arg to args in  `KEYGEN.MakeKeywordObjs()`
* [x] update arg to args in  `KEYGEN.RenderKeywordObjs()`
* [x] update arg to args in round-trip back to state update in `<ScriptElement>` implementations
* [x] write `KEYGEN.KeyObjsToSource()`

Yay it works! Commit!

* [x] now **document** it so Ben understands the setup
* [x] add `serialize() ` method  
* [x] change handler for `defTemplate` use serialize instead
* [x] rewrite `TEST_UPDATE` loop to use `UIUpdate`  
* [x] rethink naming for KeywordObject and SM_Keyword...they are not the same thing. 

Commit! It works and it's clean. One small wrinkle is the issue with Typescript not working wiht destructuring arrays (incorrectly infers type)

## OCT 22 THU - Expressions

*Review **[OCT 15](#OCT 15 THU - implementing additional keywords)** notes for parsing and expressions with regards to GEMscript.*

To recap, here's how the expression stuff works:

1. tokenize input into token objects that also contain values (e.g. `ADD` has `value` that is part of the token.
2. parse the tokens, recursively creating a tree based on each token, and applying rules that enforce order of operation. This creates a tree.
3. evaluate the expression by walking the tree from the top and visiting each node.

I'm not very clear on how 2 and 3 work, so I'll implement some test code based on [advanced example](https://github.com/plantain-00/expression-engine). 

```
note: expression.peg defines all the token types
```

#### tokenizer

```
nextToken() checks char-by-char and generates:
nextStringToken() - any " or ' string
nextPunctuator() - any punctuation not arithmetic
nextNumericToken() - parses any float
nextIdentiferToken() - delimited keywords, identifier
```

#### parser

There are a lot of complicated token parsing things. We only need a few of them though. I'll mark them with a star.

This reorganizes the tokens into a tree of "expressions" that can be walked, returning actual values. Each type of expression has custom properties that are used by the evaluator.

```
recusrive entry point: parseExpession()

  tokens.length determines:
* length 1: literal
* length 2: unary expression
  compare first/last { } : object literal
* length: 3: process left,operator,right
  punctuator?
*   parseMemberExpression if callOperators (. or ?.)
    => arrowFunctionExpression left.type, right.type
    parseBinaryExpression if binaryOperator
  length 4:
    parseExpression for '%' right value
*   parseExpression parseGroup if any '('
    parseArrayLiteral parseExpression if '['
    parseMemberOrCallExpression if '(
    postfixUnaryOperators
    prefixUnaryOperators
*   parsePreviousExpression if prioritizedBinaryOperators
  length 5:
*   parseConditionExpression
  otherwise:
    is arrow function expression?
  otherwise:
    error
```

#### evaluator

```
entrypoint evaluateExpression
  expression, context { [name:string]:unknown }, local 
  
there is a global evalutate function and a method called evalutate.
the method version calls the global cersion
class Evaluator
	has evalutate(expression, context, isFirst, this)

global evalutate(
express, context, isFirst, protocol (the class instance)	
```

#### usage

```
const tokens = tokenizeExpression('a + b')
const ast = parseExpression(tokens)
const result = evaluateExpression(ast, { a:10, b:20 }
const expression = printExpression(ast)
```

### Implications for us

An expression is anything that produces a value. We want to parse expressions that are of the form:

```
RIGHT HAND SIDE: 
.propName -- return value of global propName
.propName methodName -- return result of invoking method on global prop
methodName -- return result of global methodName
bee.propName --- return prop value
bee.propName methodName args -- return result of [propName].method
bee methodName args -- return result of bee.method
1 - return literal number
"hi" - return literal string
1 + 2 * (3) -- arithmetic expressions returning value
if (expr condition expr) -- test returning boolean

LEFT HAND SIDE for ASSIGNMENTS
.propName = 
bee.propName = 
```

Keywords build expressions. Args can also be an expression.

**So what to do?** 

Our keyword-based script engine compiles programs of smc_ops from source lines that are similar to the above. Because we're hand-coded the scripts directly, our expression evaluation can be limited to the stuff above. But what do these keywords look like?

```
defTemplate Bee
  defProp .lemons GSNumber 1
  .lemons = .x + 1
  .lemons = agent("leader").lemons + .lemons
  .lemons = agentSet("Bee") count + 10
  
  when Bee touches Fish
  and Bee.lemon > 10 + Fish.pollen
  	Bee.lemon increment
  	Fish.pollen decrement
```

In terms of our script engine, these turn into the following keywords

```
[
  defTemplate Bee
  defProp lemons GSNumber 1
  setProp lemons .x + 1
  setProp lemons agent("leader").lemons + .lemons
  setProp lemons agentSet("Bee").count + 1
  agentPairTest Bee Fish touch -> PairSet on stack
  filterPairSet Bee.lemon > 10 + Fish.pollen
  ifTrue [ Bee.lemons increment, Fish.pollen decrement ] 
]
```

The expressions are:

```
.x + 1 // (left, operator, right) 
agent("leader").lemons + .lemons // multiple expressions
agentSet("Bee").count + 1 // multiple expressions
Bee.lemon > 10 + Fish.pollen // multiple expressions
```

To evaluate these expressions, what do we need to do?

* **tokenize!** Ben's old code attempted to do this in the UI, but it was cumbesome with nesting of components. We can instead use a simpler expression builder to build our tokens for us chunk-by-chunk.
* **parse!** Our parser has to recurvely consume each token to build the expressions of the AST. The AST is what is executed by evaluate
* **evaluate!** the AST is recursively walked, each recursed call either calling itself or returning value

### Creating Token Types for GEMscript Expressions

Let's break out three examples and try manually creating the TOKENS that we eventually have to PARSE then EVALUATE.

#### Binary Expression

```
.x + 1
---
PROPVAL { value: x }
OPERATOR { value: + }
LITERAL { value: 1 }
```

#### Compound Expression

```
agent("leader").lemons + .lemons
---
KEYWORD { type: agent, value: leader }
DOT
PROPVAL { value: lemons }
OPERATOR { value: + }
PROP { value: lemons }
```

#### Conditional Expression

```
Bee.lemon > 10 + Fish.pollen
---
SET { value: Bee }
DOT
PROPVAL { value: lemon }
OP { type: conditional, value:'>' }
LITERAL { value: 10 }
OP { type: math, value '+' }
SET { value: Fish }
DOT
PROPVAL { value: pollen }
```

At this point, we might as well try stealing code out of the expression-engine, or we could just use it as-is.

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


