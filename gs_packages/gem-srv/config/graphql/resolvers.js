// note: since we are using buildSchema(), the resolver functions take 3 arguments instead of 4
// as would be with a programmatically-constructed graph.
// (args, context, info) => {} instead of (object, args, context, info)
// args is a key-value dict, context is what contains our DB, info is field-specific schema stuff
// obj is the "parent object" of the query (it could be in another object)
// see stackoverflow.com/questions/55854430

const UR = require('@gemstep/ursys/server');

const TERM = UR.TermOut('RESOLVER', 'TagRed');
const DBG = true;

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
  },
  localeNames: (args, context) => {
    const { DB } = context;
    const coll = DB.getCollection('locales');
    const objs = coll
      .chain() // return full ResultSet
      .data({ removeMeta: true }) // return documents in ResultSet as Array
      .map(i => ({ name: i.name, id: i.id, ptrack: i.track })); // map documents to values
    if (DBG) TERM(`return localeNames: ${JSON.stringify(objs)}`);
    return objs;
  },
  updatePTrack(args, context) {
    const { localeId, input } = args;
    const { DB } = context;
    if (DBG) TERM(`update localeId:${localeId}, input:${JSON.stringify(input)}`);
    const coll = DB.getCollection('locales');
    const locale = coll.findOne({ id: localeId });
    locale.ptrack = { ...locale.ptrack, ...input };
    coll.update(locale);
    return locale.ptrack;
  },
  updatePozyx(args, context) {
    const { localeId, input } = args;
    const { DB } = context;
    if (DBG) TERM(`update localeId:${localeId}, input:${JSON.stringify(input)}`);
    const coll = DB.getCollection('locales');
    const locale = coll.findOne({ id: localeId });
    locale.pozyx = { ...locale.pozyx, ...input };
    coll.update(locale);
    return locale.pozyx;
  },

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  /// PROJECTS

  projects: (args, context) => {
    const { DB } = context;
    const coll = DB.getCollection('projects');
    const objs = coll.chain().data({ removeMeta: true });
    console.error(`return projects: ${JSON.stringify(objs)}`);
    if (DBG) TERM(`return projects: ${JSON.stringify(objs)}`);
    return objs;
  },
  project: (args, context) => {
    const { id } = args;
    const { DB } = context;
    const coll = DB.getCollection('projects');
    const result = coll.findOne({ id });
    console.error(`return project: ${JSON.stringify(result)}`);
    if (DBG) TERM(`return project '${id}': found ${JSON.stringify(result)}`);
    return result;
  },
  projectNames: (args, context) => {
    const { DB } = context;
    const coll = DB.getCollection('projects');
    const objs = coll
      .chain() // return full ResultSet
      .data({ removeMeta: true }) // return documents in ResultSet as Array
      .map(i => ({ label: i.label, id: i.id })); // map documents to values
    console.error(`return projectNames: ${JSON.stringify(objs)}`);
    if (DBG) TERM(`return projectNames: ${JSON.stringify(objs)}`);
    return objs;
  }
};
