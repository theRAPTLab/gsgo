**[Material UI](https://material-ui.com/)** (MUI) is the most popular React UI framework at the moment and though I am inclined to give [Fomantic UI](https://fomantic-ui.com/) a go, I think we'll stick with it. Ben mentioned it was hard to style, so I am going to pay particular attention to that. 

Material UI is an implementation of the [Material Design System](https://material.io/design/); to modify components, you will need to understand that system's nomenclature for its theming. 

# Components

There are official Material Design Components for Web described [here](https://material.io/develop/web/). These are actually a different set of components from MUI, which can be found at [material-ui.com](https:.//material-ui.com)

# Styles and Themes

Styling and Theming are different concepts in Material UI.

* The official Material UI approach to styling is [JSS](https://v4.material-ui.com/customization/css-in-js/). JSS works by creating a real CSS stylesheet behind-the-scenes, bundling collections of CSS  statements into 'rules'. These rules have a corresponding *GENERATED* classname; you use the `classes` object returned by MaterialUI to set the `className` property appropriately to modify a particular component. If you need to overwrite a component's class structure more thoroughly, uses the `classes` property instead. You can also do overrides with the `style` property.

* Theming, by comparison, sets parameters that affect the global appearance of the Material UI base components. These parameters correspond to what is described in the [Material Design System](https://material.io/design/). You can also add *ADDITIONAL* parameters that then become globally available through the `theme` object. This is a distinct object separate from styles.

## Customizing Components

The flow we're using is:

### Setting Global Appearance and Custom Parameters

For GEM-STEP we have the following conventions:

1. Declare a global theme using `<ThemeProvider>` in the root component, importing a **theme module**.
2. The theme module `theme.js` is used to modify _only_ Material Design parameters that affect the entire look and feel. This exports a `theme` object that is accessible to all components.
3. Custom theme parameters are added to `theme-derived.js`; these will be part of the `theme` object.

### Styling Explained

This is a rundown of how styling works with themes in Material UI.

1. Styles are **created local** to each component module.
2. Styles are created as a JSS style object consisting of **rules** and **CSS text**.
3. Style rules are created and applied using a mechanism appropriate to the component declaration. Functional components use hooks (e.g. `const useStyles = makeStyles( jssStyles )`), wherease Class components are wrapped with `withStyles(jssStyles)(MyComponent)`. 
    * If `jssStyles` needs access to themes, use `const useStyles = makeStyles( theme => ({ jssStyles }))` with functional components, or `withStyles(jssStyles,{withTheme:true})(MyComponent)` for use with class components.
    * If `jssStyles` also needs to modify its output rules depending on some passed value:
      * functional components with hooks: you can define a rule as a function receiving a single parameter, which it will receive when `const classes = useStyles()` is invoked in a functional component. 
      * class components: instead create two rules like `option` and `option-alt`, and use the `clsx` utility to generate the right classname based on local state. Or use the `styles` prop and override with a computed string.
4. At render time, the `classes` object is retrieved for assignment to components `className`, `classes`, or `style` props. 
    * If you are just adding some customization, use `<MyComponenent className={classes.myrule}>`. Note that using `className` provides _additional_ customization on top of the default component class css. You don't need to provide one if you aren't customizing anything.  
    * If you need to override more, then use `classes` instead: `<MyComponent classes={classes.myrule}>`
    * You can also use `styles` with a regular object to override, perhaps with a custom parameter set in the `theme` object: `<MyComponent style={theme.myglobalrule}>` or `<MyComponent style={{color:theme.palette.primary}>`
5. If you've defined multiple style rules for showing state change (e.g. `item-selected` and `item-not-selected`), you can use the `clsx` module to dynamicaly generate the name based on a computed value and select it accordingly. See [What's the clsx dependency for](https://material-ui.com/getting-started/faq/#whats-the-clsx-dependency-for).

Note that the `classes` object is a *DICTIONARY* that is used to look-up generated class names that the JSS compiler makes from your `jssStyle` object.

### Boilerplate: Functional Components with Hooks

```jsx
import { makeStyles, useTheme } from '@material-ui/core/styles';
const useStyles = makeStyles(theme=>({
  classRule: {
  	cssPropname: 'css value'
	},
  computedClassRule: {
    cssProp: param=>({ /* computed css value using param and theme */ })
  }
});
function Component(props) {
  const param = { /* my parameters */ };
  const classes = useStyles(param);
  const theme = useTheme();
  return (
    <div className={classes.classRule}>
    	<div className={classes.computedClassRule}/>
    </div>
  );
}
export default Component;
```

### Boilerplate: Class Components

```jsx
import { withStyles } from '@material-ui/core/styles';

const styles = theme => {
  classRule: {
  	cssPropname: 'css value'
	},
  /* ??? can we do this? */
  computedClassRule: {
    cssProp: param=>({ /* computed css value using param and theme */ })
  }
};

class Component extends React.Component {
  constructor() {
    this.state = {};
  }
  
 	render () {
    const { classes, theme } = this.props;
  	return (
    	<div className={classes.classRule}>
    		<div className={classes.computedClassRule}/>
    	</div>
  	);
  }
}

export default withStyles(styles,{withTheme:true})(Component);
```

## What's the difference between Container, Grid, and Box???

>
>It's an excellent question:
>
>* The `Container` component is intended to be used as the main layout component. It sets minimum padding on the right and the left side, so your content doesn't touch the edges. At the same time, it horizontal centers your content when the screen is too wide. For instance, a small container width improves readability. https://material-ui.com/components/container/.
>* The `Grid` component handles the layout positioning within a Container. It's a slim abstraction on top of the CSS flexbox model. It has two interesting features: the items spacing and the responsive columns handling. https://material-ui.com/components/grid/
>* The `Box` component is a style toolbox, it's an abstraction for people who like the tailwinds approach. Instead of writing custom CSS, you can use the Box style props. https://material-ui.com/components/box/
>
>You might be confused by <Container /> vs <Grid container />. But make no mistakes, you can't use the two interchangeably. a Grid container, abstracts a flex container. A Container abstracts a page top level element.
>
>What's the difference between Grid and Box? You should be able to replace the Grid usage with the Box. However, the Box is a direct mapping to CSS properties, while the Grid tries to be smarter, with a more abstracted API. The Grid should be the default go to solution. Only consider the Box or custom CSS if it's not the case.
>
>We improve the documentation when moving Container to the core, before the release of v4 stable.
>
>&raquo; [reference](https://spectrum.chat/material-ui/help/grid-vs-box-and-now-vs-container~73cef09f-1eb9-4d0f-a3a3-d46c44232524)

