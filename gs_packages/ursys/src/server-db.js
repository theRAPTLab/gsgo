/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS System Database Services
  For outward-facing database operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const fse = require('fs-extra');
const path = require('path');
const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');
const LOKI = require('lokijs');
const TERM = require('./util/prompts').makeTerminalOut('  URDB', 'TagRed');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let TEST_DB;
let TEST_SCHEMA;
let TEST_ROOT;

/// API METhODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DB;
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Initialize(opt) {
  TERM('Initialize called with', JSON.stringify(opt));
  const { dbPath = 'unnamed.loki', importPath } = opt;
  if (typeof importPath === 'string' && importPath.length > 0) {
    const data = fse.readJsonSync(importPath);
    TERM('import data', data);
  }
  TERM('loading', dbPath);
  fse.ensureDirSync(path.dirname(dbPath));
  DB = new LOKI(dbPath, { autosave: true, autoload: true });
  DB.saveDatabase(err => {
    if (err) TERM(err);
    else TERM('saved');
  });
}

/// TEST STUFF ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCreateDB() {
  /// make a cheese db
  TEST_DB = new LOKI('loki.json');
  const countries = TEST_DB.addCollection('country', { unique: ['id'] });
  countries.insert({ id: 'gb', name: 'United Kingdon' });
  countries.insert({ id: 'tw', name: 'Taiwan' });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestDefineGraph() {
  /// make a cheese schema using GraphQL Type Language
  TEST_SCHEMA = buildSchema(`
  type Query {
    hello: String
    countries: [String]
  }
  `);
  /// make cheese resolver
  TEST_ROOT = {
    hello: () => 'Hello World',
    countries: () => {
      const countries = TEST_DB.getCollection('country');
      const names = countries
        .chain() // return full ResultSet
        .data({ removeMeta: true }) // return documents in ResultSet as Array
        .map(i => i.name); // map documents to values
      return names;
    }
  };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
async function TestQuery() {
  /// make cheese query
  const query = '{ hello countries }';
  const response = await graphql(TEST_SCHEMA, query, TEST_ROOT);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
TestCreateDB();
TestDefineGraph();
TestQuery();

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MIDDLEWARE ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** Define the express-graphql handler for a graphql endpoint. To use,
 *  app.use('/path/to/graphql',GraphQL_Middleware)
 */
const GraphQL_Middleware = graphqlHTTP({
  schema: TEST_SCHEMA,
  rootValue: TEST_ROOT,
  context: { DB: TEST_DB },
  graphiql: true
});

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GraphQL_Middleware,
  Initialize
};
