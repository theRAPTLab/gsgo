/*//////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  URSYS System Database Services
  For outward-facing database operations

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * //////////////////////////////////////*/

///	LOAD LIBRARIES ////////////////////////////////////////////////////////////
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GQL_HTTP = require('express-graphql');
const GQL = require('graphql');
const LOKI = require('lokijs');
const COMMON = require('./ur-common');
const TERM = require('./util/prompts').makeTerminalOut('  URDB', 'TagRed');

/// DEBUG MESSAGES ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// const DBG = false;
TERM('*** loaded server-db');

/// TEST STUFF ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// make a cheese db
const db = new LOKI('loki.json');
const objs = db.addCollection('country', { unique: ['id'] });
objs.insert({ id: 'gb', name: 'United Kingdon' });

/// make a cheese query
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLString,
  GraphQLInt
} = GQL;

const { graphqlHTTP } = GQL_HTTP;

const dateFormatEnum = new GraphQLEnumType({
  name: 'DateFormat',
  description: 'The date formats available',
  values: {
    'UTC': {
      // The value you see in graphiql when selecting the date of birth format
      value: 'UTC', // The value you see when processing the graphql query (see: line 73 of person.js)
      description: 'UTC Format'
    },
    'ISO': {
      value: 'ISOString',
      description: 'ISO Format'
    },
    'Locale': {
      value: 'LocaleString',
      description: 'Locale Format'
    },
    'DateString': {
      value: 'DateString',
      description: 'DateString Format'
    }
  }
});

const PersonType = new GraphQLObjectType({
  name: 'Person',
  description: 'A person object',
  fields: () => ({
    id: {
      type: GraphQLInt,
      description: 'The persons id'
      // Note that there is no resolve function for this field.
      // If the field is named the same as the field in the data no resolve function is required.
    },
    firstName: {
      type: GraphQLString,
      description: 'The persons first name'
    },
    lastName: {
      type: GraphQLString,
      description: 'The persons last name'
    },

    // Note that the fullname field does not exist in the person database table (personDB.js).
    // This is a calulated field using the firstName and lastName fields
    fullName: {
      type: GraphQLString,
      description: 'The persons full name',

      // Use the resolve function to concatenate the firstName and lastName fields
      resolve: person => `${person.firstName} ${person.lastName}`
    },
    gender: {
      type: GraphQLString,
      description: 'The persons gender',

      // The resolve function is used to change the one character gender field to the full word (Male or Female)
      resolve: person => (person.gender === 'm' ? 'Male' : 'Female')
    },
    dateOfBirth: {
      type: GraphQLString,
      description: 'The date the person was born',

      // This field can receive an argument (parameter) called format.
      // The value of the argument is limited to the dateFormatEnum type.
      // Possible values are: UTC, ISO, Locale or DateString
      args: {
        format: { type: dateFormatEnum }
      },

      // The resolve function picks up the format argument using the second function parameter
      // To get the args value you can either:
      //  - destructure the args object (as seen below)
      //  - select directly from the args object (as seen in the friends resolve function below)
      resolve: function resolve(person, { format }) {
        let date = new Date(person.dateOfBirth);

        // Note that the string passed to the format argument is the value field from the dateFormatEnum
        switch (format) {
          case 'ISOString':
            date = date.toISOString();
            break;
          case 'DateString':
            date = date.toDateString();
            break;
          case 'LocaleString':
            date = date.toLocaleDateString();
            break;
          default:
            // Default case returns the UTC value as a string
            date = date.valueOf();
        }

        return date;
      }
    },
    friends: {
      type: new GraphQLList(PersonType), // The friends field returns a list of PersonType objects
      description: 'The persons friends',

      // This field can receive an argument (parameter) called top.
      // The value of the argument is an integer.
      args: {
        top: { type: GraphQLInt }
      },

      // Note that the resolve function uses the database connection that was passed through the conext object.
      // The top argument is used to limit the number of friends that get returned.
      // If the top argument is not used then no limit is put on the number of friends that get returned.
      resolve: (person, args, context) =>
        context.db.person
          .chain()
          .find({ id: { '$in': person.friends } })
          .limit(args.top)
          .data()
    }
  })
});

// Define the root Query Type Schema. Called from server.js
const queryType = new GraphQLObjectType({
  name: 'Query',

  // The fields in the root query type will be the queries that you can call from the graphql api.
  // In this example you can call a person query and a people query
  fields: {
    person: {
      // The person query uses the Person type to build it's response
      type: PersonType,

      // The args object describes the arguments that the person query accepts
      args: {
        id: { type: GraphQLInt }
      },

      // The resolve function has three parameters. See also: http://graphql.org/learn/execution/#root-fields-resolvers
      // 1- The parent object
      //    - An object which was passed from the parent types resolve function.
      //      - for the root query types this will be 'undefined' as there has been no other 'parent' object.
      //      - for subsequent types this will be the resolved object from the type that called it.
      //        - eg. The 'person' query resolves to a Person type. The Person type will receive the result of the parent queries resolve function (see below).
      // 2- The argument object (as described above)
      //    - for the person query there is only one argument in the args object, id.
      // 3- The context object
      //    - for the root query type it receives it's context from the express-graphql module in server.js which, by default, is the HTTP request.
      //    - in this example the database connection gets passed through.
      resolve: (parentObject, { id }, context) => context.db.person.by('id', id)
    },

    people: {
      // The people query also uses the Person type to build it's response but returns a list (array) of Person types.
      type: new GraphQLList(PersonType),

      // The lastName arg is wrapped in the GraphQLNonNull type which enforces that the containing type is never null and throws an error if it is.
      // You could also check the value of the argument in the resolve function and then manually throw an error.
      // eg. return new Error("A 'lastName' variable is required");
      args: {
        lastName: { type: new GraphQLNonNull(GraphQLString) }
      },

      // Like the above field this query doesn't receive any parent object but needs access to the subsequent parameters.
      // This time I've used an underscore to denote that no parent object is expected.
      resolve: function resolvePeople(_, { lastName }, context) {
        return context.db.person.find({ 'lastName': { '$contains': lastName } });
      }
    }
  }
});

const querySchema = new GraphQLSchema({ query: queryType });

/// API METHODS ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const GraphQL_Middleware = graphqlHTTP({
  schema: querySchema,
  context: { db },
  graphiql: true
});

/// EXPORT MODULE DEFINITION //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
module.exports = {
  GraphQL_Middleware
};
