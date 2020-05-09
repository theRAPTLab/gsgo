export default function handler(req, res) {
  // req.body
  // req.query
  // req.cookies
  res.json({
    uaddr: 'SVR_01',
    host: 'localhost',
    port: 3000
  });
}
