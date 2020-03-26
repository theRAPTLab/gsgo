# FAQ

## How do I add a new package to the monorepo?

Our monorepo is managed by `lerna`, which is a wrapper for `npm` or `yarn` that manages the contents of `node_modules` for you so you can have one giant 

Assume you want to add a new package named `mypackage` using the `@gemstep` scope. Make sure you are in the monorepo root, then issue the following commands:

```
lerna create @gemstep/mypackage -y     # create npm package skeleton in gs_packages
```

You should look at the `package.json` and update it as necessary. Make sure you set it to private, since we're not publishing GEMSTEP as a public resource available via npm.

If you are running a standalone package like a new server, then you're done. However, if you're making a package that you'd like to import into another package, you'll have to use the `lerna add` command followed by `lerna bootstrap`:

```
# add the link one at a time
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp1
lerna add @gemstep/mypackage --scope=@gemstep/anotherapp2
# clean node_modules and relink, consolidating common modules
lerna clean -y && lerna bootstrap --hoist
```

You can then import the packages into other packages, as if they were already npm-installed. 

## How do I manage versions with Lerna?

GEMSTEP is comprised of many packages, but they all share the same version number and a single repo. The `lerna version` command is used to manage all the `package.json` files.  Note that [versioning](https://github.com/lerna/lerna/tree/master/commands/version) is different that [publishing](https://github.com/lerna/lerna/tree/master/commands/publish), wihich makes the package to **npm** for public consumption.

The `lerna version` command will:

* interactively prompt for a new version bump
* modify all the `package.json` files
* commit the change to the repo and tag it
* push the commit to the upstream remote

```
lerna version 1.0.1 # example of explicit versioning to "1.0.1"
lerna version patch # example of version to a "patch" keyword
lerna version       # select from prompts interactively
```

Currently, we're using `lerna version` **interactively** until we get a sense how this works. This is the interactive version. 

* `major.minor.patch` is the normal versioning scheme (e.g. 0.1.1).  By convention if  major number is 0, it's considered a "prerelease" meaning that it's not yet stable enough for public consumption.
* `major.minor.patch-prelease` is used to denote "prerelease" versions (e.g. 0.1.1-alpha). These are interim releases that are under development as a work-in-progress but are being shared regardless. 



# Useful Tips

##  Useful npm commands

* `npm list -g --depth=0` to see what GLOBAL PACKAGES are installed

## ESLINT gotchyas

If you have multiple `.eslintrc` in any open folders, they may cause mysterious conflicts to display. This can happen if you have a file open from another project with its own `.eslintrc` config. To work around it, try this:

* close the file from the other project (close all files maybe)
* under VSC's git panel, close the associated git repo
* quit vsc, then restart with the workspace

There is a VSCode extension that will restart the entire editor for you from the status par. Good to use anytime you mess with an internal setting.



