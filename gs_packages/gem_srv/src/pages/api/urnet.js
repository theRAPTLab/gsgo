/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  urnet returns a directory of all devices on the UR Network. At minimum, there
  is a single "broker" property, which client webapps connecting to the server
  can use to discover available services.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

const URSERVER = require('@gemstep/ursys/server');

export default function handler(req, res) {
  // req.body
  // req.query
  // req.cookies
  let client_ip;
  const { host_ip, port, urnet_version, uaddr } = URSERVER.GetNetBroker();
  if (req.method === 'get') {
    client_ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    if (client_ip.substr(0, 7) === '::ffff:') {
      client_ip = client_ip.substr(7);
    }
  }
  res.json({
    broker: {
      host_ip,
      port,
      urnet_version,
      uaddr
    },
    client: {
      client_ip
    }
  });
}
