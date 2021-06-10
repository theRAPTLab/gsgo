## Express Concepts

Builds on the native [`http`](https://nodejs.org/api/http.html) module, which is used as:

```js
const server = http.createServer(opt,listener);
server.listen(port,host,callback);
```

It has these classes:

```
http.Agent
http.ClientRequest
http.Server
http.ServerResponse
http.IncomingMessage
```

Express is a superset of `http`, adding several conveniencs: 

* adds convenience methods for **HTTP protocols** (e.g. GET, POST, etc), that otherwise you'd have to add to the server's listener function.
* handling collections of routes with a **router** object
* adding a way to chain handlers for incoming HTTP messages one-after-the-other through **middleware**. 

