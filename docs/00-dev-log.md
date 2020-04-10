SRI'S DEVELOPMENT LOG

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

##  Mar 18.0 - Adding essential configuration files

* Added `.code-workspace` file for Visual Studio code
* Added `.vscode` directory containing workspace settings and snippets
* Added `.editorconfig` with our standard settings
* Added `.nvmrc` with necessary version of npm. Note that global installs 
* Added `urdu` script stub, modified to reflect GEMSCRIPT 

## Mar 18.1 - Minimal port from x-ur-framework

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

## Mar 18.2 - Configuring Visual Studio Code

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

## Troubleshooting

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

---
# 2. Scaffolding the System

Essentially I just need to make a webserver, or webservers, that serve a webapp that is capable of handling multiple routes and connecting to the framework, and start filling it in.

## Mar 25.0 - Setting up shared lerna packages

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

At this point it would be nice to make a "server components" package that I can use to build special servers as just imports, but I can wait until we're actually making those servers.

## Mar 25.1 - Setting up Servers

I need to get all the web pages working, so I need to make a list of things to connect to. Let's do that.

ServicesList:

* Presentation Server on port 3000
* Admin Webserver on port 8800
* Student Webserver on Group Server Port 80
* URSYS Controller on socket
* FAKETRACK on socket
* Authentication centralized on URSYS, with separate UserLists

| Q. How do Group Servers work?                                |
| ------------------------------------------------------------ |
| A. When a group server starts up on a separate machine, it has to find an URSYS controller on the network. It's a node app. The node app spawns a student webserver from its local copy of the app. It has its own id set, and can be controlled from the URSYS controller (which I guess is the master). It would be capable of generating its own streams of data and simulation, and replicate data to the main controller. |

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

## Mar 26.0 - Bumping Version of Repo

As I wrote in the [01-tips document](01-tips.md), the `lerna version` command will allow us to bump up versions across the root directory and package directories various `package.json` files.

```
lerna version
```

First I set the version in `lerna.json` and `gs_packages/**/package.json` to `"0.0.0-alpha.1"`, then ran `lerna version` and chose `prelease` (I think). Since it was the first time I ever had run it, the new version number was `"0.0.1-alpha.0"` and it was **pushed** with **tags** to the origin! I don't need to run `lerna publish` because this will register the package to the npm registry, and we're not doing that at all at this point.

So...it seems to work!

## Mar 26.1 - Scaffolding Material UI and Best Practices

Now that the scaffold is officially pushed, it's time to work on the web page scaffolds. Currently we have a number of servers active:

* app_srv - the skeleton URSYS project, with minimal elements ported
* admin_src - a NextJS project with no pages
* gem_srv - a NextJS project with no pages

It is admin and gem that we want to work on to create **wireframes** for how the system works. Ben and others can work in these projects and everything will be great. 

Now that I'm fairly comfortable with Javascript systems development, I can return to making user interfaces for the first time in this series. There are a lot of things to implement to make our UI development more robust and easier to maintain. We're going to use Material UI because Ben sunk a lot of energy into it in the prior project; we will define some best practices.

>  *See [Using Material UI](05-using-material-ui.md) notes*

## Mar 26.2 - Building a Server Home Page

Let's look at the MEME Admin Interface. 
http://localhost:3000/#/admin takes you to the admin
http://localhost:3000/ takes you to the MEME app

We have src/app-web/views/ViewAdmin and ViewMain components

SystemRoutes imports these and exports an object mapping path to component

* SystemInit: used to check current route against component so URSYS doesn't execute that code
* SystemInit: wraps <SystemShell> in <HashRouter>
  * SystemShell: creates <Switch><Route> structures for React Router

Let's now look at <ViewAdmin>, loaded into <SystemShell>. The `render()` function does the following:

* checks UR to see if admin is logged in and renders admin panel warning.
* otherwise renders the admin grid

```
div className = classes.root
	Grid container spacing={2}
		Grid items
```

Now let's look at <ViewMain>, also loaded into <SystemShell>. The `render()` function does the following:

* extract various data and display flags from `this.state`
  * data access keys: modelId, studentId
  * user data: modelAuthorGroupName, ,title, studentName, studentGroup
  * user privs: isModelAuthor
  * UI state: resourceLibraryIsOpen, addPropOpen, addEdgeOpen, componentIsSelected, mechIsSelected, suppressSelection
* calculate derived state this values extracted from `this.state`
  * data access keys: classroomId
  * data: model, resources
  * user privs: isViewOnly
* renders the UI

```
<div className = classes.root>
	<CssBaseline/>
	<Login/>
	<ModelSelect/>
	<AppBar position="fixed" className={classes.appBar} color={isModelAuthor?'primary':'default'>
		<Toolbar>
			<InputBase> for title
		 	<div "right app bar" controls> 
		</Toolbar>
	</AppBar>
	<ToolsPanel>
	<main>
		<div toolbar>
		<div interactive view area>
			<ZoomInMapIcon>
			<ZoomOutMapIcon>
		</div>
		<StickyNoteCollection/>
		<RatingsDialog/>
		<MechDialog/>
		<DescriptionView/>
		<ScreenshotView/>
	</main>
	<Drawer resource library>
	<ResourceView/>
	<HelpView/>
	<PropDialog/>
	<div mech dialog>
</div>
```

To actually make this work I need to add Material UI now. Added [tips for MUI](01-tips-mui.md) document. Also looking at [MUI NextJS example](https://github.com/mui-org/material-ui/tree/master/examples/nextjs).

```
# create custom _document.jsx to insert font and meta manually
# create custom _app.jsx with notes how this can store persistant stuff
lerna add @material-ui/core --scope=@gemstep/gem_srv

# DONE!!!
```

## Mar 27.1 - Review with Ben

I showed Ben the current repo strategy, and here's some thing to do:

TODO: move this to some kind of dev conventions document, figure out where that lives (a doc overview)

* documents - through Sri, post issues in repo for changes, suggestions, additions. Goal is to make it fast to find out how to do things, and also how things work

* wiki - "official user-facing instructions" 

* docs folder - "internal development details"

* version management - lerna (confirm it works from everywhere, maybe sunset root-level package scripts)

* version prerelease packaging only happens from `master` branch

* `dev` branch is main dev integration branch

* suggested branch naming: `[feature-|fix-|patch]/name` for in-progress work instead of dev-ds/patch (find a reference) (e.g. `feature/banana-ricer`)

* Ben is the executive editor of all `README.md` files in the repo!

  

right now I'm dealing with two issues:

* making sure prettier works consistently 

  * in gsgo root
    * in javascript and jsx files 
  * in subprojects
    * in javascript and jsx files 

  

* had to add this to `.vscode/settings.json` to force Prettier to work in jsx files, as it wasn't being set as the default formatter. 

  ```  "[javascriptreact]": {
      "[javascriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      },
  ```

The test goes like insert a bunch of blank lines then save it. if AutoFormat on Save is enabled, you'll see those lines removed. Also, test js, jsx, ts, and tsx files in the same way.

If you right click and select Format Document As... and the default formatter is not prettier, then consider adding additional entries tt.

**WHEN I WAKE UP** I need to do tests for prettier in gsgo and subprojects

Test: (1) Prettier remove extra lines, (2) eslint flags warnings, (3) arrow functions single parameter is stripped (4) module paths resolve (5) default formatter is set correctly

```
// test snippet
// (1) prettier: extra lines to be removed, double quotes, missing semicolons, weird indents
// (2) eslint: warnings in extra lines, trailing spaces
// (3) prettier: arrow function single parameter wrapped with paren
// (4) eslint/tslint: module path resolution
// manual check
// (5) check default formatter (right-click 'format document with...' should be Prettier)
// (6) check that module tsconfig.paths are linted, by inducing error in path
// (7) in .ts and .tsx files, type warnings should appear for 'str' and imported modules

/* 8< cut here */
import Moo from "config/app.settings"
		import GEM_CONFIG from "@gemstep/globals"



const foo = (a) => {
    const { PROJECT_NAME } = Moo;
return `${PROJECT_NAME} ${GEM_CONFIG.NAME} ${a}`
} 
      console.log(foo);

```



GSGO/APPSRV WORKSPACE / PROJECT CHECK

* `.jsx` file in app_srv... pass
* `.js` file in app_srv... 
* `.ts` file in app_srv... 
* `.tsx` file in app_srv... pass with CHANGES BELOW

For the 4th test, needed to add this to `tsconfig.json`  compilerOptions

```
    "jsx": "preserve",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
```

GSGO/GEMSRV WORKSPACE / PROJECT CHECK

* `.jsx` file in gem_srv... pass
* `.js` file in gem_srv... pass
* `.ts` file in gem_srv... pass
* `.tsx` file in gem_srv... pass

GEMSRV WORKSPACE / PROJECT CHECK

If opening the project from its own workspace, does it still work? It's dependent on having the prettierPath and configPath set in the workspace.

* .jsx` file in gem_srv... pass
* `.js` file in gem_srv... pass
* `.ts` file in gem_srv... pass
* `.tsx` file in gem_srv... pass



To summarize how this works:

* eslint extension reads its config file by walking up the tree, the root `.estlintrc.js`
* ts (through `@typescript-eslint/parser`) reads its `tsconfig.json` file from `.eslintrc.js`'s `parserOptions.tsconfigRootDir` that is set to `__dirname`.
* `.eslintrc` implements the order of rules for typescript, airbnb, and eslint recommended. It also should disable any whitespace formatting elements so only Prettier handles that. ESLint is only used to flag errors.
* prettier is invoked by extension, which looks for a `.prettierrc.js` file in the project root normally. However, we apply settings overrides in `.vscode/settings.json` to set `prettier.prettierPath` to `"./node_modules/prettier"` for the root project. 
* for prettier subproject workspaces, we require a VSCode `.code-workspace` to exist with the `prettier.prettierPath` to point to the root `"../../node_modules/prettier"`  _AND_ also add `prettier.configPath: "../../prettierrc.js` so it finds the root version rather than require a duplication.
* for tsconfiguration, the `tsconfig.json` lives at multiple levels because it's required to set different module paths in `compilerOptions.paths`, and include different subdirectories to parse in `include`. Otherwise eslint will fail to parse module paths, and typescript files will not be parsed at all.

  

DID RUNNING lerna bootstrap screw up my modules?

``` module "/Users/sri/Library/Caches/typescript/3.8/node_modules/@types/react/index"
import React from 'react'

module "/Users/sri/Library/Caches/typescript/3.8/node_modules/@types/react/index"
Unable to resolve path to module 
```

This might have been a combination of a corrupted visual studio cache AND a failed `npm run bootstrap`. I might have run `npm ci` and then everything broke until I ran `npm run bootstrap` again.



# 3. Wireframing

what are the key material elements to use?

```
Box - a generic box, can accept fixed width minWidth stuff.
Container - a box with width and horizontal centered content
Grid - a CSS FlexBox implementation
```

I think that I could make UI that uses a CSS Grid, with Material-UI stuff inside of it adapting to changes.

The goals of the wireframe though are to show elements, so maybe not worrying about layout at this moment is the wise thing to do. Let's just make a wireframe that lists everything using existing components, but not worry about making it work yet. We'll have to see what everything looks like before we start working on screen technology. **capture first**

## Mar 30.1 - Big Blue Boxes

I'm working out the theming right now. I think the idea behind using MUI's styles is that you can do fancy stuff within the components themselves, which is nice. For global styles, though, we will use the theme.

Ok, some realizations about themes:

1. `<ThemeProvider>` and `createMuiTheme()` work by passing the theme object down. It's accessed either by `useTheme()` hook or `props.theme` when the component is wrapped with `withStyles()`. 

2. While you can add your own elements to the theme, this is *not* the same as using `classes.root` and `className` with the style interface. Styles are independent of the theme, but can be passed the theme to use its constants.

3. To see how to combine theme and style, see https://material-ui.com/styles/basics/#stress-test

4. I'm still not sure if there's a way to create a shared stylesheet. The important object is probably to export `classes` somehow. Should console-log this to see what is really in there. 

5. Apparently JSS is deterministic so classnames can be shared. But HOW? https://github.com/mui-org/material-ui/issues/8912 and https://material-ui.com/styles/advanced/#global-css

6. `makeStyles`can receive a function that will receive the theme object. 

   ```js
   const useStyles = makeStyles(theme => ({
     root: props => ({
       backgroundColor: props.backgroundColor,
       color: theme.color,
     }),
   }));
   
   const Component = props => {
      const classes = useStyles(props);
      ...
   ```
   How does this work? Recall `useStyles` is returned as a function from makeStyles. useStyles can receive a parameter, here called props, when it's invoked at render time.

## Mar 30.2 - The Ultimate ThemeStyle

Themes are defined in `_app.js` by reading from `theme.js`. End users never touch this. You can augment this with theme-related globals defined in `theme-extra.js` which can be used to calculated *derived* metrics. But these are read-only. 

## Mar 31.1 - Blue Boxes

Today's morning goal is to make a blue styled box appear in the grid. After yesterday's work, I should have a workable theme structure.

## Apr 02.1 - Blue Boxes Continued

Monday's work got the style working along with a theme. Now let's try to lay something out. This iwll happen in `index.js`. we have a ExLoginBar, a ExAppBar, and a ExBoxLayout. We are making a new layout called **ExTabbedLayout**. This requires making a tab of some kind. Let's copy it from the material-ui examples...

I've updated the way styles are imported. Now there is a base styles/wireframing.js module that exports bluebox styles.

So I want a nice system where I can speciffy the contents of the application simply from index.js. 

* ExTabbedAppBar - has a TabPanel component that renders its children. 

```
<Typography role="tabpanel" hidden={value!==index} id={`simple-tabpanel-${index}`} {...other}>
	{value===index && <Box>{children}</Box>
</Typography>
```

``` jsx
<Tabs
  value={tabIndex}
  onChange={handleChange}
  aria-label="simple tabs example"
  className={classes.tabs}
>
  <Tab label="Item One" {...a11yProps(0)} />
  <Tab label="Item One" {...a11yProps(1)} />
  <Tab label="Item One" {...a11yProps(2)} />
</Tabs>

<TabPanel value={tabIndex} index={0} />
<TabPanel value={tabIndex} index={1} />
<TabPanel value={tabIndex} index={2} />

---
We have:
<GSTabbedView>
  <GSView label="Tab 1" index={0}>
    <View/>
  </GSView>
  <GSView label="Tab 2" index={1}>
    <View/>
  </GSView>
  <GSView label="Tab 3" index={2}>
    <View/>
  </GSView>   
</GSTabbedView>


```

We're going to add **redux** now. 

```
# in the gem_srv folder
npm install --save redux react-redux
# errors will appear about missing peer dependencie
# in lerna root, then 'npm run bootstrap'
# resolve package mismatches as necessary by editing the and npm run bootstrap again

```

Now we want to make a reducer, which takes a state object and an action and returns the modified state.

```
# now make folders
mkdir redux redux/actions redux/reducers
# now make sure files exist and edit them
# https://dev.to/waqasabbasi/server-side-rendered-app-with-next-js-react-and-redux-38gf
touch redux/reducers/counterReducer.js
touch redux/actions/counterActions.js
touch redux/reducers/rootReducer.js
touch redux/store.js
```

At this point, the [tutorial I was following flaked out]() and doesn't actually work with current standards. So, we'll have to synthesize it from scratch. First some initial reading:

**1. The NextJS 9.3 recommendation is to use [`getStaticProps` or `getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching), not `getInitialProps`.** 

The props supplied by `getStaticProps` will be used to build the page. Since this runs on the server you can  actually export stuff.

**2. React Redux 7.1 [supports Hooks](https://thoughtbot.com/blog/using-redux-with-react-hooks)**

`useSelector` is analagous to `connect mapStateToProps`, and is passed a function that takes the Redux store state and returns state for you.
`useDispatch` replaces`connect  mapDispatchToProps`, returning the store's dispatch method.

```jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCount } from "./store/counter/actions";

export const Count = () => {
  const count = useSelector(state => state.counter.count);
  const dispatch = useDispatch();

  return (
    <main>
      <div>Count: {count}</div>
      <button onClick={() => dispatch(addCount())}>Add to count</button>
    </main>
  );
};
```

**3. next-redux-wrapper purportly is a utility to make next and redux work together**.

See [kirill's thing](https://github.com/kirill-konshin/next-redux-wrapper) though it is his example that I wasted time reading before. Someone found it didn't work and [wrote another appoach](https://jibin.tech/nextjs+redux/).

OVERALL THOUGHTS: Since NextJS runs on the server, synchronizing state between the server app and the client app may not make sense. We might have to create our own, less-stupid approach.

**4. There are new [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) Hook available?**
`const [state, dispatch] = useReducer(reducer, initialArg, init)`
The `reducer` function is your state handler that mutates state. With this you don't need redux anymore.
However, this is not global application state.

**5. Screw Redux. Write our own custom app state and persist it with redux ourselves.**
The [custom app](https://nextjs.org/docs/advanced-features/custom-app) feature of Next means there's an App instance that is always loaded. You just need to pass `pageProps` down into it. HOWEVER...
There is a difference between the initial props set in `_app.js` and the *RUNTIME* behavior. Any UI-triggered event is going to be accessing the client-side of things, which will be always set to the initial props that have come-in.

I think to get around this, all ui code and client initialization have to be **explicitly** managed with their own state. That's a bit tricky.

**6. Screw NextJS+MaterialUI. NextJS is not a SPA architecture**

Q. On the other hand, nextJS might be able to access the full node environment? **NOPE**. The webpack bundler isn't setup for it. We still need to make an API server.

RESOLUTIONS:

* Design a SPA support framework that uses NodeJS to serve pages. Some special pages can be essentially just loader boilerplate for our dynamic apps.
* Try using React [Context API](https://reactjs.org/docs/context.html), which seems to allow creating a single context object that can be defined in a js module and imported into any JSX module. NextJS might work with this.
* Look into using Material UI Styling with a straightforward hyperlink navigation structure. It's probably the easiest thing to do now.

## Apr 03.01 - React Redux or Context?

Right now the repo is in a state of having react-redux in it, but I'm not sure it's the solution for me because it involves transmitting the react state from the server to the client. This split between "what is on the server" and "what is on the client" is a bit confusing. 

So...let's see if I can use the Context API to at least handle things like application state, which is running on the server. 

```jsx
const ThemeContext = React.createContext('light') /* CREATE CONTEXT */
class App extends React.Component {
  render() {
    return (
      <ThemeContext.Provider value="dark">        
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}
function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}
class ThemedButton extends React.Component {
  static contextType = ThemeContext;  /* USE CONTEXT */
  render() {
    return <Button theme={this.context} />;
  }
}
...
All you have to do is wrap your components in a Context.Provider and then call useContext(Context) inside that component to access your state and helper functions.
    
```

The Context API kind of bugs me. As does all of react. [People agree](https://leewarrick.com/blog/the-problem-with-context/). 

```jsx
const {useContext, useState, createContext, useMemo} = React
// EXAMPLE
// creating state at a high level and providing it as a context value
// memo-ized version
const AppContext = createContext(); // this is a COMPONENT

function useAppContext() {
  const context = useContext(AppContext)
  if (!context)
    throw new Error('AppContext must be used with AppProvider!')
  return context
}

function AppProvider(props) {
  const [count, setCount] = useState(0)
  const value = useMemo(() => ({ count, setCount }), [count])
  return (
    <AppContext.Provider value={value} {...props} />
  )
};
// Only components that call useContext re-render whenever the context’s state changes.

```

This [Dave Ceddia article on Context versus Redux](https://daveceddia.com/context-api-vs-redux/) is an interesting read.

This article on [authentication in nextjs with react redux](https://kaloraat.com/articles/next-js-react-redux-authentication-tutorial) also seems like it will be useful

## Apr 07.01 - Wireframing Continued

Where I left off was deciding to **not worry about state** and implement the NextJS navigation thing.

```jsx
import Link from 'next/link';
<Link href="/about">
  <a>About Page</a>
</Link>

const { Menu, MenuItem, MuiThemeProvider, getMuiTheme } = MaterialUI;

class Example extends React.Component {
  render() {
    return (
      <Menu className="horiz-menu">
        <MenuItem primaryText="Home"/>
        <MenuItem primaryText="Test Menu 1" />
        <MenuItem primaryText="Test Menu 2" />
        <MenuItem primaryText="About" />
      </Menu>
    );
  }
```

Trying to turn a Menu into a NavMenu is a waste of time. I think the **best practice** is to either follow Material Design (not Material UI) guidelines or roll-your-own components through reading the Material-UI documentation carefully.

* **Question:** what is the activeClass

* **Question**: where is there a great example of a nextjs app?

* **Question**: should I just read the nextjs docs and outline them?

## Apr 09.01 - Fixing Subtab Navigation

I finally figured out a NextJS server-client split with working main tabs. However, the subtabs also need their own navigation. How do the main tabs work in `<SiteNavigation>`?

In `<SiteNavigation>`, the Tabs component is just a bar of Tab elements that know how to highlight. 

```
## SiteNavigation uses <Tabs><Tab> just for displaying the current page
<Tabs value onChange={handleChange}>
	<Tab label key component>
</Tabs>

## Navigation is handled through programmatic use of next/router
const handleChange = (event, newIndex) => {
	... look up route from ROUTES object by index
	router.replace(route.href)
	... store current tab
}

```

For subtabs, we use `<ExTabbedView>`

```
<Tabs value onChange={handleChange}>
	{generated children wrapped in <Tab key label id 'aria-controls'>}
	id = `gem-tab-${index}`

The children of <ExTabbedView> are responsible for implementing logic for being hidden or not. These are currently <ExView>
<ExView role="tabpanel" hidden={currentTab!==index} id={`gem-tabpanel-${index}`}
```

