/* eslint-disable max-classes-per-file */
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
let DB;
let SCHEMA;
let ROOT;

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetGraphQL_Middleware(opt) {
  TERM('Initialize called with', JSON.stringify(opt));
  const { dbPath, importPath } = opt;
  const resetDB = false;
  // if dbPath is a string, then use it to initialize a Loki instance
  // with autosaving enabled
  if (typeof dbPath === 'string' && dbPath.length > 0) {
    TERM('loading', dbPath);
    fse.ensureDirSync(path.dirname(dbPath));
    DB = new LOKI(dbPath, { autosave: true, autoload: true });
  }

  // if importPath provided, load it and then clear the existing db,
  // then import the new data by inserting it document by document
  // back into the database so it is fresh on every run (this is
  // for debugging purposes)
  if (resetDB && typeof importPath === 'string' && importPath.length > 0) {
    const data = fse.readJsonSync(importPath);
    const { locales } = data;
    if (Array.isArray(locales)) {
      TERM(`importing ${locales.length} locale(s)`);
      if (DB.getCollection('locales')) {
        TERM('deleting old locales from db');
        DB.removeCollection('locales');
      }
      const col = DB.addCollection('locales', { unique: ['id'] });
      locales.forEach(locale => {
        TERM(`writing '${locale.locale}'`);
        col.insert(locale);
      });
    }
    // import code goes here
  } else {
    // if we got here, then there was no valid importPath specified
    // and the db can't be iniitalized!
    TERM('skipping DB reset. Loading last db set.');
  }

  // create graphql schema
  TERM('specifying schema....');
  SCHEMA = buildSchema(`

  type Query {
    locale (name:String): Locale
    locales: [String!]
  }

  type Mutation {
    updatePTrack (localeId:Int, input:PTrackInput): PTrackData
  }

  type Locale {
    id: Int
    ptrack: PTrackData
  }

  type PTrackData {
    memo: String
    width: Float
    depth: Float
    offx: Float
    offy: Float
    xscale: Float
    yscale: Float
    xrot: Float
    yrot: Float
    zrot: Float
  }

  input LocaleInput {
    ptrack: PTrackInput
  }

  input PTrackInput {
    memo: String
    width: Float
    depth: Float
    offx: Float
    offy: Float
    xscale: Float
    yscale: Float
    xrot: Float
    yrot: Float
    zrot: Float
  }

  `);

  // create graphql root map
  // for LOKI JS query examples: echfort.github.io/LokiJS/tutorial-Query%20Examples.html
  TERM('creating graphql root map');
  ROOT = {
    locale: args => {
      const { name } = args;
      const coll = DB.getCollection('locales');
      const result = coll.findOne({ locale: name });
      TERM(`looking for '${name}', found ${JSON.stringify(result)}`);

      return result;
    },
    locales: () => {
      const coll = DB.getCollection('locales');
      const locales = coll
        .chain() // return full ResultSet
        .data({ removeMeta: true }) // return documents in ResultSet as Array
        .map(i => i.locale); // map documents to values
      return locales;
    },
    updatePTrack(args) {
      const { localeId, input } = args;
      console.log(`localeId:${localeId}, input:${JSON.stringify(input)}`);
      const coll = DB.getCollection('locales');
      const locale = coll.findOne({ id: localeId });
      Object.assign(locale.ptrack, input);
      coll.update(locale);
      return locale.ptrack;
    }
  };

  // hook up graphql
  TERM('enabling graphql endpoint');
  return graphqlHTTP({
    schema: SCHEMA,
    rootValue: ROOT,
    graphiql: true
  });
}

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GetGraphQL_Middleware
};
