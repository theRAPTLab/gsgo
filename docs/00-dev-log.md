SUMMARY [S06 MAR 16-29](00-dev-archives/sprint-06.md)

* Created **monorepo** w/ **lerna** in gsgo
* Added Visual Studio Code essential configuration files to work across all packages in monorepo with Eslint, Typescript, Prettier, AirBnb
* Organized and expanded **docs folder**
* Establish process for managing **monorepo versioning**

SUMMARY [S07 MAR 30-APR 12](00-dev-archives/sprint-07.md)

* Create **GemServer** package with VSCode subworkspace supporting local "npm run local" command and "launch.json" server debugging.
* Figure out **Material UI theming and styling** and its relation to Material Design. **Documented** and created source code examples.
* Figure out **NextJS** and server-side rendering implications.
* Create custom NextJS configuration with best practice **theming and styling**, **stackable  screen-filling components** with **two-level navigation**. Also rudimentary **client-side data persistence**.

SUMMARY S08 APR13-26

* Added ReactMarkdown, URLayout page grid, URWireframe components
* Reviewed Functional Draft, created placeholder components and navigation in GEM_SRV
* System Wireframing with Named Components begins

SUMMARY S09 APR27-MAY10

* in process

---

# 5.0 GEMSTEP WIREFRAMING (CONTINUED)

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

## APR 30.01 Preparing for Simulation Authoring

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

