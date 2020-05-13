# @GEMSTEP/URSYS

## Adding URSYS to a monorepo package
```
cd gsgo
lerna add @gemstep/ursys --scope=@gemstep/yourpackage
```

## Including the URSYS module in your code
To include the ursys client in the browser:
```js
import URSYS from '@gemstep/ursys/client';
```
To include the ursys server in your node server:
```js
const URSYS = require('@gemstep/ursys/server');
```

The client and server exposes different methods as well as some common data structures.
Documentation to come.

## Modifying URSYS

There are two main library entrance points defined in `src/index-client.js` and `src/index-server.js`. These are bundled by Webpack into two distribution folders `client/index.js` and `server/index.js` 

To rebuild the distribution files, use the `npm run build` command while inside the `gs_packages/ursys` directory. 
