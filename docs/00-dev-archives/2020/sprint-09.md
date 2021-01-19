SUMMARY S09 APR27-MAY10 2020

* Review original Function Spec Tab Layout; interpreted into a working page flow
* New [branching conventions](20-tooling/21-branch-flow.md) specified
* NextJS: custom server. client and server code injection points for URSYS
* URSYS: convert to package library. URNET socket server. URNET client injection.
* URSYS: URLINK local publish, subscribe, signal. React custom hook interface.

# 5. GEMSTEP WIREFRAMING (CONTINUED)

## Apr 27.01 Redoing Page Layout

The functional spec tabs don't make sense to me in a working app, so I'm redoing the flow. SYSTEM SESSIONS MODEL SIM OBSERVE ASSETS

Making new views for the index page.

* renamed all views to page-tabs
* redid all page-tabs to reflect a functional app
* added placeholder WF components to list functions per tab
* renamed blocks to page-blocks

## Apr 28.01 Reviewing System Layout

I spent some time trying to get MDX to work because it provides a plugin, but NextJS completely fails to work with the Typescript parsing for some reason My guess is because of webpack/eslint bullshit. Next runs webpack which loads eslint, and webpack needs to know how to find modules. This is what is failing. The `Next.config.js` file is supposed to use some mdx plugins to set the configuration correctly, but their examples don't work. I'm assuming it's just broken.

**With that, I think I'm at the point where I have enough outlined that I can move on to actual implemention of the SIM.**

## Apr 29.01 Merging and Moving On

I made the merge request last night and merged it into dev. This got me to thinking bout how other people manage their branches, because I would like to version our tags in a certain way.

Reviewing sample repos, these are the practices I saw:

* `master` used for deployment, releases, which have only 'version update' related things
* `next` is used for the "next version", squashed commits
* `<feature>` branches are named arbitrarily
* `<package/feature/subfeature>` sometimes seen
* `[issueid]-feature` sometimes used
* `gh-pages` for documentation on github
* `1.x` versioning branches for old versions that aren't current with "master" or "next" branches.
* `canary`, `master`, `alpha` in some repos
* `stable` is merged from "master" that is currently deployed, and is never fussed with and is tagged.

I wrote a new [Branching Conventions](20-tooling/21-branch-flow.md)) document that summarized our current practice. 



# 6. Simulation Prototype

## Apr 30.01 Preparing for Simulation Authoring

Here's a list of things to try:

* write a custom NextJS server...sure, why not. There are instructions for this.
* Make a pure data representation of agents based on pieces
* write out the lifecycle of the GEMSRV modeler and try hooking bits of it to the wireframe
* Make a canvas or webGL thingy. I am thinking PaperJS possibly in the future too; let's try to define a future-looking visualization module format.

Later on...

* Make a URSYS library that implements lifecycle for our web app framework
* Make a URSYS server, and connect GEM_SRV to its messaging
* URSYS state
* URSYS device synch syste

## Apr 30.02 Can I make a NextJS Custom Server in 10 Minutes?

According to the docs, NextJS custom servers lose:

* **serverless functions** - you can deploy to target 'serverless', which creates a "lambda function" for every defined page that works standalone on AWS Lamba or other serverless platforms. It's an interesting idea, but we are not using it at all. 
* **automatic static optimization** - determine if page is static if no `getServerSideProps` or `getInitialProps` properties exist. Our custom `_app` doesn't use it, but our `_document` page does. The document page is only loaded once so the rest of the app can render static. It's useful in the case we're streaming optimized pages from CDNs. Note there is also `getStaticProps` but that always renders on the server at build time. You can tell if a page is rendered as static if the lightning bolt appears in dev mode.

That in mind, let's go ahead and implement our custom server:

* Copy server.js code from NextJS example...works!
* update `package.json` scripts to run `node ./server/_start.js` instead of `next start`, etc
* update `.vscode/launch.json` to also use our custom `_start.js`  so we can debug.

Seems to work. Let's commit.

# 6.1. URSYS FOUNDATION FOR SIMULATION PROTOTYPE

## Apr 30.03 Can I make a stub URSYS package in our monorepo?

This is a more complicated task. What would the import look like? We have something in `gs_packages/globals.js`, and this is imported using:

```js
import GEM_CONFIG from '@gemstep/globals';
```

The prefix `@gemstep` is set in each `package.json` file. Cleaned up invalid `publishConfig:'restricted'` setting, replaced with `private: true`. 

Our stub package will be called `@gemstep/ursys` and it will export a number of libraries from the main object as follows:

```js
import { LibraryName } from '@gemstep/ursys';
```

To add the new package `lerna create @gemstep/ursys`. Updated package.json structure. Created stub `lib.js` that lists all the modules. I also renamed them. Also copy a minimum `tsconfig.json` file into the new `ursys` package so Visual Studio Code lints correctly.

Now let's **test importing**. For that to happen, we need to use Lerna to add this as a dependency:

```
lerna add @gemstep/ursys --scope=@gemstep/gem_srv
```

>  NOTE: I'm not sure how the **module format** should be. Probably need to have its own webpack configuration to build the library just right, in a way that supports **Tree Shaking** and also to use the more modern module formats. Right now, we're limited to `export = {}` because webpack isn't involved at all in **transpiling** it.

In my stub URSYS package, I have it export `_VERSION` which is echoed by the `gem_srv` custom server. It works!!!

## Apr 30.04 Where can I insert the startup code for URSYS in our NextJS framework?

NextJS has a data fetching lifecycle. It's alluded to [in this MUI example](https://github.com/mui-org/material-ui/blob/master/examples/nextjs-with-typescript/pages/_document.tsx). The way NextJS works is by prerenderng React on the server. The web browser client loads an initial page stub based on `_document.jsx`. The order of render operations is inside-out: from page to _app to _document. It runs TWICE: once on the server, and also on the client. 

SPECULATIVE THINKING OUT LOUD

In our old system, a single-page webapp bundle is compiled ahead of time and then served to clients by our custom server. There were two parts: the webapp server which returned an index.html that loaded the client bundle, and a socket server interface that established a persistent connection to the server's database functions. Routing was handled through React Router on the client side, and state was always held in the webapp.

In NextJS, we have routing managed by individual pages, served by the NextJS https server in either **development** mode or **production** mode. Each page is routed separately and is stateless, though there exists the provision for `getInitialProps` and others. I think it works like this:

* **nextserver** receives request for a page

* **nextserver** loads the page on the server and checks for:

  * `getStaticProps` at build time for static generation. Never called on client side. Use `process.cwd()` to get current directory where next is being executed. Exported specifically as an async function, not a property attached to the page as `getInitialProps` was.
  * `getStaticPaths` dynamic routes to pre-render based on data for static generation. Dynamic routes use the `[id].jsx` syntax. The function must export a `paths` key that specifics parameters to pre-render. Used in conjunction with `getStaticProps` to prerender a set of pages but also fallback to rendering to cache on demand. Cool!
    * `getServerSideProps` fetchdata on each request for server-side rendering on demand. Receives a `context` object that contains route `params` if it's dynamic, the http `req` and `res` objects, the `query` string, and whether it's "preview mode" 

* if any of those methods are attached to _document, _app, or the routed page, then those methods are called to retrieve props that will be provided to the React element being rendered on the page. This is fetched as a JSON file. 

* **nextclient** fetches rendered html and stuffs it into into the browser web pages. This is *NOT* React code executing on the client. 

* to run client-side code, the **dynamic import** is used. Two formats for Components

  ```jsx
  import dynamic from 'next/dynamic'
  // load the entire module into DynamicComponent
  const DynamicComponent = dynamic(()=>import('../components/hello'))
  // or load a specific export from the module into Hello
  const Hello = dynamic(()=>
  	import('../components/hello').then(mod=>return mod.Hello)
  );
  // return a temporary loading symbol
  const DynamicComponentWithCustomLoading = dynamic(
    () => import('../components/hello'),
    { loading: () => <p>...</p> }
  )
  	
  ```


### Approaches to URSYS Client Runtime Loading

There is a new Javascript feature called **dynamic import** can be used to load any object on the client side. NextJS has their own implementation which I tried to use:

```jsx
import dynamic from 'next/dynamic'
const URSYS = dynamic(()=>import('ursys').then(mod=>new Promise((res,rej)=>{
  await const UR = URSYS.Initialize();
  resolve(UR);
},{SSR:false});
```

HOWEVER...the NextJS version of this method doesn't seem to load non-React modules. 

As it turns out, we can just load our modules normally with `require` or `import` and make sure that the modules don't use any browser- or node-specific Javascript outside of a function declaration. Webpack will include the modules in the bundle that NextJS loads.

### Approaches for THREEJS and External Library Loading

There's an example for using ThreeJS with NextJS, but it relies on some unfamiliar React technology that is still experimental: 

* it uses **React Suspense**, which is a way to render a fallback component until a condition is met (like waiting for something to load), then draws when it's done. It's part of the big React rendering engine rewrite called **Fiber**. 
* ThreeJS is imported through something called a **React reconciler**, which is essentially a custom rendered that someone has written to coexist with **Fiber**. 

### Approaches for Client-Side Data Fetching

There's a React hook library called [SWR](https://swr.now.sh/) that can be used for remote data fetching using a "stale-while-revalidate" cache strategy. It immediately returns stale cache data and fetches validation data; if the new data is actually new it returns the new data again. I think this means it potentially fires twice.

Using SWR in a component means that you use the useSWR hook to know when a component should be rerendered. Somehow React knows that the hook parameters returned are associated with the functional component, and it's called automatically when the behind-the-scenes engine has new data. That's kindof neat. Note that the `useSWR` hook looks something like this:

```js
function Component() {
  const { data, error } = useSWR('key',asyncFunction); 
  const { data:user, error } = useSWR('key,asyncFunction); // data as "user"
  const { data:projects } = useSWR(()=>'/api/?uid='+user.id); 
  if (!projects) return 'loading';
  return 'You have '+projects.length+'projects'
}
```

So this is a pretty cool way to do asynchronous components with data fetches. It relies on the NextJS **API** interface, which is super cool. Just put your javascript in `pages/api/endpoint.js`, where endpoint can be the name of the call.

## Apr 30.05 Test the Dynamic Loading to see if we can just load something client-side only

**Q. Can we even load the URSYS package through `dynamic`?** 

**A. NOPE.** The `dynamic` package wraps the return value in a React component, so it's not useful for us. It might be possible to dig out some inner value, but it's hacky.

There may be a more direct way by using React's [built-in import](https://reactjs.org/docs/code-splitting.html) that is already provided by webpack. Let's see if that works.

```js
let URSYS;
import('@gemstep/ursys').then(mod => {
  URSYS = mod;
});
setTimeout(() => {
  console.log('timeout URSYS=', URSYS.default._VERSION);
}, 1000);
console.log('immediate URSYS=', URSYS);
```

This actually works but we can't load the module very easily and execute it. For one thing, this is executing ALSO on the server side. 

**Q. How about a client-side event trigger?** 

A. We can rely on URSYS being loaded by webpack, so it can be defined and compiled serverside. Then we call the bundled library. This works fine! That is because NextJS **is our bundler** to provide source code; so long as we don't call any window-specific code outside of an event or effect hook, we're probably fine!!!

```js
import URSYS from '@gemstep/ursys';
console.log(URSYS._VERSION); // prints on server AND client though...
```

> CAVEATS: when starting up the server, code is **run ONCE on the server-side to build the initial SS app**. After the server is running, the server is just serving rendered elements. However, every client connection and interaction will rerun (not sure exactly what triggers this)

**Q. So how do we initialize the URSYS library on the client?**

A. Use React's `useEffect` or `useLayoutEffect` hooks. **These hooks execute only on the client after rendering**; this [video](https://dev.to/changoman/next-js-server-side-rendering-and-getinitialprops-intro-10n2) may confirm this technically. For now, I'm seeing it only run on the client in the `_app.js` file.

## May 01.01 Add URSYS Server

There's two parts to this:

* The socket server
* The client connection

Copying the `app_srv` ursys files into `gem_srv` as preparation to launch URNET on the server and the as-is client connection services.

**CURRENT STUCK POINT**

The next big challenge is figuring out how to break the ursys package into **server** and **client** code. We can't just import URNET in `ur.js ` because NextJS actually will compile all those source files (I think), and it can't resolve 'fs'. We need to import the server code from `gem_srv/server/_start.js` and client code from another entry point...URSYS needs at least two entry points, so I need to study how to put together a library like that.


## May 05.01 Detailed Activity Log

We got this [cool breakdown](https://docs.google.com/document/d/1AV-OxxQlY8KKXO4-nwu8JiYEodINReB5I_5dfDD-J50/edit) of a detailed activity walkthrough that will help structure the wireframe app!

## May 07.01 URSYS Library

I've started notes on how npm libraries work in both the browser and node. The short answer is that the bundler generates the library, OR you write code that implements the UMD pattern for you. The UMD pattern has to be completely self-contained though, so I think I might just want to use Webpack. 

In the [npm-tips](10-tips/10-tips-npm.md) notes, I assembled the necessary changes to make to a new `webpack.config.js` configuration in `@gemstep/ursys`.  It appears to work, so let's commit this change and test further.

Now we have to split the code so the server elements don't include the client elements. This is done by making a webpack config that loads `export-server.js` and `export-client.js` using different webpack configurations.

## May 08.01 URSYS Network Reactivation

The **opening question** is: "can I even launch the socket server from the new ursys library?" YES

Now adding `nodemon` to relaunch the custom server. It can now reach into the `../ursys/server` directory as well and relaunch when that changes as well as its local `src/server` js files :heart:

I fixed the structure of the main output files of URSYS library, and they are also now autogenerated with Webpack when I am editing them. This will also trigger the gemsrv custom server to relaunch as well :couple_with_heart:

The question is still open though: **launch the socket server**. YES!!! But: 

1. **connecting the client** requires information passed to it so it knows where the socket server lives. 

2. There is also the complication of **server-side rendering** and what modules get executed on the server.

**Addressing (2)** - the mere act of including URSYS in `_app,jsx` means that it's run on the server side, so we need to clean it up.

* index-client imports client-datalink, which looks clean
* also imports client-connect, which  looks cleans but imports:
  * client-central: sets a bunch of UR parameters on load...fixed
  * class-netmessage
  * util-prompts

**Addressing (1)** - At this point, there are several parameters we need to deliver from the server to the clients. In past incarnations of STEP, we injected these values through an Express server template index page. NextJS has its own conventions for the templating (e.g. `_document.js` and `getStaticProps`), so we'll use that.

First consider **URSYS needs:**

URSYS is now a library, so URSYS SERVER needs to be initialized with several startup parameters to work with any given project. Previously these were hardcoded values in the embedded library.

*  `RUNTIME_FILES` is the directory where internal data structures are generated. These are never served directly to the client. Examples:
   * databases
   * log files
*  `MEDIA_FILES` user generated assets
   * dynamically-generated assets like screenshots
   * teacher-uploaded assets like images, pdfs, resource manifests
   * NOTE: NextJS will [serve static files](https://nextjs.org/docs/basic-features/static-file-serving) from a `public` directory at the root level of the project. This directory can be used for the webapp, but shouldn't contain 

Students type in the URL of their application server into a web browser to load the web app from the running application server. This web app needs to receive information to connect to URNET, which is the  hub-based message broker that allows apps on the network to talk to each other. Information that needs to be received by *EACH* connecting client:

* `URNET_BROKER` is the websocket server host information
  * `host` is the websocket url, including the port number
  * `port` is the websocket port (separated for convenience)
  * `uaddr` is the URNET address of the host

When the client uses URSYS to connect to URNET, it then receives its own `uaddr` and is ready to send a variety of URSYS commands, but that is a topic for a later time.

### Retrieving URNET_BROKER information on the Server

Although the client could make assumptions about host, port, and uaddr, this won't work for the library version of URSYS. Other clients and servers might have different connection credentials.

After screwing around with using various versions of `getInitialProps` on `_app` and `_document`, I implemented an API call that returns this information. Currently it is hardcoded by the endpoint source itself, but it can be changed to pull from a common module.

The basic idea:

* It turns out we can just return whatever in _app.jsx's `getInitialProps(ctx)`after doing a **fetch**. It doesn't have to do anything with `ctx` to make it work. The returned data is injected as a prop naned `urProp` into `MyApp`.
* We `useEffect()` in `MyApp` to ensure that we're running on the client side, and access the `urProps` there with the UR_BROKER info.
* We call `UR.Connect(urProps)` inside the lifecycle startup sequence right there. 

The complete URNET startup.

* Start socket server: call `URSERVER.StartNetwork()` in `_start.js` custom server
* Retrieve client connection data using `fetch` from `api/urnet.js` endpoint in `MyApp.getInitialProps()`,  returning it as `urProps` add-on to `...appProps`
* in the `MyApp` function, `useEffect` to call `URCLIENT.Connect(urProps)` connection information `host`, `port`.

This initializes the connection and sets up the client websocket. 

## May 10.1 URSYS handshake and messaging

The URLINK object handles the sending and receiving of URSYS messages. Internally it creates a unique local ID that then uses the internal MESSAGER class. It really is a kind of **channel**. 

We will do only local publish/subscribe first. The syntax looks like this, importing from `@gemstep/ursys/client`.  These versions are using the "app-wide" channel that is the default in URSYS, which prevents publishers from receiving its own message. 

```javascript
UR.Subscribe('MESSAGE',data=>{ ... });
UR.Publish('MESSAGE',data).then(data=>{ ... });
UR.Signal('MESSAGE',data);
```

There are network versions of these calls also, but I'm deferring that for now the interapplication message design can wait until I redesign it for the new system.

In NextJS, we need to ensure that the subscribe happens only on the client side. 

We need to ensure that the URSYS subscribe/publish code is run only on the client. These 

* A function included in a React hook like `useEffect()` will *always* execute on the client side. The same is true for functions called as an event handler. 
* Functions declared outside effects and event handlers may only run on the server. You can check `process.browser` to see if your code is running on the client. This a webpack thing.
* Non-react modules are loaded on the client and server; they are compiled twice into bundles. Use `if (process.browser)` to guard code that relies on the browser. We can load them anywhere and access them, and they will persist on the client side.
* NOTE: Users of the URSYS library can use either `const UR = require('@gemstep/ursys/client')` syntax or `import UR from '@gemstep/ursys/client'`. URSYS internal modules however, use `require` instead of `import` works better because the URSYS webpack config compiles them as UMD. 

There is an **URSYS lifecycle** that defines when subscribers and publishers are allowed to run. Since UREXEC isn't ported yet, a placeholder is located in `_app.js` in a `useEffect()` to make it run on the server. `URNET.Connect()` is called here to initiate the connection to the socket server, none of the other [defined lifecycle events](01-architecture/02-urnet.md) fire yet.

For now, we rely on the fact that React hooks execute only when they're being rendered. In particular, we rely on `useEffect()`'s key features (these are a bit tricky; this [article](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) helps understand it all):

* `useEffect( effectFunc, [watched] )` will execute the function after the DOM has stabilized. 
* The *effectFunc* is defined at a point in time where any variables it refers to are "captured" by the current closure at the time the function was created and *will not change*. If you need persistence, then the `useRef()` hook will return an object that *will* persist across rander calls. 
* If *effectFunc* returns an *unmountFunc*, this is run when the component unmounts for automatic cleanup. Again, the closure issue works...it will capture the value of any referred value at the time the function is created.
* When *watched* is specified, the useEffect only runs when it's changed. To run useEffect only once, specify an empty array.

Our solution to implementing **URSYS Subscribe** was to implement a custom effect called `useRegisterMessage`, which looks like this:

```js
function useRegisterMessage(message, callback) {
  useEffect(() => {
    UR.Subscribe(message, callback);
    return () => UR.Unsubscribe(message, callback);
  }, [message, callback]); // not sure if the watch is necessary
}
```

It's inserted into a Component like this. In this example, the effect function can manipulate a `useState` defined within the function that affects the rendered output.

```js
function Component() {
  const [ datum, setDatum ] = useState(0);
  useRegisterMessage('HELLO_URSYS', data=>{
  	console.log('got data',data);
    setDatum(data);
	});
  return <div>{value}</div>
}
```

Understanding how this works relies on knowledge of the React lifecycle and Javascript closures at runtime. The KEY INSIGHT is **the React model is declarative**, and what we do is describe what happens at certain points in the React lifecycle (which we have to know). That makes the flow hard to understand if you're expecting a more **imperative programming** pattern. A lot of React is returning functions that will eventually be processed by the React lifecycle at a certain time, and these functions often return other functions to be executed or be triggered by other internal React conditions. It is sort of like writing Shaders for graphics pipelines. 

### THE NEW HOTNESS

* To SUB from within a functional component, use the new `useRegisterMessage` hook from `hooks/use-ursys`. 
* to PUB from within a functional component, use `UR.Publish()` directly.
* To SUB or PUB from any module, use `UR.Publish()` and `UR.Subscribe()` as normal.



