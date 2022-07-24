/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  GEM APP SERVER SETTINGS (GEM) CONFIGURATION

  if you need to override a value here or in gsgo-settings, put them in the
  config/local-settings file. Do not modify this file.

  These settings modules MUST be loadable by both the node and browser
  environments, so do not require modules that do not work cross-environment
  (e.g. filesystem)

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const Path = require('path');
const GSCONFIG = require('../../../gsgo-settings');
const OVERRIDES = require('./local-settings.json');

/// DECLARATIONS //////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const DBG = false;
const PACKAGE_NAME = 'GEM_SRV';
const RUNTIME_DIRNAME = 'runtime';
const RUNTIME_PATH = Path.join(__dirname, `../${RUNTIME_DIRNAME}`);

/// DEFAULTS //////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Put your GEM-SRV related constants here. URLS and default names of things
/// can be defined here canonically. Installations can override the settings
/// using the 'local-settings.json' file, which is created automatically
/// if it doesn't exist. The local-settings.js file is ignored by git, so
/// it can be customized per installation and not overwrite other people's
/// configs

const MQTT_URL = 'localhost'; // override in local-settings.json
const ASSETDIR = 'art-assets'; // override in local-settings.json

/// DEVELOPER QOL /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SKIP_RELOAD_WARNING = false; // allow skip of 'are you sure' reload

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const compositeSettings = {
  ...GSCONFIG,
  // overrides for GEM
  PACKAGE_NAME,
  RUNTIME_DIRNAME,
  ASSETDIR,
  RUNTIME_PATH, // used only by servers
  MQTT_URL,
  SKIP_RELOAD_WARNING,
  // apply overrides from local-settings.json if it exists
  ...OVERRIDES
};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
if (DBG)
  for (let [key, val] of Object.entries(OVERRIDES)) {
    // eslint-disable-next-line no-continue
    if (key === '_INFO') continue;
    if (typeof window === 'undefined')
      console.log(`LOCAL_SET     ${key}: ${val}`);
    else
      console.log(
        `%cLOCAL_SET%c ${key}`,
        'background-color:red;color:white;padding:2px 4px',
        'background-color:inherit;color:red',
        `= ${val}`
      );
  }
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = compositeSettings;
