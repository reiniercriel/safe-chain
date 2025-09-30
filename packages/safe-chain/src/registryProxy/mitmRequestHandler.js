import https from "https";
import { generateCertForHost } from "./certUtils.js";

export function mitmConnect(req, clientSocket, isAllowed) {
  const { hostname } = new URL(`http://${req.url}`);

  const server = createHttpsServer(hostname, isAllowed);

  // Establish the connection
  clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

  // Hand off the socket to the HTTPS server
  server.emit("connection", clientSocket);
}

function createHttpsServer(hostname, isAllowed) {
  const cert = generateCertForHost(hostname);

  async function handleRequest(req, res) {
    const targetUrl = `https://${hostname}${req.url}`;

    if (!(await isAllowed(targetUrl))) {
      res.writeHead(403, "Forbidden - blocked by safe-chain");
      res.end("Blocked by safe-chain");
      return;
    }

    // Collect request body
    forwardRequest(req, hostname, res);
  }

  return https.createServer(
    {
      key: cert.privateKey,
      cert: cert.certificate,
    },
    handleRequest
  );
}

function forwardRequest(req, hostname, res) {
  const proxyReq = createProxyRequest(hostname, req, res);

  proxyReq.on("error", () => {
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.on("data", (chunk) => {
    proxyReq.write(chunk);
  });

  req.on("end", () => {
    proxyReq.end();
  });
}

function createProxyRequest(hostname, req, res) {
  const options = {
    hostname: hostname,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers },
  };

  delete options.headers.host;

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  return proxyReq;
}
