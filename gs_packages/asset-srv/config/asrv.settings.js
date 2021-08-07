const GS_GLOBALS = require('../../../gsgo-config');

const PACKAGE_NAME = 'ASSET_SRV';
// public path is relative to the gsgo top level
const PUBLIC_RESOURCES_PATH = 'gs_assets';

module.exports = { ...GS_GLOBALS, PACKAGE_NAME, PUBLIC_RESOURCES_PATH };
