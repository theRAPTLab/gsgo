## URSYS DB SERVICES

currently the setup looks like this:

* for servers that need to access a system-wide database, an Express app can create GraphQL endpoints through middleware returned from URSYS.

**`UR.GetGraphcQL_Middleware(opt)`** is part of `@gemstep/ursys/server` , where `opt` is

* `dbPath` - path to where loki file should be, relative to the calling module's path.
* `importPath` - path to JSON file that is used to populate the system database

This function does:

* creates a Loki file on disk based on the `dbPath` provided. Include the `.loki` file extension.
* optionally imports data from `importPath`, resetting the current database.
* returns the graphql-http middleware bound to the default schema, root, and context

The general idea is that the AppServer is also its own GraphQL endpoint, and this endpoint should be provided by `UR.NetInfo` on application load. 

## Assumptions

The AppServer for a particular suite of activities might provide its own local database, or connect to a network-wide one hosted on a completely different server. We would call this server `GemSystemDB` and `GemSystemFile` and it would have to understand user **authentication** and **authorization** as it pertains to a particular user type within a particular context. We go from the highest level to the more granualar level.

locale doesn't begin to cover it.

## ToDo

* [ ] the query, root, and context are hardcoded right now. where should they ultimately be set?
* [ ] Need to implement DB as a system thing later.