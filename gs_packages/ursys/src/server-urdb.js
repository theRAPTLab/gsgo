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
/** imports a database if an importPath is provided and the existing database
 *  has no collections. If option.doReset is true, then all the collections
 *  are removed and if the import file exists it's imported
 */
function m_PrepareDatabase(importPath, opt = { doReset: false }) {
  // import only if setting reset, or no collections in db
  const { doReset } = opt;
  if (doReset) {
    const cnames = DB.listCollections().map(o => o.name);
    TERM(`resetting DB by removing ${cnames.length} collections`);
    cnames.forEach(col => DB.removeCollection(col));
  }
  if (DB.listCollections().length === 0) {
    if (importPath !== undefined) {
      TERM(`importing data from '${importPath}'`);
      const data = fse.readJsonSync(importPath);
      const datakeys = Object.keys(data);
      // if json file has a key that's in an existing collection, rewrite that
      // collection with its contents (must be an array of doc objs)
      datakeys.forEach(col => {
        const records = data[col];
        if (!Array.isArray(records)) {
          TERM(`... SKIPPING non-array prop '${col}'`);
          return;
        }
        // if this an existing collection already? then delete it
        if (DB.getCollection(col)) {
          TERM(`... deleting old ${col}s from db`);
          DB.removeCollection(col);
        }
        // create new collection and insert imported collection
        TERM(`... importing collection '${col}' (${records.length} records)`);
        const ncol = DB.addCollection(col, { unique: ['id'] });
        records.forEach(r => ncol.insert(r));
      });
      DB.saveDatabase(); // force save
    } else {
      // importPath undefined
      TERM('... WARNING: DB cleared');
    }
  } else {
    //
    TERM('... DB reloaded');
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
  const { dbFile, dbImportFile, schemaFile, root, doReset } = options;
  m_InitializeLoki(dbFile);
  m_PrepareDatabase(dbImportFile, { doReset });
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
