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

---

# 4. Documentation Cleanup

Reducing documentation verbosity in main dev log, summarizing information, ahead of getting into more systems-oriented work mocking-up the entire system.

## Apr 13.01 - Checking Documentation

Is it on [GEM-STEP Foundation](https://gitlab.com/stepsys/gem-step/gsgo) home page? No. The readme needs updating.

## Apr 14.01 - Checking Docs Part II

Didn't get anything done on Tuesday. Working today on finalizing things to do. I think I'm done with documentation for now and need to switch to something more exciting. But first I'll update:

* [x] clean up this 00-dev-log 
* [x] test pull request
* [x] bump version on test success
* [x] accept

## Apr 16.01 - Inserting Markdown

The MEME project uses `react-markdown`, and its docs don't really list all the options. After perusing the source code I have a better sense of how it accomplishes what it does, and can infer that the syntax I expected will work.

## Apr 17.01 - Page Layout Classes

Laid out the tabbed interface using the page-level components. Made subpage components to allow much easier subdivision.

## Apr 21.01 - Controls and Stubs

Looked at the draft doc and work through it. I created a bunch of tabs and placeholder pages to start working through the specific system elements.  After typing up everything I am realizing just how incomplete the draft design is; I can go to town imagining how this should really work.

## Apr 22.01 - Placeholder Wireframes

I need to review the MUI Basics again. Added to [40-mui-cheatsheet](40-client-tech/40-mui-cheatsheet.md). Started building a very simple expandable component for on-screen annotation of what things do.

## Apr 23.01 - Revisiting System Entities

After starting the deep wireframing, by the end of the day I realized that the functional draft needs a lot of tightening up to be an  implementable design. So, let's work on that. I wrote it up in the IU Google Drive in [02-gemstep-ux](https://drive.google.com/open?id=1DTTEko3dzj2jMVIBqu-YTDs4-qmxDM3m). The first phase was **system entity description**; the next phase is to describe the UI for manipulating those system entities...the actual UX. 

## Apr 23.02 - Defining System Entity UI Elements

Now I'm going to make a list of the entities. First copy them to the COMMON ELEMENTS tab in GEM_SRV wireframe.

## Apr 24.01 - Rough Sketch

>  ***Review the docs I wrote yesterday, and make stand-in components. But first I need write system descriptions.***

Picking up where I left off yesterday, I'm refining my understanding of the needs of the overall system (and documenting it as I go). I've made a rough sketch of what the systems are. On Saturday I will document them and try to make a working screen prototype of all the element areas.

## Apr 26.01 Sunday Sketching

I have a diagram that lists a bunch of things. Let's make those components.

## Apr 27.01 Redoing Page Layout

The functional spec tabs don't make sense to me in a working app, so I'm redoing the flow. SYSTEM SESSIONS MODEL SIM OBSERVE ASSETS

Making new views for the index page.

* renamed all views to page-tabs
* redid all page-tabs to reflect a functional app
* added placeholder WF components to list functions per tab
* renamed blocks to page-blocks