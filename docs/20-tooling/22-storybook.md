# Storybook

As is typical, the online docs and tutorials do a poor job of explaining what Storybook is. The best way to figure it out is to look at the [Live React Demo](https://storybookjs.netlify.app/official-storybook/) is the fastest way to get a sense of what you might do with it. The following notes are based on my initial impressions of the demo.

## What is it good for?

Storybook is like a visual testing framework for your components. It's implemented as a web application server installed as an npm package in your existing project. 

The key Storybook elements are:

* **the storybook server** - Installed inside your working node app, the server `story.js` files that are located next to your components. For example, if you have  `src/components/MyComponent.jsx`, you can add a  `MyComponent.story.jsx` file next to it. This is just a convention they recommend.
* **the stories** - Each story file exports a default object that describes the **story name**. By additional **named render functions**, you specify different **states** of the component. A state in this case is just an **example** of the component in use. 
* **the storybox ui** - When you run the server from the command line, it generates a nice user interface that allows you to explore the components and various examples you've made by clicking them. 

## Possible GEMSTEP use cases

Since the stories are Javascript, you have flexiblity in creating example use of components mixed with documentation and testing functions.

Uses that I see:

* standalone test cases
* examples of component use
* documenting components

The stories you create don't seem to require having an accompanying component, so you could make arbitrary documentation too. 

With some additional rigor in the naming of states, we can also really try to pre-define **application states** and **state transitions** using working code+text rather than pure text or comments in the source code.