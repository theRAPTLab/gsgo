// note: since we are using buildSchema(), the resolver functions take 3 arguments instead of 4
// as would be with a programmatically-constructed graph.
// (args, context, info) => {} instead of (object, args, context, info)
// args is a key-value dict, context is what contains our DB, info is field-specific schema stuff
// obj is the "parent object" of the query (it could be in another object)
// see stackoverflow.com/questions/55854430
const DBG = false;

module.exports = {
  locale: (args, context) => {
    const { name } = args;
    const { DB } = context;
    const coll = DB.getCollection('locales');
    const result = coll.findOne({ locale: name });
    if (DBG)
      console.log(`looking for '${name}', found ${JSON.stringify(result)}`);
    return result;
  },
  locales: (args, context) => {
    const { DB } = context;
    const coll = DB.getCollection('locales');
    const locales = coll
      .chain() // return full ResultSet
      .data({ removeMeta: true }) // return documents in ResultSet as Array
      .map(i => ({ name: i.name, id: i.id })); // map documents to values
    console.log(locales);
    return locales;
  },
  updatePTrack(args, context) {
    const { localeId, input } = args;
    const { DB } = context;
    if (DBG) console.log(`localeId:${localeId}, input:${JSON.stringify(input)}`);
    const coll = DB.getCollection('locales');
    const locale = coll.findOne({ id: localeId });
    Object.assign(locale.ptrack, input);
    coll.update(locale);
    return locale.ptrack;
  }
};
