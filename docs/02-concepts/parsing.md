# Javascript Parsing Notes

Notes based on materials from [tomassetti.me](https://tomassetti.me/parsing-in-javascript).



## Big Picture Parsing Concepts

* **parser generators** are tools that create code for a parser, instead of you having to write it yourself
* **parser combinators** are libraries that create the parser code

A big picture introduction to terminology can be found here in this [Parsing Algorithms Guide](https://tomassetti.me/guide-parsing-algorithms-terminology/).

### Structure of a Parser

A parser is usually a two-part system consisting of a ***lexer*** (AKA *scanner* or *tokenizer*) and the parser itself. 

* **lexer**: scans the input and produces matching ***tokens***
* **parser**: scans the tokens and produces a structured result

`Note: a parser that doesn't have a lexer/tokenizer is called a *scannerless parser*. `

Tokens are produced using definitions called *rules* (AKA *productions*). 

In ye olden days, there would be one tool to produce the lexer code (e.g. unix **lex**) and another tool to produce the parser code (e.g. unix **yacc**). 

### Results of a Parser

The output of the parser can produce a **Parse Tree** or **Abstract Syntax Tree** (AST), which are different structures but share 

* A Parse Tree contains tokens + "intermediate rules" 
* An AST is a polished version of the parse tree with the derivable information removed.

The AST drops information like comments and grouping symbols (parenthesis), whereas a Parse Tree will retain a representation closer to the syntax. It can retain details that reveal the implementation details of the parser (?). 

## Describing a Language with a Grammar

A **grammar** is a description of the language that can be used to recognize its structure.

The most used format to describe grammars is **Backus-Naur Form** (BNF) and **Extended Backus-Naur Form**, which adds a way to denote repetitions using curly brackets. There are many other formats too.

We'll start with the **general form of a BNF rule**, which looks like:

    <symbol> ::= __expression__

Here, a **symbol** is defined by an **expression** (a group of **elements**). A symbol is usually **nonterminal**, while expressions can be a combination of both terminal and nonterminal symbols. 

* A **terminal** is a literal string (e.g. "class")
* A **nonterminal** is an expression consisting of other symbols

Examples of BNF grammar declarations here: http://www.cs.utsa.edu/~wagner/CS3723/grammar/examples2.html

### Types of Languages and Grammars

There are two [types of languages](https://en.wikipedia.org/wiki/Chomsky_hierarchy) that a parser generator handles: **regular languages** and **context-free languages**. 

* Regular languages can be parsed using regular expressions for pattern matching
* Context-free languages require something more than pattern matching

Most programming  languages are context-free. 

Languages are recognized by grammars. Regular languages can be described using a **regular grammar** (RG), while context-free languages can likewise be described with a **context-free grammar** (CFG). However, there are other grammars such as **Parsing Expression Grammar** (PEG) that are designed be more expressive for a particular use (e.g. computer languages).

The difference between **PEG** and **CFG**:

* PEG takes the order of choices into account, allowing it to resolve multiple grammar matches. CFG does not handle this ambiguity.
* PEG is a scannerless parser. 
* Neither PEG or some CFG parser generators can handle "left-recursive" rules (see below).

### Recursive and Indirect Rules

A BNF rule can be **left-recursive**, meaning that it can define itself with itself. I think 'left' refers to the recursion appearing on the left side of the expression, not the left side of the entire rule. However, not all parser types can handle it (e.g. not "recursive-descent" or "LL" parsers). 

```
expression ::= expression '*' expression || expression '+' expression || term
term       ::= number | variable
```

A BNF rule can also be **indirectly left-recursive** because line 3 and line 5 are defined in terms of each other. 

```
digit          ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
number         ::= digit { digit }
addition       ::= expression '+' expression
multiplication ::= expression '*' expression
expression     ::= addition | multiplication | number
```

## Javascript Tools

| Tool       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| Lexer      | (Javascript) A regular parser generator. Can integrate with Jison. Grammarless. Small. |
| ANTLR      | (Java) A parser generator that can target both Javascript and Typescript. Uses "Adaptive LL(*) Parsing". Supports left-recursive rules, with a large community. |
| APG        | A recursive-descent parser using "Augmented BNF" designed to support bidirectional communications protocol (used in Telecom industry). |
| Jison      | (Javascript) A standalone bottom-up parser generator. Recognizes LALR(1), LR(0), SLR(1) grammars. Used by CoffeeScript and HandlebarsJS. |
| Nearly     | (Javascript) Uses "Earley" parsing algorithm. Parses *all* grammars, but may be slower. Includes useful debug tooling and can generate **railroad diagrams** (a visual representation of a grammar). Requires a runtime. Can execution Javascript code as part of a rule. |
| Canopy     | (Javascript) A PEG parser generator. Generates parsers that require no runtime dependencies. Canopy grammar rules can map to Javascript code to return the parsed structure. |
| Ohm        | (Javascript) a PEG parser generator. An Ohm grammar defines the language, and "semantic actions" are written in the target language. Has an [interactive editor](https://ohmlang.github.io/editor/). Very clean-looking grammar. |
| PEG.js     | (Javascript) A simple parser generator with support for "embedded actions" and "semantic predicates" ([a way to enforce extra rules with code](https://stackoverflow.com/a/3056517)). |
| Waxeye     | (Built on [Racket](https://docs.racket-lang.org/guide/intro.html) which is Lisp/Scheme) that can target Javascript and others. Generates a language-independent AST. Sort of an interactive parser generator. |
| Bennu      | (Javascript) A combinator library of parser routines inspired by Parsec. |
| Parjs      | (Javascript) A combinary library similar to Parsec and Parsimmon, relatively new. |
| Parsimmon  | (Javascript) A combinator library for writing big parsers out of small ones. Inspired by Parsec and Promises/A+. |
| Chevrotain | (Javascript) A hybrid LL(k) "Parsing DSL" which is a cross between a combinator and a generator. Grammar is defined in Javascript code directly using the API, not a syntax. Because it's API driven, it's also very very fast. |



## Parsing and Expressions

To review, parsing consists of 

