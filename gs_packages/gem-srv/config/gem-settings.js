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

const MQTT_URL = 'localhost';

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  ...GSCONFIG,
  // overrides for GEM
  PACKAGE_NAME,
  RUNTIME_DIRNAME,
  RUNTIME_PATH, // used only by servers
  MQTT_URL,
  // overrides from local-settings.json
  ...OVERRIDES
};
