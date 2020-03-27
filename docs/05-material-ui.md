**[Material UI](https://material-ui.com/)** (MUI) is the most popular React UI framework at the moment and though I am inclined to give [Fomantic UI](https://fomantic-ui.com/) a go, I think we'll stick with it. Ben mentioned it was hard to style, so I am going to pay particular attention to that. 

Material UI is an implementation of the [Material Design System](https://material.io/design/); to modify components, you will need to understand that system's nomenclature for its theming. 

# Components

There are official Material Design Components for Web described [here](https://material.io/develop/web/). These are actually a different set of components from MUI, which can be found at [material-ui.com](https:.//material-ui.com)

# SCREEN

AppBar at the top

Drawers at the sides

CSSGrid can be hacked onto MUI. 

# Styling and Theming



## How CSS-in-JS with JSS Works

MUI uses a CSS-in-JS approach, [specifically the JSS library](https://v3.material-ui.com/customization/css-in-js/). This approach creates a CSS file from a JS object, which is injected into the application at runtime at the bottom of the `<head>` element. The stylesheet is as specific as possible.

The style object format is **keys** that are the class names, with **strings** in CSS format.The keys can also accept a function that will receive props and can return a value.

CSS class names are **generated** by the JSS compiler, so they are **non-deterministic**. The  `makeStyles` and `withStyles` wrappers return a "classname to generated classname"  dictionary lookup object that's usually named  `classes`. 

## MUI Styles API

The MUI solution doesn't expose JSS directly, but provides its own `withStyles` wrapper method that returns a React component. 

There are multiple approaches you can take to use it, as [described here](https://material-ui.com/styles/basics/). 

* Hook API: `makeStyles` wraps the style definition and returns a function that exports the style object as speciied.
* Styled components API: a version that resembles Styled Components, a different approach than JSS (but still JSS under the hood)
* Higher-order component API: `withStyles` wraps a style definition and returns a function that wraps a component (either a function or an object), injecting the `classes` prop. It accepts options to inject a base theme too.

Hook: The magical part of MUI is that it uses `makeStyles` to:

* takes a simple (class:styles} object and then...
* return a function (often called `useStyles`)  that returns a `classes` lookup object that maps the original style object props to the *generated class names* in the compiled CSS file

HOC: The magical part of MUI with `withStyles` is:

* takes a simple (class:styles} object and then...
* return a wrapper function that injects `classes` lookup into `props`

## MUI Themes API

NOTE: Styles are not the same as Themes! Also, Material-UI is an implementation of the [Material Design System](https://material.io/design/), using that system's nomenclature for various style variables. The core variables are:  

| variable   | variable    | variable |
| :--------- | ----------- | -------- |
| Palette    | Spacing     | z-index  |
| Typography | Breakpoints | Globals  |

To **create** the theme, use `createMuiTheme(optionObj)` and any other objects to deep-merge into the resulting theme. 

To **use** the theme, pass it through The `ThemeProvider` wrapper component, and the values will be automatically applied to anything that uses those elements. If you want to access the theme object itself, use the `useTheme` hook. 

There are more variables than the ones above; see [createMuiTheme](https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/styles/createMuiTheme.js) to see everything that's included. 

NOTE: You can create your own private style objects. You don't need to stuff them all into your theme. 

### Customing specific components

Customizing components themselves are [documented](https://material-ui.com/customization/components/) for the cases from most-specific to broadest use cases. To override a specific instance of a component, you can create a new style with either `withStyles` to inject into your component's `className` or `makeStyles` to use hooks to rewrite `classes` props for the component. In both cases, you are replacing the generated classnames. Recall that MUI uses JSS, which generates real CSS with generated class names. Every time you use something like `makeStyles` or `withStyles`, you are generating another set of CSS class names.

Alternatively, use the dev tools to figure out what props in `classes` prop to override.

### Customizing the Global Theme

The basic idea is to use `createMuiTheme` to override the theme configuration variables.

You can also use the `overrides` key of the theme 

### Ben Experiences

> *I think the other thing that threw me was how nested all the components were and realizing that I had to go up the hierarchy to the base components to have better control.*

An example of this: StickyNotes in MEME

