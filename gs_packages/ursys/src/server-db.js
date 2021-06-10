/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS System Database Services
  For outward-facing database operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

const { graphqlHTTP } = require('express-graphql');
const { graphql, buildSchema } = require('graphql');
const LOKI = require('lokijs');
const TERM = require('./util/prompts').makeTerminalOut('  URDB', 'TagRed');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let DB;
let SCHEMA;
let RESOLVERS;

/// TEST STUFF ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestCreateDB() {
  /// make a cheese db
  DB = new LOKI('loki.json');
  const countries = DB.addCollection('country', { unique: ['id'] });
  countries.insert({ id: 'gb', name: 'United Kingdon' });
  countries.insert({ id: 'tw', name: 'Taiwan' });
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function TestDefineGraph() {
  /// make a cheese schema using GraphQL Type Language
  SCHEMA = buildSchema(`
  type Query {
    hello: String
    countries: [String]
  }
  `);
  /// make cheese resolver
  RESOLVERS = {
    hello: () => 'Hello World',
    countries: (args, context) => {
      const countries = context.DB.getCollection('country');
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
  const response = await graphql(SCHEMA, query, RESOLVERS);
  TERM('query test results', response);
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
  schema: SCHEMA,
  rootValue: RESOLVERS,
  context: { DB },
  graphiql: true
});

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GraphQL_Middleware
};
