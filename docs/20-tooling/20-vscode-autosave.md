Our coding guidelines require the use of Prettier to autoformat all code on save. This helps us detect changes to source code between commits more easily. It also guarantees a minimal level of code hygiene.

The GSGO repo has default settings baked-in to make **Prettier Autoformatting on Save** work, though this has not been tested across all developer installations. If it isn't working, try these troubleshooting steps. 

**1. Is the project environment modified?** 

The repo has a hidden directory called `.vscode/` that contains overrides for the Visual Studio Settings, notably `editor.formatOnSave` on the global folder level. This should override any workplace or user settings (see [settings precedence][prec]). Specifically these settings are overridden:
```
  "editor.renderWhitespace": "all",
  "editor.wordWrap": "off",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
```

**2. Are the recommended extensions installed?** 

There are three required ones that are mentioned in `.vscode/extensions.json` (vscode will not autoinstall them, but will pop-up a dialog on first open of the project):
```
  EditorConfig - `editorconfig.editorconfig`
  ESLint       - `dbaeumer.vscode-eslint`
  Prettier     - `esbenp.prettier-vscode`
```
If you somehow have the wrong Prettier or ESLint extension installed, the strings above can be verified against your INSTALLED extensions. Open the Extensions Panel (CMD-SHIFT-X) and look at the INSTALLED group. The extension signature is next to the name of the extension. 

**3. Is there some Settings Weirdness Going On?** 

Go to the VSCode Preferences (CMD-COMMA) and search for `formatOnSave` to see what settings pop up. The 'folder' set should show `formatOnSave` selected. Here is [the complete list of settings][settings] for reference. Some troubleshooting possibilities are:
* **Is the default formatter not set?** You are prompted to choose one when formatOnSave is invoked. This is a VSCode setting.
* **Does manual formatting work?** You can invoke it using the VSC Command Palette (CMD-SHIFT-P) and typing 'Format' to find the appropriate commands. 
* **Are the Prettier Extension settings being overridden?** Open the VSCode Settings (CMD-COMMA) and type "Prettier" in the search box. The two important settings that must be checked are `Prettier:Enable` and `Prettier: Use Editor Config`. Note that _some_ of the options here are being overridden by ESLint rules defined in `.eslintrc.js` (e.g. wrap single argument in arrow function with parenthesis)
* **Is the HTML formatter enabled?** This affects formatting of HTML files

**4. Are there weird errors from VSCode or Extensions?** 

The terminal has several output tabs. Open it (CTRL-TILDE) and click the OUTPUT tab. On the FAR RIGHT there is a dropdown were you can select what to monitor. You should see Prettier and ESLint among the options.

**5. Is Prettier misbehaving?** 

On the terminal OUTPUT under Prettier, you you should see output everytime you format. Try it with manual formatting. Try saving the file; if `formatOnSave` is working, you'll see Prettier spit some output whenever you save any file that can use an installed formatter.  You should also see a Prettier checkbox on the VSC Taskbar Status at the very bottom right of the window. It shows a checkbox is Prettier is happy, or an X if the code is malformed and can't be autoformatted.

[prec]:https://code.visualstudio.com/docs/getstarted/settings#_settings-precedence
[settings]:https://code.visualstudio.com/docs/getstarted/settings#_default-settings
