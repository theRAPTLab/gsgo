# Lerna and Packages

## What is Lerna anyway?

It's a tool to manage monorepos, which is a git repo that has multiple "packages" that would otherwise have been separate-but-interlinked repos. The big win of a monorepo is that you can make changes across all packages and commit them at the same time. The alternative is to do commits on each individual repo and bring them in one-by-one. Additionally, Lerna can manage the linking of dependencies for you, simplifying cross-package updates and versioning.

Lerna works with both `npm` and `yarn`. In GEMSTEP we are using `npm`. 

A minimum Lerna monorepo consists of:

* a root `package.json` that includes `lerna` as a devDependency. 
* a `lerna.json` file with minimum `version` field in SemVer format.
* a `packages` directory that will contain the individual repos.

In GEMSTEP, our monorepo includes the additional tooling:

* Additional configuration files for EditorConfig, ESLint, Git, Node Version Manager, Prettier, Typescript.
* Visual Code workspace file and workspace settings.
* Additional Node packages in `package.json` for running the `gsutil` development tool.

## How do I add a new package to the monorepo?

Assume you want to add a new package named `mypackage` using the `@gemstep` scope. Make sure you are in the monorepo root, then issue the following commands:

```
lerna create @gemstep/mypackage -y     # create npm package skeleton in gs_packages
```

You should look at the `package.json` and update it as necessary. Make sure you set it to private, since we're not publishing GEMSTEP as a public resource available via npm.

**WARNING** if you don't use `lerna create` then lerna won't know about versioning when you run `lerna version`

If you are running a standalone package like a new server, then you're done. 

## How do I add npm packages to existing packages in the monorepo?

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

## How do I add a reference one package from another?

If you want to add the new package as a dependency to other packages, use the `lerna add` command followed by `lerna bootstrap` from the root level of the monorepo.

```
# add the link one at a time
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp1
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp2
# clean node_modules and relink, consolidating common modules
lerna clean -y && lerna bootstrap --hoist
```

You can then import the packages into other packages, as if they were already npm-installed. 

For **Visual Studio Code** module resolution, you'll need to copy a `tsconfig.json` from one of the package directories so it is at the root (e.g. `gs_packages/ursys/tsconfig.json`, where `ursys` is one of the monorepo packages). 

At minimum the `tsconfig.js` file needs to contain:

```
{
  "extends": "../../tsconfig.build.json",
  "compilerOptions": {},
  "include": [ "src_glob" ]
}
```

Then **reload Visual Studio Code**. The highlighted module editor errors should go away. You will also have to `include` any source directories that you want linted.

## How do I add a lerna package as a dependency? I'm getting an error!

```
npm ERR! 404  '@gemstep/globals@^0.0.0' is not in the npm registry.
npm ERR! 404 You should bug the author to publish it (or use the name yourself!)
npm ERR! 404 It was specified as a dependency of 'app_srv'
```

This seems to indicate a bad reference to a package version, as the current package in `lerna.json` is `"0.0.1-alpha.0"`, not `"0.0.0"`. I updated them manually and it seemed to work. 

##  Can I use lerna anywhere in the directory structure

**Yes** it will walk up the directory tree until it finds a lerna.json.

## When I add a new package to the monorepo, the Version is out of synch

This occurs when using `lerna bootstrap --hoist` (or our `npm bootstrap` script which uses the hoisting option). 

The only solution I know of is to ensure that the versions in the packages also match the root level package.json. I'm not sure this is always desirable; there might be a package that we don't want. In that case, we may not want to hoist certain 

## When I npm run bootstrap, webpack throws "module not found" errors during build

Researching. It is happening in `gs_packages/ursys` after running `npm run bootstrap` in the root. I worked around it by installing the packages again at the local level using `npm i -S` 



# Lerna Repo Management

## What is the best way to commit from dev to master?

Our Lerna config disallows versioning from anywhere except the master branch. The steps are:

* Assuming `dev` is up-to-date, merge dev onto master locally. Then run `lerna version prerelease`. 



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



## Can I open JUST a sub package in Visual Studio Code and work?

Yes, but you have to duplicate some configuration files from the root:

* `tsconfig.json` that `extends` the `tsconfig.build.json` file in the monorepo root. Edit it so the path can be found. This file is required by `@typescript-eslint` to know how to compile source files, and you need to constomize it to your project folder structure.

The other configuration files should not require copying. ESLint, for example, will search backwards up the directory chain until it finds a config file. In VSCode, Typescript will stop searching at the root of the project.

Convention: `npm run local` is an alias for just running the current build. 

