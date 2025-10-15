import * as http from "http";
import * as https from "https";

export function handleHttpProxyRequest(req, res) {
  const url = new URL(req.url);

  let protocol;
  if (url.protocol === "http:") {
    protocol = http;
  } else if (url.protocol === "https:") {
    protocol = https;
  } else {
    res.writeHead(502);
    res.end(`Bad Gateway: Unsupported protocol ${url.protocol}`);
    return;
  }

  const proxyRequest = protocol
    .request(
      req.url,
      { method: req.method, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);

        proxyRes.on("error", () => {
          // Proxy response stream error
          // Clean up client response stream
          if (res.writable) {
            res.end();
          }
        });

        proxyRes.on("close", () => {
          // Clean up if the proxy response stream closes
          if (res.writable) {
            res.end();
          }
        });
      }
    )
    .on("error", (err) => {
      res.writeHead(502);
      res.end(`Bad Gateway: ${err.message}`);
    });

  req.on("error", () => {
    // Client request stream error
    // Abort the proxy request
    proxyRequest.destroy();
  });

  res.on("error", () => {
    // Client response stream error (client disconnected)
    // Clean up proxy streams
    proxyRequest.destroy();
  });

  res.on("close", () => {
    // Client disconnected
    // Abort the proxy request to avoid unnecessary work
    proxyRequest.destroy();
  });

  req.pipe(proxyRequest);
}
