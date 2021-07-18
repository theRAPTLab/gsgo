## Elements of GraphQL

"A GraphQL service is created by defining types and fields on those types, then providing functions for each field on each type."

It is different than REST, which uses URLS and HTTP methods. GraphQL can work with any language and various transports as well as HTTP. GraphQL libraries can provide an **interactive query** interface for human-friendly inspection of the data interaface.

### Schema

A **Schema** defines properties by name. Each property has a **type**. GraphQL has scalar types like `String`, `Float`, `Boolean`,  `Int`, `ID`, and `lists` of those types. Like in Javascript, these primitives can be included as properties in an object-like structure as a type itself similar to a class. In this way you can declare complex types by name and assign them to each named property.

### 

### Schema

A **Schema** defines properties by name. Each property has a **type**. GraphQL has scalar types like `string`, `float`, `int`, `id`, and `lists` of those types. Like in Javascript, these primitives can be included as properties in an object-like structure as a type itself similar to a class. In this way you can declare complex types by name and assign them to each named property.

### Query

A client makes a **Query** via the GraphQL endpoint, accessing the **fields** defined in the **Schema**. The accessible fields are defined in a special type declaration called `Query`, which contains `fields` that lists what can be retrieved. The client receives back a `data` object that contains the requested fields in the same shape as the query.

A **Mutation** is the create/update equivalent of **Query**. It has a corresponding **Input** declaration similar to **Type**, except it is used for arguments instead of results. There are also **enums**, **interfaces**, and **subscriptions** that can be declared in the Scheme

### Resolvers

To map from Query to Schema, **Resolver** functions are declared that do the actual behind-the-scenes fetching/storing of data. 



## Declaring a Schema

This is the language-agnostic **GraphQL schema language**.

#### type declaration and fields

```
type Character {
  name: String!
  appearsIn: [Episode!]!
}
```

The `!` suffix means that the field is **non-nullable**, telling GraphQL that these fields will always return a value of the String type.

#### fields with arguments

```
type Starship {
  id: ID!
  name: String!
  length(unit:LengthUnit = METER): Float
}
```

This is similar to Typescript function signatures. The example above expects that a query of `length` gets a `unit` argument of type LengthUnit, which will default to METER and return a Float

#### query and mutation types

Thse are special types. The schema will always contain `query` and may contain `mutation`, which are the "entry points" into the Schema. They work the same as any other GraphQL object type.

#### enumeration

```
enum Episode {
  NEWHOPE
  EMPIRE
  JEDI
}
```

#### lists

Use `[]` to surround a type, and the `!` for specifying non-nullability of either the list, the elements in the list (or both?)

```
myField: [String!]  # a list that always contains Strings, but list can be null
myField: [Episode]! # a list that might contain null elements, but is always a list
```

#### interface / implements

Similar to Typescript, you can declare an interface that is a bunch of fields that is **implemented** by another type declaration.

```
interface Character {
  id: ID!
  name: String!
  friends: [Character]
}

type Human implements Character {
  id: ID!               <- required from Character interface
  name: String!         <-
  friends: [Character]  <- 
  value: Int!           <- additional field
}
```

#### union

```
union SearchResult = Human | Droid

query search(text:'an') {
  __typename
  ... on Human {
    name
    height
  }
  ... on Droid {
    name
    primaryFunction
  }
}
```

#### inputs

```
input ReviewInput {
  stars: Int!
  commentary: String
}

mutation CreateReviewForEpisode($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    stars
    commentary
  }
}
```

#### aliases

If the same fields query is used with different parameters, you can rename them:

```
{
  empireHero: hero(episode: EMPIRE) {
    name
  }
  jediHero: hero(episode: JEDI) {
    name
  }
}

returns

{
  data: {
    empireHero: {
      name: "Luke Skywalker"
    },
    jediHero: {
      name: "R2-D2"
    }
  }
}
```

#### fragments

These are like object declarations that you can destructure in your query.

```
{
  left: hero(episode:EMPIRE) {
     ...comparisonFields
  }
  right: hero(episode:JEDI) {
     ...comparisonFields
  }
}
fragment comparisonFields on Character {
  name
  appearsIn
  friends {
    name
  }
}
```

#### variables and directives

You can pass a dictionary of variables with the `$` prefix at the top of your query. Directives start with `@` and are `@include(if:Boolean)` an `@skip(if:Boolean)`

```
query MyDamnQuery( $a: String, $b: Boolean ) {   # dictionary of values
  hero(episode: $a) {
    name
    friends @include(if: $b) {
      name
    }  
  }
  
```



## Schema Language

For concepts, see [apollo schema docs](https://www.apollographql.com/docs/apollo-server/schema/schema/) which are better than the official ones as a reference. 

For sample code for `graphql` js library, see [the graphql-js](https://graphql.org/graphql-js/) reference:

### Basic Node Example

```
var express = require('express')
var { graphqlHTTP } = require('express-graphql');
var { graphql, buildSchema } = require('graphql')

// Set up the GraphQL declaration
var schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// provide query resolvers
var root = {
  hello: () => 'Hello World'
}

var query = '{ hello }';
}
// run the query trivially
graphql( schema, query, root ).then(response=>console.log(response));

// AND/OR provide graphql service via express
var app = express()
app.use('/graphql',graphqlHTTP({
  schema,
  rootValue: root,
  graphiql: true
}));
app.listen(4000);

```

### Basic Client Query of GraphQL endpoint

With CURL

```
curl -X POST -H "Content-Type: application/json" -d '{"query":"{ hello }"} http://localhost/4000/graphql
```

from the BROWSER

```
fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSONl.stringify({ query: "{ hello }" {)
 })
 .then(r=>r.json())
 .then(data=>console.log('data returned',data);
```

Using dynamic arguments in the browser

```
var dice = 3;
var query = `query RollDice($dice: Int!) {
  rollDice(numDice: $dice)
}`;
fetch('/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSONl.stringify({ query, variables: { dice })
})
 .then(r=>r.json())
 .then(data=>console.log('data returned',data);
```

### Declaring Schemas with Object Classes

The class methods become fields! In the following we

1. Declare the schema
2. Define the javascript class bits that correspond to what's in the schema (RandomDie)
3. Create the Root Resolver object, using the javascript class bits to do its thing on the implementation

```
// SERVER declares this schema
var schema = buildSchema(`
type RandomDie {
  roll(numRolls: Int!): [Int]
}
 
type Query {
  getDie(numSides: Int): RandomDie
}
`);

// SERVER implements a class called RandomDie, which corresponds
// to the schema Query declaration
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides;
  }
 
  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }
 
  roll({numRolls}) {
    var output = [];
    for (var i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

// SERVER creates the resolvers to invoke the class
// when query is run
var root = {
  getDie: ({numSides}) => {
    return new RandomDie(numSides || 6);
  }
}
```

With **object types**, you can invoke a whole chain of fields one after the other

```
query {
  getDie(numSides: 6) {
    rollOnce
    roll(numRolls: 3)
  }
}
```

### Mutations

```
var schema = buildSchema(`
  type Mutation {
    setMessage(message:String):String
  }
  type Query {
    getMessage:String
  }
`);
const fakeDatabase = {};
var root = {
  setMessage:({message})=>{
    fakeDatabase.message = message
  },
  getMessage: ()=>{
    return fakeDatabase.message
  }
}
```

For more complex input, use **input types**. These are similar to the type declaration but are used only as arguments.

```
input MessageInput {
  content: String
  author: String
}
 
type Message {
  id: ID!
  content: String
  author: String
}
 
type Query {
  getMessage(id: ID!): Message
}
 
type Mutation {
  createMessage(input: MessageInput): Message
  updateMessage(id: ID!, input: MessageInput): Message
}
```





## Middleware

Cool, there is a session manager for express that can be chained-in

```
const session = require('express-session');
const { graphqlHTTP } = require('express-graphql');

const app = express();

app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 } }));

app.use(
  '/graphql',
  graphqlHTTP({
    schema: MySessionAwareGraphQLSchema,
    graphiql: true,
  }),
);
```

