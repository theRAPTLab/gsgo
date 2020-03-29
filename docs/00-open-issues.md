## Should we drop Prettier?

I am continuing to have problems with Prettier integration with Visual Studio Code, as it tends to conflict with ESLint. Here's a [recent issue](https://github.com/microsoft/vscode/issues/87096) that touches on the complication.

ESLint is capable of enforcing rules in Javascript as well as formatting them. It's quite extensive. However, Prettier handles more than just Javascript, so it might be useful to keep around

I did some surgery on the Prettier install.

#### 1. Move Critical Settings

I had these settings in the root level of gsgo:

```
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "prettier.prettierPath": "./node_modules/prettier",
  "prettier.configPath": "./.prettierrc.js",
  "editor.renderWhitespace": "all",
  "editor.wordWrap": "off",
  "[markdown]": {
    "editor.formatOnSave": false,
    "editor.wordWrap": "on"
  },
  "typescript.suggest.completeJSDocs": false,
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "eslint.workingDirectories": [
    {
      "mode": "auto"
    }
  ]
```

The crittical ones for Prettier are the first four. Since the .vscode directory isn't used when opening subworkspaces, I copied them to the workspace file themselves, and edited the prettier.* pathnames accordingly. 

#### 2. Remove ESLint-related Format Settings

As mentioned in this issue, there is a conflict between code actions and format actions. ESLint will autoformat using a code action. Prettier will autoformat using a format action. You can only have one active! I had both active, so I removed ESLint.

