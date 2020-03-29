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
          eslint-plugin-react@^7.19.0 \
          eslint-plugin-react-hooks@^2.5.1 \
```
Note 1: the ESLint, Typescript, Prettier, and AirBnb linting rules+plugins are all updated by different groups. The package versions thus should be considered as a set. If you change them, new conflicts in the rules may arise. I would not use a `npm i -D` without specifying the exact versions that you know work.

Note 2: the **order of application of rules** in the `plugins` and `extends` fields in `.eslintrc.js` is critically important. In general, the `prettier`-related plugins/rules always come last and `typescript`-related plugins/rules come first. In the very last `rules` section, this is where we (1) add our own overrides and (2) remove any whitespace formatting-related rules and uncaught rule conflicts. For example, when you see TWO versions of `no-undeclared-vars` errors, I just remove the `eslint`  one.

Note 3: For ESLint and Prettier to work, you have to be sure that they are finding their configuration files. Otherwise, you may find that Live Linting doesn't work, or Prettier doesn't autoformat on save. There are multiple settings for Visual Studio Code, Typescript, the Prettier Extension, the ESLint Extension, and Workspace settings that all must be correct for Live Linting to work. 

Note 4: Even if the Live Linting fails, the project will still probably build. That's because compiling/building/packaging is handled by a completely different toolchain through **Webpack**. Typescript is shared between both toolchains, but the way it is invoked is different.

## High Level Configuration

To summarize how this works in our lerna monorepo with multiple `.code-workspace` options:

* ESLint extension reads its config file by walking up the tree, the root `.estlintrc.js`
* Typescript (through `@typescript-eslint/parser`) reads its `tsconfig.json` file from `.eslintrc.js`'s `parserOptions.tsconfigRootDir` that is set to `__dirname`.
* `.eslintrc` implements the order of rules for typescript, airbnb, and eslint recommended. It also should disable any whitespace formatting elements so only Prettier handles that. ESLint is only used to flag errors.
* prettier is invoked by extension, which looks for a `.prettierrc.js` file in the project root. To be sure it's using that prettier install, we set `.vscode/settings.json` to set `prettier.prettierPath` to `"./node_modules/prettier"` in the root project. 
* for Prettier subproject workspaces, we require a VSCode `.code-workspace` to exist with the `prettier.prettierPath` to point to the root `"../../node_modules/prettier"` . That's because prettier is only installed at the root level (it might not be necessary if it's globally installed through `lerna add`...will have to test that).
* for Typescript, the `tsconfig.json` lives at multiple levels because it's required to set different module paths in `compilerOptions.paths`, and include different subdirectories to parse in `include`. Otherwise eslint will fail to parse module paths, and typescript files will not be parsed at all. 
* Module resolution for Live Linting is also handled through the `@typescript-eslint/parser` and it will not work unless `.eslintrc.js` uses the `import` plugin.

## Example Configurations

**`.eslintrc.js`** in root directory (critical rules only)

  ```
module.exports = {
	...
	// note that we're not loading the prettier config or plugin because
	// in visual studio code, we're relying on the extension to do it on save
	// via a different mechanism
  plugins: ['@typescript-eslint', 'react', 'import'],
  settings: {
    'import/resolver': {
      // This makes module resolution in VSCode work. Otherwise, it will flag
      // modules as undeclared because it can't find them. The import plugin
      // will read the tsconfig.json file to parse each file.
      // This also requires a .vscode/settings.json tweak:
      //   eslint.workingDirectories:[{mode:'auto'}]
      // See https://github.com/microsoft/vscode-eslint/issues/696 for hints
      // regarding relative directories, monorepos, and eslint 6 changes
      typescript: {
        directory: './tsconfig.json'
      }
    }
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/eslint-recommended', // transform typescript rules
    'plugin:react/recommended', // handle jsx syntax
    'airbnb-typescript' // add airbnb typescript rules
  ],
  parserOptions: {
  	...
    project: './tsconfig.json', // where to look for root ts config
    tsconfigRootDir: __dirname //  monorepo hack
  },
  rules: {
  	...
	}
};

  ```



### .eslintrc magic naming bullshit

There are various shortcut rules that make figuring out your ESLint configuration needlessly opaque. ESLint supports external modules with sets of rules that can be loaded as npm modules. They can be packages of rules, configurations (sets of rules), or plugins. 

A plugin is an npm package that exports rules and configurations. The syntax for an entry in `extends` is:

>  ` [plugin:[eslint-plugin-]package_name/configuration_name`

The internal eslint rules provide configurations that use `:configuration_name` instead of `/` characters. For example:

> `eslint:recommended`

The equivalent rule for a plugin like `@typescript/

* `plugin` packages have prefix  `eslint-plugin-`; when specifying them in the `plugins` field you can drop the prefix. Scoped plugins follow the same convention e.g.` @typescript-eslint/eslint-plugin` is referred to as `@typescript-eslint` (it's dumb). You can also prefix with `plugin:` to make things clear, I guess
* `rules` that are defined in a plugin need the prefix `pluginname/`. This is associated with the plugin package that has `eslint-plugin-` prefix. 

* `extends` can accept either plugin configuration (preceded with `plugin:name/config` or an `eslint-config-name` config

ESLint **environments** are preset of global values, so ESLint doesn't flag things like `window` or `fs`.  Set these in the `env` property.

### prettier eslint magic naming bullshit

The  `eslint-plugin-prettier` package does something dumb by providing `extends: ["plugin:prettier/recommended"]` which magically also includes `eslint-config-prettier` rules if you've installed them as well. 

What's the difference?

* `eslint-config-prettier` will REMOVE [conflicting rules](https://github.com/prettier/eslint-config-prettier) that interfere with Prettier. It includes several 
* `eslint-plugin-prettier` will ADD a rule that formats content using Prettier. Since we are NOT using ESLint to format our code, we SHOULD NOT use this with Visual Studio Code and the Prettier extension.

Though if we are not using ESLint to format code in Visual Studio, then maybe we don't even need to add these rules. Prettier extension will just use its `.prettierrc.js` file anyway.

# Troubleshooting

## Can't Resolve Module Path in Live Linting, but it Still Compiles and Runs

Make sure the closest `tsconfig.json` file includes the source you're trying to import. ESLint is using that configuration file via the typescript parser option we've specified. If there isn't a `tsconfig.json` at the package directory level, then you must add one. Here's the one for `gs_packages/app_srv`

```
{
  "extends": "../../tsconfig.build.json",
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "ursys/*": ["ursys/*"],
      "app/modules/*": ["src/app/modules/*"],
      "app/*": ["src/app/*"],
      "util/*": ["src/app/util/*"],
      "step/*": ["src/step/*"],
      "config/*": ["config/*"]
    }
  },
  "include": ["src/**/*", "ursys/**/*", "config/*"],
  "exclude": ["node_modules"]
}
```

The directory structure looks like this:

```
app_srv/
    config/
    src/
        app/
            boot/
            static/
            modules/
            views/
                ViewMain/
        util/
        step/
        assets/
    ursys/
        common/
        chrome/
        node/
    .babelrc
    package.json
    package-lock.json
    tsconfig.json
```

You can see that the `tsconfig.json` files is defining both `compilerOptions` for path aliases (the `path` property) and `include` for which files that will be processed by Typescript. It is this latter setting that matters for ESLint. The `compilerOptions` one is used by webpack when it invokes its typescript loader (maybe...I haven't confirmed this). 