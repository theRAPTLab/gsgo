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

