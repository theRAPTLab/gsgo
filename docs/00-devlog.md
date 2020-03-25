SRI'S DEVELOPMENT LOG

---
# 2. Scaffolding the System

Essentially I just need to make a webserver, or webservers, that serve a webapp that is capable of handling multiple routes and connecting to the framework, and start filling it in.

## 20-0325-1 Setting up shared lerna packages

Currently, when I `npm run dev` this runs the current **app_srv** package, which is the only package.  First, I'd like update the directory structure:
* rename gsgo -> gsutil
* rename packages -> gs_packages

I'd like to change it so it imports a package from another place. Let's see if I can do that.
```
lerna create @gemstep/globals -y  # create a @gemstep/globals project directory
# modify the config.js file that was created, look at the package.json
# from monorepo root, add to package
lerna add @gemstep/globals --scope @gemstep/app_srv
# use gemstep script to 'lerna clean -y && lerna bootstrap --hoist'
npm run bootstrap
# now import package '@gemstep/globals' into app_srv
# import CONFIG from '@gemstep/globals'
```
Adding to monorepo...
```
# use license MIT
lerna create @gemstep/admin_srv 
lerna add @gemstep/globals --scope=@gemstep/admin_srv
lerna bootstrap
# edit package.json, README.md
```
See [wip server architecture doc](03-server-arch.md). Anyway, I added `@gemstep/admin_srv` and `@gemstep/gem_srv`, and these both import `@gemstep/globals`

At this point it would be nice to make a generic media server package.

## 20-0325-2 Setting up Servers

I need to get all the web pages working, so I need to make a list of things to connect to. Let's do that.

ServicesList:

* Presentation Server on port 3000
* Admin Webserver on port 8800
* Student Webserver on Group Server Port 80
* URSYS Controller on socket
* FAKETRACK on socket
* Authentication centralized on URSYS, with separate UserLists

How do Group Servers work?

When a group server starts up on a separate machine, it has to find an URSYS controller on the network. It's a node app. The node app spawns a student webserver from its local copy of the app. It has its own id set, and can be controlled from the URSYS controller (which I guess is the master). It would be capable of generating its own streams of data and simulation, and replicate data to the main controller.

For now we'll implement everything on a single server, with an eye toward breaking them into multiple servers. For now we'll use URSYS as the main control mechanism.

* We need modular code and debugging for Node.
* The URSYS controller has to maintain everything, though.

To establish the server architecture, let's make **one server**, and break out the different modules. 

* make lerna packages admin_srv and gem_srv in addition to app_srv.
* app_srv may be split into admin_srv and gem_srv
* we don't yet have **routing** and **view** architecture considered, much less the webpack build system. 
* we also want to use React I think.

So that means using **react router** to handle our loading, but we could also use server-side rendering version of React. The `ReactDOMServer` object will renger static markup as strings or as a stream. [This repo](https://github.com/Rohitkrops/ssr) describes the general process, though they recommend using NextJS to implement it. We can totally do that for our static website tests, all under one repo

```
npm install --save react react-dom next
mkdir pages
echo > pages/index.jsx
npm run bootstrap
# adjust port in next -p
npm run dev
```

After this, we can follow the NextJS tutorials to make a SSR site. I'm thinking of proxying the URSYS presentation server to the various ports, which might be super cool.

```
git clone git@gitlab.com:stepsys/gem-step/gsgo.git
cd gsgo
nvm use           # is nvm installed and using specified version?
which lerna       # is lerna installed globally?
git branch        # on correct branch?

npm ci            # initialize monorepo tools
npm run bootstrap # initialize monorepo

```


---
# 1. Creating Monorepo

2020-0317 - Lerna is used to manage "monorepos", which contain multiple "packages" inside subdirectories. Each package can have its own package.json and build system, but it's all managed under the same git repository. Therefore, making a change across multiple modules becomes a single git commit. Lerna is the tool that makes managing the dependencies and importing of packages into code easier. Typical build tasks can be executed at the root level via lerna. 

At the root level, we have `lerna.json` which provides at minimum the version of the entire monorepo. We also have the root level `package.json` which is used to initalize the root-level needs of the project. 

```
(make sure you are using the correct default npm via nvm)
npm install -g lerna
mkdir gsgo && cd $_
lerna init   # note this also does a "git init"
```

## 20-0318: Adding essential configuration files

* Added `.code-workspace` file for Visual Studio code
* Added `.vscode` directory containing workspace settings and snippets
* Added `.editorconfig` with our standard settings
* Added `.nvmrc` with necessary version of npm. Note that global installs 
* Added `urdu` script stub, modified to reflect GEMSCRIPT 

## 20-0318: Minimal port from x-ur-framework

The `x-ur-framework` repo has the key elements of our ported UNISYS (now URSYS) system. It's been renamed to `app_srv` because it is the application server for GEMSTEP. Among its responsibilities are:

* Serving multiple webapps through ExpressJS
* Hot Module Reload for webapp development
* UDP packet forwarding from PTRACK through socket server
* URSYS socket server for device registration and message passing
* centralized logging, database, file storage
* user authentication through URSYS

The current framework only handles ExpressJS and the URSYS registration/messaging, as we will be rebuilding the other services and adding to them.

To port `x-ur-framework` into the new monorepo, I did the following:

* copied `config/`, `src/`, `ursys/`, `package.json`, `urdu` into `packages/app_srv`
* removed `tss-loader` from `package.json` dependencies (fishy)
* ran `npm install` in `packages/app_srv`...failed on babelize
* copied `.babelrc` to `packages/app_srv`...success!

For new users of the monorepo, the instructions are now:

* `npm run bootstrap`
* `npm run dev`

## 20-0318: Configuring Visual Studio Code

Our desired VSCode environment has the following features:

* Live linting through the ESLint extension (`dbaeumer.vscode-eslint`)
* Automatic code formatting through Prettier extension (`esbenp.prettier-vscode`)
* working with AirBNB code style
* working with React
* working with Typescript
* with our specific ESLINT rule overrides

The VSCode ESLint and Prettier extensions look for locally-installed `eslint` and `prettier` packages, and use the associated `.eslintrc.js` and `.prettierrc.js` configuration files. The entire live linting process is handled through ESLint, and code reformatting is handled entirely through Prettier. It is possible for ESLint to also reformat code, but this is explicitly disabled to avoid conflicts.

Key reading:

* [Prettier: Integrating with Linters](https://prettier.io/docs/en/integrating-with-linters.html)
* [Typescript: @typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)

The first key idea is that ESLint is configured via `.eslintrc.js` to use a different syntax parser `@typescript-eslint/parser`, which is part of the official `@typescript-eslint` package. This produces an ESLint-compatible Abstract Syntax Tree, which makes it possible to use other ESLint rules. 

The second key idea is to apply the right ESLint rules, also in `.eslintrc.js`, by specifying ESLint rulesets in the correct order. There are many rulesets and some of them conflict with each others, so following the official documentation in the "Key reading" will go a long way to working through the issues. Many tutorials in the Internet are wrong, misleading, or out of date.

1. "let prettier do the formatting"
2. "tell the linter not to deal with formatting"

### Step 1. Add ESLint Extension to Visual Studio Code

Install extension: **dbaeumer.vscode-eslint**, then do the following in the **root** of the monorepo.

* `npm install eslint -D`
* in VSC settings: make sure `eslint.format.enable` is not present or on
* in VSC settings: make sure `eslint.autoFixOnSave` is not present (old setting)
* in VSC settings: `editor.codeActionOnSave : { source.fixAll:true, source.fixAll.eslint:false }`
* create the `.eslintrc.js` file in the root

### Step 2. Adding Prettier Extension to Visual Studio Code

Install extension: **esbenp.prettier-vscode**, then do the following in the **root** of the monorepo.

* `npm install prettier -D`. For Lerna, we'd use `lerna add prettier --dev` 
* in VSC settings, set: `editor.defaultFormatter : 'esbenp.prettier-vscode'`
* in VSC settings, set: `editor.formatOnSave : true`
* create the `.editorconfig` and `.prettierrc.js` files in the root

### Step 3. Add Typescript

At this point, we have the ESLint and Prettier extensions installed, but they are not yet obeying the the additional linting rules we want: Typescript, AirBnb, JSX. This is described in the [typescript-eslint getting started](https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md) and in [prettier integration with linters](https://prettier.io/docs/en/integrating-with-linters.html) pages.

**install packages** at root level
```
# add airbnb eslint typescript react plugins and rules
npm install eslint-config-airbnb-typescript \
            eslint-plugin-import@^2.20.1 \
            eslint-plugin-jsx-a11y@^6.2.3 \
            eslint-plugin-react@^7.19.0 \
            eslint-plugin-react-hooks@^2.5.0 \
            @typescript-eslint/eslint-plugin@^2.24.0 \
            @typescript-eslint/parser \
            --save-dev

## add prettier eslint rules
npm install eslint-config-prettier eslint-plugin-prettier --save-dev

## add peers
npm i -D eslint typescript prettier
```
**configure** eslint with these essentials
```
module.exports = {

  ...

  plugins: ['react', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  extends: [
    // DEFAULT ESLINT RECOMMENDATION (no typescript, airbnb, or prettier)
    // 'eslint:recommended',
    // 'plugin:@typescript-eslint/eslint-recommended',
    // 'plugin:@typescript-eslint/recommended',

    // OUR ESLINT STACK
    'plugin:react/recommended', // handle jsx syntax
    'airbnb-typescript', // add airbnb typescript rules
    'prettier/@typescript-eslint' // make prettier code formatting to prevail over eslint
  ],

  ...

};
```
**optionally configure** `.eslintignore` file
```
# don't ever lint node_modules
node_modules
# don't lint build output (make sure it's set to your correct build folder name)
dist
```

# Troubleshooting

_JSX files are not being syntax highlighted_
Trying to debug my setup by looking at exampes.
https://medium.com/@NiGhTTraX/how-to-set-up-a-typescript-monorepo-with-lerna-c6acda7d4559

Note: by following the specific commands at eslint-config-airbnb with version numbers, maybe can avoid issues. There are ALWAYS issues with typescript, it seems, with regressions and things breaking.

Made a `tsconfig.build.json` file, and setting `.eslintrc.js` parserOptions.project to this hack:
https://github.com/typescript-eslint/typescript-eslint/issues/251#issuecomment-567365174
```
project: './tsconfig.json',
tsconfigRootDir: __dirname
```

_path alias problems: they work in webpack, but not in vsc highlighting_
see: https://stackoverflow.com/questions/57032522
```
Note: Apparently the eslint-plugin-import is SUPER IMPORTANT for resolving aliases in the IDE!
See: https://www.npmjs.com/package/eslint-plugin-import
See: https://github.com/alexgorbatchev/eslint-import-resolver-typescript

// support tsconfig baseUrl and paths
npm install --save-dev eslint-plugin-import 
npm install --save-dev eslint-import-resolver-typescript
```
adding a "typescript" to settings "import/resolver" to help it find the tsconfig files helps.

* app_srv/src/app/views/ViewMain/ViewMain.jsx - ensure that we're seeing errors caught

_how to resolve path problems?_

The trick was to modify `.vscode/settings.json` to add `eslint.workingDirectories": [{ "mode": "auto" }]`
and also modifying `.eslintrc.js` as follows:
```
'import/resolver': {
  // this require .vscode/settings.json tweak
  // eslint.workingDirectories:[{mode:'auto'}]
  // https://github.com/microsoft/vscode-eslint/issues/696 has some hints
  // has to do with relative directories, monorepos, and eslint 6 changes
  'typescript': {
    'directory': './tsconfig.json'
  }
}
```
This has the effect of making the eslint working direcctory change automatically, and then the tsconfig.json file can actually be found. It's an example of the wonky plugins and path stuff.

Finally, to resolve :

* ursys/chrome/ur-central.js - path errors
* ursys/chrome/ursys - path errors

Modify the `app_srv/tsconfig.json` file with
```
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "ursys/*": ["ursys/*"],
      "app/modules/*": ["src/app/modules/*"],
      "app/*": ["src/app/*"],
      "util/*": ["src/app/util/*"],
      "step/*": ["src/step/*"]
    }
  },
  "include": ["src/**/*", "ursys/**/*"],
```
Now that the tsconfig is being found properly with the vscode setting, we can specify paths. This tsconfig.json is then used by the import/resolver "typescript" setting, which uses it to figure out path resolution so no more errors. NOTE this is separate from webpack, which has its own configuration.
