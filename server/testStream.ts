import { createServer } from 'http';
const server = createServer((req, res) => {
  const size = BigInt(1024);
  res.setHeader('Content-Length', size.toString());
  res.end('x'.repeat(1024));
});
server.listen(0, () => {
  const port = (server.address() as any).port;
  fetch(`http://localhost:${port}`).then(r => {
    console.log(r.status, r.headers.get('content-length'));
    server.close();
  });
});
