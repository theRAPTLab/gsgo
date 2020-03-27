# Material UI Tips

## How do I install Material UI for a GEM-STEP Package?

In general, we use this command to add remote packages to our lerna monorepo projects:

* `lerna add <remote_package> --scope=<our_package_dir>`
* add `--dev` for devDependencies
* add --peer for peerDependencies

Specifically, [installing Material UI](https://material-ui.com/getting-started/installation/) requires:

* Material UI core:`@material-ui/core`
* `react` and `react-dom` >= 16.8 as peer dependencies
* Roboto font:` <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />` or [bundle](https://material-ui.com/components/typography/#install-with-npm)
* Material Icons font: `<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />` or [bundle](https://material-ui.com/guides/minimizing-bundle-size/#option-2). 
* Material UI SVG Icons: `@material-ui/icons`

## What's the Minimum Config to start using Material UI in a GEM-STEP Package?

To [use Material UI](https://material-ui.com/getting-started/usage/) do this:

* add  `<meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />` to head
* insert `<CssBaseline />` into root of app *once*.

The raw skeleton code looks like this:

```jsx
import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';

export default function MyApp() {
  return (
    <React.Fragment>
      <CssBaseline />
      {/* The rest of your application */}
    </React.Fragment>
  );
}
```

However there's more stuff that we need to jam in there