# Setting up Visual Studio Code for GEMSTEP

There are two separate development toolchains. One is for  **Live Linting** in Visual Studio Code, and the other is for building the webpack bundle for running in the server. 

When you clone the project, you automatically get several configuration files that will be used by the following VSCode extensions:

* `.nvmrc` - specific the version of node as managed by **Node Version Manager**. We are building on Node v12.19.0.
* `.editorconfig` - Specify default tab and spacing rules through **EditorConfig** (ext `editorconfig.editorconfig`)
* `.eslintrc.js` - Specify linting toolchain through **TypeScript** parser and expected plugins. This config is used by the **ESLint** extension (ext `dbaeumer.vscode-eslint`).
* `prettierrc.js` - Specifiy automatic code formatting through the **Prettier** extension (ext `esbenp.prettier-vscode`)
* `tsconfig.json` - Specify critical **Typescript configuration** for making the tricky Typescript linting work with the ESLint extension. It 
* `.vscode/settings.json` - Specify editor defaults not handled by `.editorconfig`, *AND* critical **ESLint extension settings** to make it work with the editor: `eslint.validate` and `eslint.workingDirectories`.

The listed extensions rely on the following packages. You shouldn't have to reinstall these yourself as they are part of the root directory's `package.json` already, but if you are building your own project from scratch it's good to know: 
```
npm i -D  eslint@^6.8.0" \
          typescript@^3.8.3 \
          prettier@^1.19.1 \
          @typescript-eslint/eslint-plugin@^2.24.0 \
          @typescript-eslint/parser@^2.24.0 \
          eslint-config-airbnb-typescript@^7.2.0 \
          eslint-config-prettier@^6.10.0 \
          eslint-import-resolver-typescript@^2.0.0
          eslint-plugin-import@^2.20.1 \
          eslint-plugin-jsx-a11y@^6.2.3 \
          eslint-plugin-prettier@^3.1.2 \
          eslint-plugin-react@^7.19.0 \
          eslint-plugin-react-hooks@^2.5.1 \
```
Be aware that the interaction between these various packages can be *quite delicate*, so be careful about updating them. In particular, ESLint and Typescript seem to introduce breaking changes with configuration. Also, the interaction between the various ESLint plugins and configurations, as well as the order of application, will result in linting conflicts if you are not careful!!! When this happens, the LiveLinting will fail to work.

Note: Even if the Live Linting fails, the project will still probably build. That's because compiling/building/packaging is handled by a completely different toolchain through **Webpack**. Typescript is shared between both toolchains, but the way it is invoked is different.

## Monorepo Complications

Because this project is currently a **Lerna-managed monorepo**, we have several project directories contained in a single Git repository. Each project directory is independently packaged, but can be managed from the route through the `lerna` CLI utilities. 

To make Live Linting work, ESLint has to be configured to use a special package called `@typescript-eslint/parser`. This parser is used to handle not only Typescript files, but also Javascript files. Additionally, it also has to be able to handle **JSX** for React compatibility. This is rather messy. Finally, for the **Prettier** extension to work, all the formatting-related rules for ESLint have to be REMOVED; this is handled by the ruleset `eslint-config-prettier` applied at the very end of the chain. 

A more robust way to do this would probably be to create the ruleset manually rather than rely on these configurations applied in the right order. 

Another complicating factor is that if you have a single VSCode workspace, the extensions look only in the **root level** of the monorepo for its configuration. This is problematic for Typescript, which expects to find a `tsconfig.json` that tells it which files to include. The `eslint.workingDirectories` entry in `.vscode/settings.json` tells the ESLint extension to automatically switch which directory to look into. There is an additional setting in the `parserOptions` of our root `.eslintrc.js` file to tell Typescript where the configuration root is. 

(it might be possible to just update the includes in the root `tsconfig.json` file, but that would make the individual packages less independent)

ANYWAY...the VSCode ESLint extension works by taking the open file and executing the installed `eslint` binary (our local install) according to the settings in `.eslintrc.js`. This defines a chain of transformations, starting with using the Typescript-ESLint parser to transform typescript into something ESLint understands. Then, it executes all the configuration defined in the `extends` field.

And thus...hopefully it all works!

##  Addendum: Prettier VSCode Extension in Monorepos

The Prettier extension is coded to look for the nearest `package.json` to determine the location of the Prettier binary. In a monorepo though with hoisted packages, prettier is located in the root, not the packages level. 

Our packages are now called `gs_packages`, so the workaround is either to install prettier globally (ugh) or modify the VSCode extension itself with the **Prettier Path**. I've added the following to the `.vscode/settings.json`:
```
  "prettier.prettierPath": "./node_modules/prettier",
  "prettier.configPath": "./"
```

