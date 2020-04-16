## Debugging NextJS in Visual Studio Code

If you are using MaterialUI, you need a custom `_document.jsx` template to fix style rendering issues.

The development server automatically spawns a debugger instance. 

You just need to create a `launch.json` file. Click the RUN icon in VSC on the left. This is what the launch json should look like:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug App",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

Have to play with this more, but I can see console.log output from the server side. Client side not so much. 