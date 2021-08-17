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
const TERM = require('./util/prompts').makeTerminalOut('URDB');

let DB;
let SCHEMA;
const AS_INTERVAL = 5000;

/// HELPER METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** imports a database if an importPath is provided and the existing database
 *  has no collections. If option.doReset is true, then all the collections
 *  are removed and if the import file exists it's imported
 */
function m_PrepareDatabase(importPath, opt = { doReset: false }) {
  // import only if setting reset, or no collections in db
  if (DB.listCollections().length === 0 && importPath === undefined) {
    TERM('WARNING: new database requires importPath for initial collections');
    return;
  }
  const { doReset } = opt;
  if (doReset && importPath === undefined) {
    TERM(
      'WARNING: to reset database, provide importPath for collections to load'
    );
    return;
  }
  // actually import data if doReset is set or there are no collections
  if (doReset || DB.listCollections().length === 0) {
    TERM('doReset:', doReset);
    if (doReset) TERM('existing collections:', DB.listCollections.length);
    TERM('... initializing database from default data');
    // erase collections
    const cnames = DB.listCollections().map(o => o.name);
    TERM(`... removing ${cnames.length} collections`);
    cnames.forEach(col => DB.removeCollection(col));

    TERM(`... importing from '${importPath}'`);
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
      // create new collection and insert imported collection
      TERM(`... importing collection '${col}' (${records.length} records)`);
      const ncol = DB.addCollection(col, { unique: ['id'] });
      records.forEach(r => ncol.insert(r));
    });
    DB.saveDatabase();
    TERM('... lokidb initialized w/', DB.listCollections().length, 'collections');
  } else {
    TERM('... lokidb loaded w/', DB.listCollections().length, 'collections');
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function m_LoadSchema(schemaPath) {
  TERM('... loaded schema', schemaPath);
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
  TERM('Starting Database Server [async]');
  if (typeof dbFile === 'string' && dbFile.length > 0) {
    TERM('... loading', dbFile);
    fse.ensureDirSync(path.dirname(dbFile));
    DB = new LOKI(dbFile, {
      autosave: true,
      autosaveInterval: 5000,
      autosaveCallback: () => {
        const int = (AS_INTERVAL / 1000).toFixed(1);
        TERM(`Autosaved database (interval is ${int}s)`);
      },
      autoload: true,
      autoloadCallback: () => {
        m_PrepareDatabase(dbImportFile, { doReset });
        m_LoadSchema(schemaFile);
        TERM(`... bound GraphQL Endpoint ${CFG_URDB_GQL}`);
        app.use(
          CFG_URDB_GQL,
          graphqlHTTP({
            schema: SCHEMA,
            rootValue: root,
            context: { DB },
            graphiql: true
          })
        );
        TERM('Database Server ready');
      }
    });
  } else {
    TERM('InitializeLoki: dbPath must be string');
  }
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  UseLokiGQL_Middleware
};
