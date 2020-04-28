# Lerna Tips

## How do I add a NEW package to the monorepo?

Our monorepo is managed by `lerna`, which is a wrapper for `npm` or `yarn` that manages the contents of `node_modules` for you so you can have one giant 

Assume you want to add a new package named `mypackage` using the `@gemstep` scope. Make sure you are in the monorepo root, then issue the following commands:

```
lerna create @gemstep/mypackage -y     # create npm package skeleton in gs_packages
```

You should look at the `package.json` and update it as necessary. Make sure you set it to private, since we're not publishing GEMSTEP as a public resource available via npm.

**WARNING** if you don't use `lerna create` then lerna won't know about versioning when you run `lerna version`

If you are running a standalone package like a new server, then you're done. However, if you're making a package that you'd like to import into another package, you'll have to use the `lerna add` command followed by `lerna bootstrap`:

```
# add the link one at a time
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp1
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp2
# clean node_modules and relink, consolidating common modules
lerna clean -y && lerna bootstrap --hoist
```

You can then import the packages into other packages, as if they were already npm-installed. 

## What is the best way to commit from dev to master?

In SourceTree, you can do a merge+rebase from dev onto master. Dev retains all the history of commits, but master remains relatively clean.

## How do I manage versions with Lerna?

#### TL;DR

For our `0.x.x-alpha` releases, use this command (commit locally first!)

```
lerna version prelease
```

---

GEMSTEP is comprised of many packages, but they all share the same version number and a single repo. The `lerna version` command is used to manage all the `package.json` files.  Note that [versioning](https://github.com/lerna/lerna/tree/master/commands/version) is different that [publishing](https://github.com/lerna/lerna/tree/master/commands/publish), wihich makes the package to **npm** for public consumption.

The `lerna version` command will:

* interactively prompt for a new version bump
* modify all the `package.json` files
* commit the change to the repo and tag it
* !!! **push the commit to the upstream remote** !!!

```
lerna version 1.0.1 # example of explicit versioning to "1.0.1"
lerna version patch # example of version to a "patch" keyword
lerna version       # select from prompts interactively
```

Currently, we're using `lerna version prerelease` to automatically bump our prerelease versioning (major.minor.patch-alpha.N) to the next integer N in the sequence. 

* `major.minor.patch` is the normal versioning scheme (e.g. 0.1.1).  By convention if  major number is 0, it's considered a "prerelease" meaning that it's not yet stable enough for public consumption.
* `major.minor.patch-prelease` is used to denote "prerelease" versions (e.g. 0.1.1-alpha). These are interim releases that are under development as a work-in-progress but are being shared regardless. 
* Run `lerna version prerelease` initially when just getting the repo into some kind of shape. 
* Run `lerna version minor` when a release is feature-ready.

## How do I add npm packages to existing projects?

You can use regular `npm install` or `yarn install` inside the package subfolder. 

* If it's only for that submodule, do the `npm install` in the subfolder, then in the root folder execute `npm run bootstrap`
* If you want to add the package to everyone, then use `lerna add` has is that it can add packages to *all* our packages at once.
* If you are added a package related to VSCode formatting (e.g. eslint, prettier) then you should reload the editor also after installing

### Examples

Use `lerna add` with the optional `--dev` and `--peer` flags. It works like `npm install` but can only install one package at at time. 

> `npm add react-markdown
> _note: this has to be executed at the TOP LEVEL of gsgs_

It also accepts [lerna filters](https://www.npmjs.com/package/@lerna/filter-options) like `--scope=packagename` to install the package ONLY in the scope (a folder in our `gs_packages` directory)

> `npm add react-markdown --scope=gem_srv`
> _note: this has to be executed at the TOP LEVEL of gsgs_

## How do I add a local package? I'm getting an error!

```
npm ERR! 404  '@gemstep/globals@^0.0.0' is not in the npm registry.
npm ERR! 404 You should bug the author to publish it (or use the name yourself!)
npm ERR! 404 It was specified as a dependency of 'app_srv'
```

This seems to indicate a bad reference to a package version, as the current package in `lerna.json` is `"0.0.1-alpha.0"`, not `"0.0.0"`. I updated them manually and it seemed to work. 

##  Can I use lerna anywhere in the directory structure

**Yes** it will walk up the directory tree until it finds a lerna.json!

## Can I open JUST a sub package in Visual Studio Code and work?

Convention: `npm run local` is an alias for just running the current build

