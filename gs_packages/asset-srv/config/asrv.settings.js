const GS_GLOBALS = require('../../../gsgo-config');

const PACKAGE_NAME = 'ASSET_SRV';
// public path is relative to the gsgo top level
const SERVER_ASSETS_DIRPATH = 'gs_assets_distrib';
const LOCAL_ASSETS_DIRPATH = 'gs_assets';

module.exports = { ...GS_GLOBALS, PACKAGE_NAME, SERVER_ASSETS_DIRPATH };
