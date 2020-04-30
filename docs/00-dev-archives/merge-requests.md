# 03/24: Visual Studio Quality of Life

One of our dev goals is to have the same IDE configuration in Visual Studio Code that enforce code style and code quality. 

* **Live Javascript Linting** - Provided through the **ESLint** extension
* **Extended Linting Rules** - Typescript, React, and AirBnb
* **Automatic Formatting on Save** - Provided through the **Prettier** extension

This is a surprisingly difficult thing to set up, because the extensions interact with installed binaries loaded as npm module, and there is conflict between all the rules if they are not set up correctly. Compounding this problem is the use of a monorepo structure, which requires **tricky setup** with the ESLint extension, the `.vscode` workspace settings, and `.eslintrc.js`. It's kind of a mess. 

This pull request implements a working version of it (at least, it seems to work). The details regarding how it works are noted in the file `docs/02-vscode-qol.md`.

# 03/25: Initial System Skeleton

The monorepo is configured with several projects to test the following features:

* monorepo package management
* maintaining multiple build systems
* multi-server management
* shared libraries
* documentation practices

It doesn't do much yet, but here are some testing instructions:

1. DOWNLOAD AND TEST
```
git clone https://gitlab.com/stepsys/gem-step/gsgo
cd gsgo
nvm use
which lerna # if lerna isn't installed globally, npm i -g lerna
npm ci
npm run bootstrap
npm run dev
```
This will launch three different webserver in a terminal window. CTRL-C to quit.

2. TEST EXTENSIONS IN VISUAL STUDIO CODE

There are three recommended extensions that this project uses:

* ESLint - dbaeumer.vscode-eslint
* Prettier - esbenp.prettier-vscode
* Editor Config - editorconfig.editorconfig

Once you install them and reload Visual Studio Code, you should have:
* Live Linting Highlighting for Typescript as well as Javascript
* Reformat on Save using AirBnb rules 

If there are any errors, let me know!

# 03/29: IDE: Auto-formatting Setup Best Practices in VSCode

This is the latest best practices for auto-formatting our code through Prettier.

## BACKGROUND

We use Visual Studio Code for our development, and use the following tools to ensure code consistency in the editor:

* The ESLint extension - extended with React, Typescript, and AirBNB rules
* The Prettier extension

The online for making this all work together is difficult to apply because of the way Visual Studio uses ESLint and Prettier through its extension system. Furthermore, ESLint has to be configured to use the Typescript parser, which adds another configuration file to the mix. 

Further complicating our configuration is the switch to a **monorepo** structure, which means our configuration files have to work with multiple subprojects at both the repo root level and individual subproject level. 

This commit brings our setup up-to-date, working across all javascript/jsx/typescript/tsx types in both root-level and subproject-level VSCode workspaces. Most configuration guides are written without Visual Studio Code in mind, so this merge request attempts to find the minimum clean setup for our future projects. 

## OVERVIEW

The VSCode editor performs **on-the-fly linting** through the ESLint extension. This extension calls the installed `eslint` binary, which loads the first `.eslintrc` config file it can find. The binary receives the contents of the current editor window, runs its linting operation, and then feeds the results back through the extension, which then can highlight errors on the screen.

0. The ESLint Extension sends the contents of an editor window to the `eslint` binary.
1. The `eslint` binary looks for an `.eslintrc` config file, starting from the root of the VSCode project and looking up. Ours is located in the root level.
2. The `.eslintrc.js` config specifies what configurations (rule sets) and plugins to load.
3. The `.eslintrc.js` config specifies the Typescript parser, which invokes the `typescript` binary.
4. The `tsconfig.json` file is loaded by the `typescript` binary, specifying compiler parameters so it can find various source files. These configs are specific to each subproject, as they have different paths depending on their source organization.
5. The configured `typescript` binary reads the input and creates an ESLint-compatible AST. 
6. The `eslint` binary processes the AST through the rules specified in `.eslintrc.js`. 
7. The ESLint Extension receives the results of the linting, and renders any problem in the editor.

By comparison, the Prettier Extension applies its opinionated formatting on save. It doesn't care at all about linting; it's just interested in arranging whitespace and enforcing a few character standards related to quotes. This is what happens:

0. The Prettier Extension is triggered when it is set as VSCode's default formatter for the file type.
1. The `prettier` binary is invoked by the extension before saving the file. It's invoked from the root of the current workspace, and looks for a `.prettierrc.js` config file. It searches up the paths until it finds one.
2. The `.prettierrc.js` config is pretty minimal, and does not duplicate settings that are read from the `.editorconfigrc.js` file. 
3. The `eslintrc.js` rules have the `eslint-config-prettier` disabling rules in place. This is to avoid conflicts between ESLint and Prettier's opinions about certain things, which would cause a "ping pong" between ESLint flagging whitespace-related rules that Prettier disagrees with.

### Special Hacks

Because the `eslint` and `prettier` binaries are installed only at the `gsgo` root level in our monorepo, we have had to make these hacks (though now I am not sure if they are necessary now).

* When using a subproject workspace (an VSCode "opened workspace" from `gs_packages`, as opposed to the root-level workspace `gsgo.code-workspace`), we sometimes had to add the key `prettier.prettierPath: '../../node_modules/prettier'` so it can find the binary. This is necessary because I don't think the extension will look past the root folder of the current workspace.
* We use a special `.editorconfigrc.js` setting `parserOptions.project:'./tsconfig.json'` and `parserOptions.tsconfigRootDir: __dirname` so the typescript can find it.
* There is a problem with VSCode not remembering that Prettier is the default formatter for `jsx` files. This requires an override in `.vscode/setting.json` and any subproject workspace file: `[javascriptreact]:{"editor.defaultFormatter": "esbenp.prettier-vscode"}`. 
* To make Prettier work in VSCode, you also need to set `"editor.formatOnSave": true`.

# 04/15: GEMSRV Web Server Foundation

## BACKGROUND 

We would like to prototype the GEM-STEP student UI within a working web application framework so the team can envision the classroom workflow with actual hardware servers, laptops, and mobile devices. Also, we would like to store implementation questions and decisions within the framework itself. 

Rather than hack HTML wireframes together, we have created templates based on NextJS and MaterialUI that should be useful not only for prototyping, but for also building some of our browser-based applications. 

The package in this release is `gem_srv`, which is the prototype for the new NextJS/React/MaterialUI webserver. This server doesn't currently implement URSYS networking (this is in the `app_srv`). 

## NEW DEVELOPER FEATURES

* The lerna build configuration has been tweaked to (1) to allow server-side debugging within Visual Studio Code and (2) running individual servers within its own Visual Studio Code workspace root in `gs_packages`. 
* New VSCode workspace in `gs_packages/gem_srv/sem_srv.code-workspace`. If you open this workspace in VSCode, you can use its **run/debug** feature to launch and test the server with server-side debugging. 
* The typescript+eslint+prettier configuration has been tweaked to work both in subproject workspaces and the root `gsgo` workspace. If you have any problems with linting try using the `Reload` extension to freshen the eslint cache, or quit/restart VSCode. Note that you should not have any of these tools installed globally.
* Workspace settings to enforce Prettier formatting are enabled through forced **format on save**. 

## FRAMEWORK FEATURES

* To add a new route, just duplicate one of the existing pages in the `src/pages` directory. NextJS automatically routes it. There are also instructions in `gem_srv/docs_gem_srv/add_pages.md`
* New UR site and page navigation elements are available in the `src/blocks` directory. This directory is intended to contain "block level" page elements that can be easily stacked on top of each other to create a **full-screen app**. The existing pages show examples of this.
* Example components in `gem_srv/src/components/examples`. Currently there is a FlexBox full-screen app element that is used in the page demos.
* Modifying the Site Navigation menu is done through a new `site-config.js` file that exports a NAVMENU object. 
* A logical not-insane setup of MaterialUI themes and styles, provided automatically and accessible through React hooks. The `gem_srv/src/modules/styles/theme.js` and `theme-derived.js` files are documented to show you how to use the setup.
* A placeholder application state module in `gem_srv/src/modules/appstate.js`, which implements a rudimentary way to maintain application state between page loads with the NextJS server-side rendered application while retaining static optimization for better client performance.
* The `gem_srv/docs_gem_srv` directory will contain how-to guides for using the system

### TESTING PART 1: INSTALLATION

* Using VSCode, open the `gsgo.code-workspace` and open the terminal by typing `CTRL-TILDE`
* Fetch and checkout branch `gem-wireframe` into a **NEW** directory
* In terminal from the root level of the repo enter: `./scripts/install-helper.sh` and follow the instructions.
* NOTE: The gist of the instructions is to successfully run `npm ci` followed by `npm run bootstrap`

### TESTING PART 2: BUILDING 

* In the terminal, type `npm start`
* In Chrome, browse to `localhost:3000` and click around.
* Open the Chrome javascript console and observe console output
* Note the server-rendered icon in the bottom right.
* Try resizing the browser window and ensure there are no scrollbars appearing
* `CTRL-C` to stop the server

### TESTING PART 3: SUBPROJECT

* Use Visual Studio Code to open the `gem_srv.code-workspace` project
* Open the VSC Terminal (ctrl-tilde) and try `npm run local` to run from the current workspace.
* CTRL-C to stop the server. 
* Now try using the **VSCode run debug menu** to run the NextJS server and browse to `localhost:3000` again
* Look through `src/pages` and see if those files make sense, try modifying them.
* Look at the debug output in the VSCode terminal window to see server-side console error messages. You can set breakpoints in the server code!

### TESTING PART 4: DOCUMENTATION

* Note that there are now extensive DOCUMENTATION placeholders in the `gsgo/docs` folder. This collection is a work in progress currently under Sri's editorship.

If everything looks ok, then hooray! Can move on to actual wireframing and adding meatier technical bits to the GEM-STEP system framework.

# 04/29: Wireframe + Live Documentation + Prototype Shell

This release achieves several goals related to prototyping the GEMSTEP MODELER.

* A solid foundation for a NextJS-based web client that talks to a server
* A set of React components that implement a full-screen gridded user interface.
* A easy-to-use wireframing system for determining what functions and objects need to exist across a set of pages.
* A set of pages, page blocks, and page view that implement our current intepretation of the IU Function Requirements and Specifications.
* A set of documents covering the technical evolution of the project.

## TESTING

* pull the merge request and change to its branch
* `npm run bootstrap`
* `npm run gem`

## FILE ORGANIZATION

These changes are in `gs_package/gem_srv` folder.
* The `pages/` folder contain the top-level routes. The navigation bar is drawn on each page by including the `<URSiteNav>` component, and uses the `_navmenu.json` file to determine what to show on the menu.
* `page-blocks/` contains structural blocks used to build route pages. This include navigation (e.g. URSiteNav, URTabbedView, etc), screen layout (URLayout), and wireframe utilities (e.g. URWireframe).
* `page-tabs/` contains "tabbed views" that are managed by `<URTabbedView>`. They use the URLayout conventions (see NEW COMPONENTS below)

## NEW COMPONENTS

### Page Block: `URLayout`

The `URLayout` library exports a set of "stacked grid" components:
* `<URView>` is the root view of a page. It defaults to full-screen view with no overflow, but if you want the page to scroll use `<URView scrollable>`. It stacks elements vertically.
* `<View>` is a 100% width box that can contain child elements. They will be constrained to the View. 
* `<TextView>` is similar to View except it can only have text children
* `<Row>` is used to stack element horizontally. It can contain `<Cell>` element, which themselves can contain children. Use `<RowFixed height={100}>` and `<CellFixed width={100}>` if you don't want the cell to grow. 
* `<MD>` is a component that can parse Markdown passed to it. Use either the `input` property or include the Markdown source as children. It's convenient to define the text at the top of the component file as a constant and then refer to it like `<MD>{MYTEXT}</MD>`

### Page Block: `URWireframe`

The `URWireframe` library exports:
* `<WF name summary expanded>{optional children}</WF>` will render a box that has a large Title, an optional summary, and an optional expandable text area. By default this area is not expanded on startup, but you can force it by specifying the `expanded` flag. 
* `<MD>` is the same Markdown wrapper component as exported by `URLayout`

### Example
```jsx
// DRAWS THREE COMPONENTS STACKED ON TOP OF EACH OTHER

import { View, Row, Cell, CellFixed } from '../page-blocks/URLayout';
import { WF, MD } from '../page-blocks/URWireframe';

const ELEMENTS=`## PAGE TITLE`;
const NOTES=`
## Markdown Text

This is Markdown!
* bullet 1
* bullet 2
`;
function PageView() {
  return (
    <View>
      <Row>
        <CellFixed minWidth={160}>
          <MD>{ELEMENTS}</MD>
        </CellFixed>
        <Cell>
          <WF name="LoginStatus"/>
          <WF name="Login" summary="textfield for logging in by student"/>
          <WF name="ClassroomInfo" expanded>
             additional notes, default expanded.
             use the MD component to insert markdown
          </WF>
          <MD>{NOTES}</MD>
        </Cell>
      </Row>
    </View>
  );
}
```