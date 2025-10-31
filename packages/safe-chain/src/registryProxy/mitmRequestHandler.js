import https from "https";
import { generateCertForHost } from "./certUtils.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ui } from "../environment/userInteraction.js";

export function mitmConnect(req, clientSocket, isAllowed) {
  const { hostname } = new URL(`http://${req.url}`);

  clientSocket.on("error", () => {
    // NO-OP
    // This can happen if the client TCP socket sends RST instead of FIN.
    // Not subscribing to 'close' event will cause node to throw and crash.
  });

  const server = createHttpsServer(hostname, isAllowed);

  // Establish the connection
  clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

  // Hand off the socket to the HTTPS server
  server.emit("connection", clientSocket);
}

function createHttpsServer(hostname, isAllowed) {
  const cert = generateCertForHost(hostname);

  async function handleRequest(req, res) {
    const pathAndQuery = getRequestPathAndQuery(req.url);
    const targetUrl = `https://${hostname}${pathAndQuery}`;

    if (!(await isAllowed(targetUrl))) {
      res.writeHead(403, "Forbidden - blocked by safe-chain");
      res.end("Blocked by safe-chain");
      return;
    }

    // Collect request body
    forwardRequest(req, hostname, res);
  }

  const server = https.createServer(
    {
      key: cert.privateKey,
      cert: cert.certificate,
    },
    handleRequest
  );

  server.on("error", (err) => {
    ui.writeError(`Safe-chain: HTTPS server error: ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway");
    } else if (res.writable) {
      res.destroy();
    }
  });

  return server;
}

function getRequestPathAndQuery(url) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
  }
  return url;
}

function forwardRequest(req, hostname, res) {
  const proxyReq = createProxyRequest(hostname, req, res);

  proxyReq.on("error", () => {
    res.writeHead(502);
    res.end("Bad Gateway");
  });

  req.on("error", (err) => {
    ui.writeError(`Safe-chain: Error reading client request: ${err.message}`);
    proxyReq.destroy();
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

  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (httpsProxy) {
    options.agent = new HttpsProxyAgent(httpsProxy);
  }

  const proxyReq = https.request(options, (proxyRes) => {
    proxyRes.on("error", (err) => {
      ui.writeError(
        `Safe-chain: Error reading upstream response: ${err.message}`
      );
      if (!res.headersSent) {
        res.writeHead(502);
        res.end("Bad Gateway");
      }
    });

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  return proxyReq;
}
