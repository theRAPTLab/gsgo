## Typescript Notes

I took another stab at using Typescript for a new library. I have decided that Typescript will not be part of our development environment if I can help for the following reasons:

1. **Compile-time static analysis is a miniscule win for high cost** - Javascript is untyped and therefore prone to mistakes in assigning properties to objects or mistyping names of functions. However, these are very fast crashes that are relatively easy to debug. Furthermore, using the live linting extension *already* highlights mispelled and unused variables. 
2. **It's not possible to use Typescript trivially** - One of the original conceits was that you could just add Typescript to your toolchain and start adding it incrementally to your code. While it's true that you can do this in the toolchain, the moment you change your source file extensions from `js` to `ts` or `jsx` to `tsx` you have to conform everything that uses a type. 
3. **Typescript errors are very verbose** - They are seldom short or prescriptive. They are exceedingly descriptive spanning multiple lines requiring a deeper knowledge of computer language metaconcepts. 
4. **Typescript decorations gets in the way of expressive, readable code** - This is the biggest dealbreaker. We are writing code that we expect casual developers to read and understand. We spend a lot of time trying to clarify our code so it tells a story as you read it, with some footnotes in comments to provide necessary context. Typescript, by comparison, litters code with some many declarations that it quickly becomes overwhelming unless you have access to a separate document that describes everything.
5. **Typescript is a terrible environment for rapid prototyping** -  It gets in the way of concepting the flow code during the prototyping stage because of the dozens of warnings it throws the moment you add a Typescript keyword. This is a constant distraction that doesn't aid in casual design approaches. 

There are a couple of uses I can think of: 

1. **Typescript is increasingly used in open source Javascript libraries, so familiarity with it would be helpful.** Not much more to say about that. Even then, Typescript is never a requirement for using those libraries; it's more useful when you have to look at source to figure out what the hell it's doing, when there is an absence of good documentation.
2. **Typescript could be useful in very strictly designed implementation of protocol-handling code**. If you have the time to create a nice hierarchy of objects and data types, Typescript would allow you to express it. That said, it doesn't help you test the code or guard against runtime errors. 

My recommendation at this time (June 25, 2020) is to **retain the typescript compiler** in our development environment so we have the option of using it, but not requiring it at all except perhaps in refactoring some of the critical URSYS libraries as a separate expense. This requires a different approach to development than we've been using, however: more structured, top-down design.  It demands a certain kind of thinking to do well.

The practical payoff is minimal, I think. Runtime checks are already necessary for any dynamic data. , unit and integration testing is way more important. If we were working with a larger development team, I could see this being more useful but also much more expensive in terms of developer time and resources.

### Continuing stupid issues with typescript

when I'm in gsgo, it's fine, but when in gem-srv workspace, tsconfig will throw an error on the first open file, unable to find the configuration.

Maybe the workaround is to use gsgo but hide the projects that are not in use in WORKSPACE SETTINGS. This seems to work correctly then. There might be a way to override the working directories using some kind of path setting in eslint [see here](https://github.com/microsoft/vscode-eslint/issues/722)

```
  "eslint.workingDirectories": [
    { "directory": "front", "changeProcessCWD": true },
    { "directory": "server", "changeProcessCWD": true }
  ]
```

I'm not sure what's going on here.

Multi-root also has issues with paths ot being resolved by vscode-eslint becuase it's not switching directories properly. 

**Maybe I need to upgrade my version of eslint from 6.8 to latest 7.x**... there is a configuration change where it loads files relative to the first loaded configuration file, not the current working directory.  **Typescript 4.03 could be updated to latest 4.2.3** to see if it resolves some of these stupid path issues.

Newer versions of Typescript no longer allow import of `d.ts` files. Instead these pure type classes have to be pecified in `compilerOptions.typeRoots` as [described here](

