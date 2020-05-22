# NextJS Tips

## Customizing Document

NOTE: You can customize the [server](https://nextjs.org/docs/advanced-features/custom-server), as well as the templates for [document](https://nextjs.org/docs/advanced-features/custom-document), [app](https://nextjs.org/docs/advanced-features/custom-app), and [error](https://nextjs.org/docs/advanced-features/custom-error-page) pages.

## Server Side versus Client Side

It's important to remember that NextJS does **server-side rendering** (SSR) of React components. This means that you can't always access global `window` or DOM elements as you might in a normal Single Page App (SPA) which renders everything in the browser. SSR executes in the NodeJS environment. 

Also, NextJS also uses SSR to generate **static files** for serving directly to a CDN. These are not plain HTML files, but HTML augmented with the minimum Javascript to "hydrate" the bare structure with runtime data. I'm not sure exactly how it works, but the takeaway is that "some code runs on the server" and "some code runs on the client". You can access NodeJS features in some of your React code, but not in others.

The separate of client and server is fuzzy. You can think of the server render as the "initial page" render that is deployed to the client, and then on subsequent interactions the client-side code will execute on the client. The initial page render is loaded by navigating to a route, and is a page fetch. Subsequent clicks on the page work like an SPA, executing in the browser but in completely different environment. Because of this, you can't share data across code boundaries as easily as you might think. Instead, you can use a NextJS feature called `getInitialProps()` which runs in one of three main places: 

* `_document.jsx` is the HTML template. It returns a React component that is rendered as the root by NextJS. I believe it runs only on the server. 
* `_app.jsx` is loaded by NextJS client shell and is ultimately what renders routed pages. This is a good place to put anything you want *persistent* across routes in the app. Using `getInitialProps()` here allows you to pull data from the server and make it available to every route. This runs both on the server and the client.
* Any route in `pages/` can also use `getInitialProps()` and runs only on the client. 

### Initializing the browser with server data

In the past we've injected server access parameters directly into the client using ExpressJS and a template engine to write a JSON object into the `window` global script. These parameters would then be used to initiate a socket connection to a server. This is not possible with NextJS custom servers and is probably a NextJS anti-pattern.

The easiest way to do this so far has been to create a NextJS API endpoint in `pages/api` that delivers information that can be fetched by `_app.jsx` in a `getInitialProps` handler. Here you can add additional React props that will be passed to the `<MyApp>` component. I tried to find a way to somehow "bake-in" the values from the server-side code, but didn't find a way. The use of API endpoints gives us access to the Node environment runtime. Use of common modules between our NextJS custom server and the API endpoint file is probably how we'd handle that kind of on-the-fly data communication.

 ### Guaranteeing Client-side Execution

Anything interactive (like a click handler) has to run on the browser, but with React you can only trigger this from inside components. With NextJS controlling execution, we can guarantee this by using the React hook `useEffect()`, which by definition executes only when the DOM is completely stable (similar to `componentDidMount()`), implying that it's happening on the browser. We initialize the URSYS module subsystem in the `_app.jsx` component, which runs once, in the master `useEffect`. 

Any event handler (e.g. `onClick`) also has to run on the client, as do any asynchronous timer events. However, using timers with React functional components is kind of tricky. 

On a case-by-case basis, you can also check `process.browser`, a webpack-injected property that will be valid on browser-executing code. If this check passes, you can access browser environment variables.

### Talking to React from Outside Modules

Unlike our SPA architecture where we spawn `React.render()` after setting up the runtime environment, NextJS exposes fewer opportunities to do so.

* server: we are using the custom NextJS server feature to intercept routine information from the http module but we do not have access to Express middleware. This is where we launch URSYS socket-based server. 
* client: we have access to `_app.jsx` and can initialize modules in the `useEffect` master hook. This is where we start the URSYS lifecycle on the client.

Since we can't programmatically control React components from the outside, we can use the URSYS message system to sneak messages in. UR can be loaded as a module in any React component, and it provides a **custom hook** `useURSubscribe`. You can combine the use of `useState` hook with the subscription handler so React knows when to respond. The component can also use the regular `UR.Publish()` , `UR.Signal()`, and `UR.Call()` methods normally to send messages out if it's wrapped either in an event handler function (e.g. `onClick`) or a `useEffect` hook.

Efficient rerendering of React components is a separate topic! In general we want to avoid double-renders and rerendering too much of the page, and that means structuring your state props. 

On a side note, remember that functional components are STATELESS. If you define a variable somewhere in your functional component that depends on a passed value, it will NOT UPDATE as expected because of the way closures work (they capture the value once at the time the function is allocated). You can use the React `useRef` hook to create a persistent reference between function invocations that will work around this. Or use the `React.Component` class instead, which is stateful.







