/* eslint-disable max-classes-per-file */
/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS System Database Services
  For outward-facing database operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const fse = require('fs-extra');
const path = require('path');
const LOKI = require('lokijs');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { CFG_URDB_GQL } = require('./ur-common');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DB;
let SCHEMA;
const SETTING_RESET_DB = false;
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
/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_PrepareDatabase(importPath) {
  // import only if setting reset, or no collections in db
  if (DB.listCollections().length === 0 && SETTING_RESET_DB) {
    if (importPath === undefined) {
      TERM('error: importPath is undefined');
      return;
    }
    TERM('importing data', importPath);
    const data = fse.readJsonSync(importPath);
    const collections = Object.keys(data);
    collections.forEach(col => {
      const records = data[col];
      if (!Array.isArray(records)) {
        TERM(`... SKIPPING non-array prop '${col}'`);
        return;
      }
      // looks good so import
      if (DB.getCollection(col)) {
        TERM(`... deleting old ${col}s from db`);
        DB.removeCollection(col);
      }
      TERM(`... importing ${records.length} records from '${col}'`);
      const ncol = DB.addCollection(col, { unique: ['id'] });
      records.forEach(r => ncol.insert(r));
      DB.saveDatabase(); // force save
    });
  } else {
    TERM('... skipping DB reset');
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LoadSchema(schemaPath) {
  TERM('LOADING schema', schemaPath);
  try {
    const data = fse.readFileSync(schemaPath, 'utf8');
    SCHEMA = buildSchema(data);
  } catch (err) {
    console.error(err);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Assign URDB middleware to passed app
 *  dbFile: 'runtime/db.loki',
 *  dbImportFile: 'config/init/db-test.json',
 *  schemaFile: 'config/graphql'
 *  @param {Express} app - express app instance
 */
function UseLokiGQL_Middleware(app, options) {
  const { dbFile, dbImportFile, schemaFile, root } = options;
  m_InitializeLoki(dbFile);
  m_PrepareDatabase(dbImportFile);
  m_LoadSchema(schemaFile);
  TERM(`BINDING GraphQL Endpoint ${CFG_URDB_GQL}`);
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
  UseLokiGQL_Middleware
};
