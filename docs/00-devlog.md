## 20-0318: Creating Monorepo

Lerna is used to manage "monorepos", which contain multiple "packages" inside subdirectories. Each package can have its own package.json and build system, but it's all managed under the same git repository. Therefore, making a change across multiple modules becomes a single git commit. Lerna is the tool that makes managing the dependencies and importing of packages into code easier. Typical build tasks can be executed at the root level via lerna. 

At the root level, we have `lerna.json` which provides at minimum the version of the entire monorepo. We also have the root level `package.json` which is used to initalize the root-level needs of the project. 

```
(make sure you are using the correct default npm via nvm)
npm install -g lerna
mkdir gsgo && cd $_
lerna init
git init
```

## 20-0318: Adding essential configuration files

* Added `.code-workspace` file for Visual Studio code
* Added `.vscode` directory containing workspace settings and snippets
* Added `.editorconfig` with our standard settings
* Added `.nvmrc` with necessary version of npm. Note that global installs 
* Added `urdu` script stub, modified to reflect GEMSCRIPT 

## 20-0318: Minimal port from x-ur-framework

Let's see if we can just get the old project to build:

* copied `config/`, `src/`, `ursys/`, `package.json`, `urdu` into `packages/appserver`
* removed `tss-loader` from `package.json` dependencies (fishy)
* ran `npm install` in `packages/appserver`...failed on babelize
* copied `.babelrc` to `packages/appserver`...success!

This is good enough for now as we can continue development, and then break things out into other packages later.

## 20-0318: Configuring Visual Studio Code and Building

There are two major entry points for build: **webpack** and **visual studio code**. These share some of the same underlying tools (e.g. ESLint) and share configuration some of the time, which is confusing. Compounding the issue is the fragile chain of dependencies between ESLint, Webpack, Typescript, and Prettier. It doesn't help that ESLint has an obtuse plugin architecture, making it difficult to understand what is actually affecting what.

