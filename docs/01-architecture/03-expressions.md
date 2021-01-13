The following analysis came from looking at `expression-engine` on github. Since then, we're now looking at using the `expression-eval` code that's built on `jsep`, which is much cleaner.

## TOKEN INTERFACES

Token consists of any of the following:
* marks terminals/shared items

  Node (base)     { range: [start:number, end:number] }
  PunctuatorToken { type, value: string }
  BooleanLiteral  { type, value: boolean }
* Identifier      { type, name: string }
  KeywordToken    { type, name: string }
* NumericLiteral  { type, value: number }
* StringLiteral   { type, value: string }
* NullLiteral     { type }
  EOFToken        { type }

## EXPRESSION INTERFACES

Expressions are any of these, which is the crux of interpreting a program language.
```
  Node (base)               { range: [start:number, end:number] }
  BinaryExpression          { type, operator, left, right }
  MemberExpression          { type, object, property, optional? }
* Identifier                { type, name: string }
* NumericLiteral            { type, value: number }
* StringLiteral             { type, value: string }
  ConditionalExpression     { type, test, consequent, alternative }
  CallExpression            { type, callee, arguments, optional }
  LogicalExpression         { type, operator: LogicalOperator, left, right }
  UnaryExpression           { type, operator, argument }
  ThisExpression            { type }
* BooleanLiteral            { type, value: boolean }
  ArrayExpression           { type, elements: (Express|SpreadElement)[] }
  ObjectExpression          { type, properties (Property|SpreadELement)[] }
* NullLiteral               { type }
  ArrowFunctionExpression   { type, params: Pattern[], body: Expression }
  FunctionParamsExpression  { type, params }
```
## TYPES
```
  Pattern = Identifier | AssignmentPattern | RestElement
  AssignmentPattern { type, left: Identifier, right: Expression }
  RestElement { type, argument: Identifier }
  SpreadElement { type, argument: Expression }

  LogicalOperator = '||' | '&&' | '??'
  UnaryOperator = '+' | '-' | '!' | '~' | '%' | 'await'
  BinaryOperator =  | '**' | '*' | '/' | '%' | '+' | '-' 
                    | '<<' | '>>' | '>>>' | '>' | '<' | '>=' | '<=' 
                    | '==' | '!=' | '===' | '!==' 
                    | '&' | '^' | '|' | '|>'
```
## TOKENIZER MAKES TOKENS

Consumes a string character-by-character to determine the kind of Token.
The entry point is toTokens() after construction, returning this.previousToken
The previousToken is set by specialized string, numeric, punctuators, identifiers. These are all the major types of tokens, though there are subtypes as well.

The top level call identifies spaces, literal strings, numbers, punctuators, and identifiers.
Numbers can be floats, hex, etc. 

The returned tokens have { type, range, ...specificparms }, capturing the value (if there is any) of every token as well as the range. 

## PARSER MAKES EXPRESSION TREE

Consumes an array of Tokens. 
The entry point is parseExpression(tokens), which calls itself recursively.
It checks the length of the passed token array at first, because these short length token chains are the terminals.
```
  parseLiteral, parseUnaryExpression, parseObjectLiterals
  parseMemberExpression, parseBinaryExpression, parseExpression
  parseGroup, parseArrayLiteral, parseMemberOrCallExpression
  parsePreviousExpression
  parseConditionalExpression
  parseFunctionParameters
```
The checks that use tokens.some to check for ( and [ extract the tokens and run them through another pass of parseExpression. It creates a tree with the various stuff calculated deeply.

## EVALUATOR
Consumes an AST root (Expression) with a context (variable contents) and some kind of "customData" which is an array of constructor functions.

The entry point is evaluateExpression(), which consumes the above.
It makes use of an Evaluator class that implements EvaluatorProtocol, 
which requires the following:
```
  local:Local
  evalutate(expression, context, isFirstIdentifier)
  evaluateBinaryExpression(binaryExpression, contextObject)
  evaluateLogicalExpression(logicalExpression, contextObject)
  evaluateUnaryExpresion(unaryExpression, contextObject)

There are also global function versions of these member functions:
  global evalutate which returns actual values when it can.
  global evaluateBinaryExpression does the actual math and logical tests
  etc
```
Everything in the EvaluatorProtocol just is for digging down into things, and the global functions does the actual returning of values that eventual result in something. 
