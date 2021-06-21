/* eslint-disable max-classes-per-file */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS System Database Services
  For outward-facing database operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const fse = require('fs-extra');
const path = require('path');
const LOKI = require('lokijs');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');
const { CFG_URDB_GQL } = require('./ur-common');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DB;
let SCHEMA;
const SETTING_RESET_DB = true;
const TERM = require('./util/prompts').makeTerminalOut('  URDB', 'TagRed');

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_InitializeLoki(dbPath = '../runtime/urdb.loki') {
  // if dbPath is a string, then use it to initialize a Loki instance
  // with autosaving enabled
  if (typeof dbPath === 'string' && dbPath.length > 0) {
    TERM('loading', dbPath);
    fse.ensureDirSync(path.dirname(dbPath));
    DB = new LOKI(dbPath, { autosave: true, autoload: true });
  } else {
    TERM('InitializeLoki: dbPath must be string');
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_InitializeData(importPath) {
  if (SETTING_RESET_DB || DB.getCollections().length === 0) {
    TERM('importing data', importPath);
    const data = fse.readJsonSync(importPath);
    const { locales } = data;
    if (Array.isArray(locales)) {
      TERM(`importing ${locales.length} locale(s)`);
      if (DB.getCollection('locales')) {
        TERM('... deleting old locales from db');
        DB.removeCollection('locales');
      }
      const col = DB.addCollection('locales', { unique: ['id'] });
      locales.forEach(locale => {
        TERM(`... writing '${locale.locale}'`);
        col.insert(locale);
      });
    }
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LoadSchema(schemaPath) {
  TERM('loading schema', schemaPath);
  try {
    const data = fse.readFileSync(schemaPath, 'utf8');
    SCHEMA = buildSchema(data);
  } catch (err) {
    console.error(err);
  }
}

/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Assign URDB middleware to passed app
 *  @param {Express} app - express app instance
 */
function UseURDB(app, options) {
  const { dbPath, importPath, schemaPath, root } = options;
  m_InitializeLoki(dbPath);
  m_InitializeData(importPath);
  m_LoadSchema(schemaPath);
  // hook up graphql
  TERM('enabling graphql endpoint:', CFG_URDB_GQL);
  app.use(
    CFG_URDB_GQL,
    graphqlHTTP({
      schema: SCHEMA,
      rootValue: root,
      context: { DB },
      graphiql: true
    })
  );
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  UseURDB
};
