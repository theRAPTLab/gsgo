## Configuring the Database

Our database is still handled with LokiJS with file persistence, as this is an easy solution that doesn't require installing an additional database server. However, the way of accessing data is new, using the `ExpressGraphQL` package.

The GraphQL setup is part of URSYS/SERVER, and is added by using our custom middleware function to an instance of `Express`.
```js
const Express = require('express')
const { UseLokiGQL_Middleware } = require('@gemstep/ursys/server');

// create Express instance
const app = Express();
//
UseLokiGQL_Middleware(app, {
  dbFile: 'runtime/db.loki',
  dbImportFile: 'config/graphql/dbinit-loki.json',
  doReset: true,
  schemaFile: 'config/graphql/schema.graphql',
  root: resolvers
});
```
The file paths are relative to the file that contains the above code. In GEMSTEP, this file is `gem-app-srv.js`.

#### database organization

LokiJS is a NoSQL database, working on "collections" of "document objects". For this current database, we have a collection called "locales" that contains the relevant objects. You can see exactly what collections are being created by looking at the `config/graphql/dbinit-loki.json` file that is used to populate a new LokiJS database file. Edit this file as needed, and use the `dbReset` flag if you want to overwrite the old database.

Here's the example JSON data used to create the "locations" collections in Loki.
```json
{
  "locales": [
    {
      "id": 0,
      "name": "Default Locale"
    },
    {
      "id": 2,
      "name": "Vandebilt Tracker"
    },
    {
      "id": 3,
      "name": "IU Tracker"
    }
  ]
}
```
#### database access

Instead of writing socket-based code on the server, we are using ExpressGraphQL to instead **define a schema** that describes the API for requesting data. For GEMSTEP, we are using the Schema Description Language (SDL) to define the API. The language defines data types (numbers, ints, booleans, string, and collections of them) and methods to read/modify that data. It is a language that requires very explicit definition, but once you have done it you can request just the data you need in any combination. Adding new access methods just means updating the schema file. 

Here is a simple example that defines a **Query** (a reserved type for reading data) with two methods `locale` and `locales`:
```graphql
"""
note that this "Query" what can be queried as the 
definition schema. Requesting data is done using
a similar syntax (see next section)
"""
type Query {
  locale(id: Int!): Locale
  locales: [Locale]!
}
type Locale {
  id: Int!
  name: String!
}
```

The GraphQL code maps methods you've defined **resolver functions** to handle. They are named the same as what you see in the `type Query` above. Our resolvers are defined in the `root` parameter of the setup code, referring to a javascript module that exports an object that looks like this:

```js
module.exports = {
  locale: (args, context) => {
    const { id } = args;
    const { DB } = context;
    const coll = DB.getCollection('locales');
    const result = coll.findOne({ id });
    if (DBG) TERM(`return locale '${id}': found ${JSON.stringify(result)}`);
    return result;
  },
  locales: (args, context) => {
    const { DB } = context;
    const coll = DB.getCollection('locales');
    const objs = coll.chain().data({ removeMeta: true });
    if (DBG) TERM(`return locales: ${JSON.stringify(objs)}`);
    return objs;
  }
}
```
The `DB` instance is the LokiJS object, so this code can manipulate the database and return the results. Our server code injects the DB object into the `context` parameter; it is possible to add other code objects as needed.

The `args` parameter contains any passed parameters like `id` for the `locale(id)` method. This can be used directly in the resolver function.

#### interactive database access

GraphQL also provides an **interactive query interface** called `graphIQL` where you can test your code to figure out what queries to write and what results you'll receive. Currently, the GraphIQL is located at `http://localhost/urnet/urdb`. You can find tutorials on the internet, or look at examples `gem-srv/config/graphql/schema-examples.graphql` to get an idea of how it works.

## Querying the Database from the Client

There is a single call `UR.Query(queryString,variables)` that initiates a query to the GraphQL server and returns a **Promise** that resolves into a **response** object. If there is valid data, it will be in the `data` prop. If there was an error, there will only be a `errors` prop. The `UR.Query()` code will attempt to decode the error output and display it in the console.

Queries are written in the same language as schemas, and are provided as `queryString`. You can specify **variables** inyour query like `$varvar` and provides an object that looks like `{ varvar: 0 }` so you can do programmatic queries.

This sample code doesn't use parameters. Sample code:
```js
// note: whitespace actually doesn't matter in SDL
const qs = `
  query { 
    locales { 
      name 
    }
  }
`;

UR.Query(qs)
.then( response => {
  if (response.data) console.log('success',response.data);
  if (response.errors) console.log('errors',response.errors);
  return response.data;
  // you can chain 'then()' to pass down
})
.then( data=> {
  // data will contain an array of objects { name }
});
```
It's important to note that while the `Locale` type includes `{ name, id, memo }`, we can **choose what we want** in our call and pick a subset. Here, we've just requested `name` so that's all we get.

For a look at **writing data** with **mutations** and more examples, see `modules/appcore/ac-locales.js` for more examples.



## Current Limitations

As of July 12, 2021 we still need to add **authentication** and **access control** on top of all our systems (including database).

