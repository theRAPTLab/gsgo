SUMMARY S07 MAR30-APR12 2020

* Create **GemServer** package with VSCode subworkspace supporting local "npm run local" command and "launch.json" server debugging.
* Figure out **Material UI theming and styling** and its relation to Material Design. **Documented** and created source code examples.
* Figure out **NextJS** and server-side rendering implications.
* Create custom NextJS configuration with best practice **theming and styling**, **stackable  screen-filling components** with **two-level navigation**. Also rudimentary **client-side data persistence**.



# 3. Wireframing

what are the key material elements to use?

```
Box - a generic box, can accept fixed width minWidth stuff.
Container - a box with width and horizontal centered content
Grid - a CSS FlexBox implementation
```

I think that I could make UI that uses a CSS Grid, with Material-UI stuff inside of it adapting to changes.

The goals of the wireframe though are to show elements, so maybe not worrying about layout at this moment is the wise thing to do. Let's just make a wireframe that lists everything using existing components, but not worry about making it work yet. We'll have to see what everything looks like before we start working on screen technology. **capture first**

## Mar 30.1 - Big Blue Boxes

I'm working out the theming right now. I think the idea behind using MUI's styles is that you can do fancy stuff within the components themselves, which is nice. For global styles, though, we will use the theme.

Ok, some realizations about themes:

1. `<ThemeProvider>` and `createMuiTheme()` work by passing the theme object down. It's accessed either by `useTheme()` hook or `props.theme` when the component is wrapped with `withStyles()`. 

2. While you can add your own elements to the theme, this is *not* the same as using `classes.root` and `className` with the style interface. Styles are independent of the theme, but can be passed the theme to use its constants.

3. To see how to combine theme and style, see https://material-ui.com/styles/basics/#stress-test

4. I'm still not sure if there's a way to create a shared stylesheet. The important object is probably to export `classes` somehow. Should console-log this to see what is really in there. 

5. Apparently JSS is deterministic so classnames can be shared. But HOW? https://github.com/mui-org/material-ui/issues/8912 and https://material-ui.com/styles/advanced/#global-css

6. `makeStyles`can receive a function that will receive the theme object. 

   ```js
   const useStyles = makeStyles(theme => ({
     root: props => ({
       backgroundColor: props.backgroundColor,
       color: theme.color,
     }),
   }));
   
   const Component = props => {
      const classes = useStyles(props);
      ...
   ```
   How does this work? Recall `useStyles` is returned as a function from makeStyles. useStyles can receive a parameter, here called props, when it's invoked at render time.

## Mar 30.2 - The Ultimate ThemeStyle

Themes are defined in `_app.js` by reading from `theme.js`. End users never touch this. You can augment this with theme-related globals defined in `theme-extra.js` which can be used to calculated *derived* metrics. But these are read-only. 

## Mar 31.1 - Blue Boxes

Today's morning goal is to make a blue styled box appear in the grid. After yesterday's work, I should have a workable theme structure.

## Apr 02.1 - Blue Boxes Continued

Monday's work got the style working along with a theme. Now let's try to lay something out. This iwll happen in `index.js`. we have a ExLoginBar, a ExAppBar, and a ExBoxLayout. We are making a new layout called **ExTabbedLayout**. This requires making a tab of some kind. Let's copy it from the material-ui examples...

I've updated the way styles are imported. Now there is a base styles/wireframing.js module that exports bluebox styles.

So I want a nice system where I can speciffy the contents of the application simply from index.js. 

* ExTabbedAppBar - has a TabPanel component that renders its children. 

```
<Typography role="tabpanel" hidden={value!==index} id={`simple-tabpanel-${index}`} {...other}>
	{value===index && <Box>{children}</Box>
</Typography>
```

``` jsx
<Tabs
  value={tabIndex}
  onChange={handleChange}
  aria-label="simple tabs example"
  className={classes.tabs}
>
  <Tab label="Item One" {...a11yProps(0)} />
  <Tab label="Item One" {...a11yProps(1)} />
  <Tab label="Item One" {...a11yProps(2)} />
</Tabs>

<TabPanel value={tabIndex} index={0} />
<TabPanel value={tabIndex} index={1} />
<TabPanel value={tabIndex} index={2} />

---
We have:
<GSTabbedView>
  <GSView label="Tab 1" index={0}>
    <View/>
  </GSView>
  <GSView label="Tab 2" index={1}>
    <View/>
  </GSView>
  <GSView label="Tab 3" index={2}>
    <View/>
  </GSView>   
</GSTabbedView>


```

We're going to add **redux** now. 

```
# in the gem_srv folder
npm install --save redux react-redux
# errors will appear about missing peer dependencie
# in lerna root, then 'npm run bootstrap'
# resolve package mismatches as necessary by editing the and npm run bootstrap again

```

Now we want to make a reducer, which takes a state object and an action and returns the modified state.

```
# now make folders
mkdir redux redux/actions redux/reducers
# now make sure files exist and edit them
# https://dev.to/waqasabbasi/server-side-rendered-app-with-next-js-react-and-redux-38gf
touch redux/reducers/counterReducer.js
touch redux/actions/counterActions.js
touch redux/reducers/rootReducer.js
touch redux/store.js
```

At this point, the [tutorial I was following flaked out]() and doesn't actually work with current standards. So, we'll have to synthesize it from scratch. First some initial reading:

**1. The NextJS 9.3 recommendation is to use [`getStaticProps` or `getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching), not `getInitialProps`.** 

The props supplied by `getStaticProps` will be used to build the page. Since this runs on the server you can  actually export stuff.

**2. React Redux 7.1 [supports Hooks](https://thoughtbot.com/blog/using-redux-with-react-hooks)**

`useSelector` is analagous to `connect mapStateToProps`, and is passed a function that takes the Redux store state and returns state for you.
`useDispatch` replaces`connect  mapDispatchToProps`, returning the store's dispatch method.

```jsx
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCount } from "./store/counter/actions";

export const Count = () => {
  const count = useSelector(state => state.counter.count);
  const dispatch = useDispatch();

  return (
    <main>
      <div>Count: {count}</div>
      <button onClick={() => dispatch(addCount())}>Add to count</button>
    </main>
  );
};
```

**3. next-redux-wrapper purportly is a utility to make next and redux work together**.

See [kirill's thing](https://github.com/kirill-konshin/next-redux-wrapper) though it is his example that I wasted time reading before. Someone found it didn't work and [wrote another appoach](https://jibin.tech/nextjs+redux/).

OVERALL THOUGHTS: Since NextJS runs on the server, synchronizing state between the server app and the client app may not make sense. We might have to create our own, less-stupid approach.

**4. There are new [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) Hook available?**
`const [state, dispatch] = useReducer(reducer, initialArg, init)`
The `reducer` function is your state handler that mutates state. With this you don't need redux anymore.
However, this is not global application state.

**5. Screw Redux. Write our own custom app state and persist it with redux ourselves.**
The [custom app](https://nextjs.org/docs/advanced-features/custom-app) feature of Next means there's an App instance that is always loaded. You just need to pass `pageProps` down into it. HOWEVER...
There is a difference between the initial props set in `_app.js` and the *RUNTIME* behavior. Any UI-triggered event is going to be accessing the client-side of things, which will be always set to the initial props that have come-in.

I think to get around this, all ui code and client initialization have to be **explicitly** managed with their own state. That's a bit tricky.

**6. Screw NextJS+MaterialUI. NextJS is not a SPA architecture**

Q. On the other hand, nextJS might be able to access the full node environment? **NOPE**. The webpack bundler isn't setup for it. We still need to make an API server.

RESOLUTIONS:

* Design a SPA support framework that uses NodeJS to serve pages. Some special pages can be essentially just loader boilerplate for our dynamic apps.
* Try using React [Context API](https://reactjs.org/docs/context.html), which seems to allow creating a single context object that can be defined in a js module and imported into any JSX module. NextJS might work with this.
* Look into using Material UI Styling with a straightforward hyperlink navigation structure. It's probably the easiest thing to do now.

## Apr 03.01 - React Redux or Context?

Right now the repo is in a state of having react-redux in it, but I'm not sure it's the solution for me because it involves transmitting the react state from the server to the client. This split between "what is on the server" and "what is on the client" is a bit confusing. 

So...let's see if I can use the Context API to at least handle things like application state, which is running on the server. 

```jsx
const ThemeContext = React.createContext('light') /* CREATE CONTEXT */
class App extends React.Component {
  render() {
    return (
      <ThemeContext.Provider value="dark">        
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}
function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}
class ThemedButton extends React.Component {
  static contextType = ThemeContext;  /* USE CONTEXT */
  render() {
    return <Button theme={this.context} />;
  }
}
...
All you have to do is wrap your components in a Context.Provider and then call useContext(Context) inside that component to access your state and helper functions.
    
```

The Context API kind of bugs me. As does all of react. [People agree](https://leewarrick.com/blog/the-problem-with-context/). 

```jsx
const {useContext, useState, createContext, useMemo} = React
// EXAMPLE
// creating state at a high level and providing it as a context value
// memo-ized version
const AppContext = createContext(); // this is a COMPONENT

function useAppContext() {
  const context = useContext(AppContext)
  if (!context)
    throw new Error('AppContext must be used with AppProvider!')
  return context
}

function AppProvider(props) {
  const [count, setCount] = useState(0)
  const value = useMemo(() => ({ count, setCount }), [count])
  return (
    <AppContext.Provider value={value} {...props} />
  )
};
// Only components that call useContext re-render whenever the context’s state changes.

```

This [Dave Ceddia article on Context versus Redux](https://daveceddia.com/context-api-vs-redux/) is an interesting read.

This article on [authentication in nextjs with react redux](https://kaloraat.com/articles/next-js-react-redux-authentication-tutorial) also seems like it will be useful

## Apr 07.01 - Wireframing Continued

Where I left off was deciding to **not worry about state** and implement the NextJS navigation thing.

```jsx
import Link from 'next/link';
<Link href="/about">
  <a>About Page</a>
</Link>

const { Menu, MenuItem, MuiThemeProvider, getMuiTheme } = MaterialUI;

class Example extends React.Component {
  render() {
    return (
      <Menu className="horiz-menu">
        <MenuItem primaryText="Home"/>
        <MenuItem primaryText="Test Menu 1" />
        <MenuItem primaryText="Test Menu 2" />
        <MenuItem primaryText="About" />
      </Menu>
    );
  }
```

Trying to turn a Menu into a NavMenu is a waste of time. I think the **best practice** is to either follow Material Design (not Material UI) guidelines or roll-your-own components through reading the Material-UI documentation carefully.

* **Question:** what is the activeClass

* **Question**: where is there a great example of a nextjs app?

* **Question**: should I just read the nextjs docs and outline them?

## Apr 09.01 - Fixing Subtab Navigation

I finally figured out a NextJS server-client split with working main tabs. However, the subtabs also need their own navigation. How do the main tabs work in `<SiteNavigation>`?

In `<SiteNavigation>`, the Tabs component is just a bar of Tab elements that know how to highlight. 

```
## SiteNavigation uses <Tabs><Tab> just for displaying the current page
<Tabs value onChange={handleChange}>
	<Tab label key component>
</Tabs>

## Navigation is handled through programmatic use of next/router
const handleChange = (event, newIndex) => {
	... look up route from ROUTES object by index
	router.replace(route.href)
	... store current tab
}

```

For subtabs, we use `<ExTabbedView>`

```
<Tabs value onChange={handleChange}>
	{generated children wrapped in <Tab key label id 'aria-controls'>}
	id = `gem-tab-${index}`

The children of <ExTabbedView> are responsible for implementing logic for being hidden or not. These are currently <ExView>
<ExView role="tabpanel" hidden={currentTab!==index} id={`gem-tabpanel-${index}`}
```