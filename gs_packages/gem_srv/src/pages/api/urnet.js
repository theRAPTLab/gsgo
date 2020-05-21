/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  urnet returns a directory of all devices on the UR Network. At minimum, there
  is a single "broker" property, which client webapps connecting to the server
  can use to discover available services.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

export default function handler(req, res) {
  // req.body
  // req.query
  // req.cookies
  res.json({
    broker: {
      host: 'localhost',
      port: '2929',
      urnet_version: '3',
      urnet_addr: 'SVR_01'
    }
  });
}
