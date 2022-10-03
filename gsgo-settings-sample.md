server related
/gsgo                   GS_DIRPATH          ->  GSGO_ROOT
http://localhost:80     GS_ASSET_HOST_URL   ->  APPSERVER_HOST_URL
/gsgo/gs_assets         GS_ASSETS_PATH      ->  APPSERVER_DOCROOT
/gsgo/gs_assets_hosted  GS_ASSETS_HOST_PATH -> ASSETSERVER_DOCROOT

GS_DIRPATH        // current directory of gsgo
  GS_ASSETS_HOST_PATH  // add 'gs_assets_hosted'  assetserver (not same as appserver)
  GS_ASSETS_PATH // add 'gs_assets' the appserver assets directory
  GS_ASSETS_DEV_ROOT // intended to be a root directory

client doesn't need to know about this
client needs to know are URLs...which means 'routes'
any project directory is a route

dirpath = directory
filepath = directory ending with a filename.ext

base url = url to talk to appserver apps
asset url = url to retrieve files from the project directory
app route = url to a specific GEMSTEP app localhost/app/main
asset route = url to a specific project
asset url = url to a specific file in the route?

server directories for appserver assets
url base route for appserver assets

server directories for assetserver assets (backup for appserver)
url relative route to appserver assets for PROJECT diretory

within context of GS_ASSETS
  GS_ASSETS_PROJECT_ROOT // 'local', the current project folder within an assets folder
  GS_ASSETS_ROUTE // 'assets', the route from which the ASSETS folder is delivered

  GS_MANIFEST_FILENAME '00-manifest'
  GS_PROJFILE_EXTENSION,

  GS_ASSET_HOST_URL, 'http://localhost:80'
  GS_APP_PORT,

/gs_assets/local/ <-- that's not a project
/gs_assets/local/projects/moth.gemprj <-- this IS a project

* "materials" is too generic -- it does not imply a particular set/collection of stuff that is differentiated from another set/collection
* "playground" might fit. It is a space that has a bunch of stuff in it with which you can do a number of activities; the space and what's in it is the constraint for the activities. A box full of toys and some projects to go with it; when you leave it and come back, it's the way you left it.
* "space" would be the generic name of it
* "playground_id"
* "playspace_id"



however, the MAIN CLIENT is different...it needs to SELECT which 'project folder' will be used, which determines what assets are available to the simulation and student scripters.
Currently, this selection is provided as a hardcoded value in `gsgo-settings` that can be overridden by `gem-settings` and locally override through `local-settings` which isn't saved to the repo like the others.

**Developer needs a different asset route than `assets` to keep it separate**
* server can already add it easily through the URSYS middleware
* clients though don't know about it
* project loader doesn't know about it

* 'root directories' are htdoc directories served by Express.static middleware '/'
* 'route' is the part of the URL after the domain:port for a particular top-level service

PROJECTS
COLLECTION
ASSET SET
SET

UNIT - like a class unit? but it has specific connotations to content or content template, but what we're talking about a collection projects someone has created. This is in a textbook.

MATERIALS

"Giant folder of stuff of student work" (all file based)
- anything served or saved
* `sprites` assets - which are media that the software may display, images, whatever
* `projects`
  * template projects - what new student projects are based on
  * demo projects - pre-made
  * student projects - these are
* `settings`

"WORKING SET OF FILES" which has everything that (1) the appserver needs to show any media-based display stuff (2) provide a set of selectable "projects" to load andrun (3) save student progress on scripts (4) load app configuration settings specific to this working set

Example contexts
* A teacher is preparing for a classroom session with GEMSTEP, and is assembling everything into a folder that should be automatically loaded as soon as the app runs from the sever.


## BOOTSTRAP

appserver runs
.. Express.static('/assets', asset_directory)
.. URNET Start on configured port
.. URNET NetInfo provisioned for all connecting apps
   broker: host, port, uaddr
   client: ip address
   urdb: graphQL
.. APPSERVER ready to serve 'app', which is `web-index.js` which loads `SystemInit.jsx`

client connects
.. loads the packed version of the webapp, which starts with SystemInit.Init()
.. UR.SystemStart() - starts the lifecycle control
.. UR.SystemNetBoot() - establish URSYS connection
.. eventually SystemShell loads one of the page apps
.. URSYS MESSAGING is available
.. URDB is available

for client MAIN:
.. it has to know what "working file set" to load up to show available templates
.. does it need to know about devices?
.. networking through URNET to any other apps connected to the server

run client app 'viewer' - they talk to main to receive project information
run client app 'script editor'
run client app 'char controller'


* local-settings -- MQTT server
* locale -- pozyx transforms, ptrack transforms,

Unique Identifier String for a particular running session in a classroom consists of:

**current_server** establishes a single shared application context through URNET and through whatever static assets and database services are provided
- file system of the server
- database shared across all instances, only server operations that need updating through a client API (e.g. tracker, pozyx transforms)

What we're currently calling **projects** are in a particular directory in the 'assets' route provided by the server. This contains all the stuff needed for a particular simulation

A gemprj file defines a single simulation, containing:
  blueprints, 'project meta information', instance lists, round scripts
  references sprite assets that are in its sibbling folder 'sprites'
  multiple gemprj files can reuse the sprites

A bunch of gemprj files contains of related simulation, but are part of a class room implementing
_template.gemprj is a starting point for a project, defines the agents and round scripts. simulation entities and simulation runtime logic.


