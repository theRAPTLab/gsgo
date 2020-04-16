# Adding Pages to Navigation Menu

There are two steps.

## 1. Create the route

Any file added to the `src/pages` directory will become a routed path. NextJS will load the server-side rendered file and display it. The filename *is* the route. 

* You can make nested routes by creating subdirectories.
* You can capture route parameters by using brackets in the filename to capture them. In NextJS this is called [dynamic routing](https://nextjs.org/docs/routing/dynamic-routes).

Once you create the file and start up the NextJS server, you can automatically browse to it! See the template `exPage.jsx` for an example file you can use as a route.

IMPORTANT: Each page is rendered on the server and does NOT share any state with other loaded pages. In other words, you can not declare a global variable in one page and access it in another. There are easy workarounds but that is a different subject.

## 2. Add the route to the Navigation Menu

Once you've added a few routes to the `src/pages` directory, you'll note that these do not appear automatically in the navigation menu. The example `exPage.jsx` merely includes the `<URSiteNav/>` component, so how does it know?

The answer: the special `site-config.js` file holds a `NAVMENU` array that defines the label and destination route. Edit this file to change the navigation across the entire site.

