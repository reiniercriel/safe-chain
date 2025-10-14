import * as http from "http";
import * as https from "https";
// oxlint-disable no-console - just for testing, remove afterwards

export function handleHttpProxyRequest(req, res) {
  const url = new URL(req.url);
  console.log(`Proxying request to: ${req.url}`);

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

        proxyRes.on("error", (err) => {
          console.log("Error in proxy response stream:", err);
          // Stream error while piping response
          // Response headers already sent, can't send error status
        });
      }
    )
    .on("error", (err) => {
      res.writeHead(502);
      res.end(`Bad Gateway: ${err.message}`);
    });

  req.on("error", () => {
    console.log("Error in client request stream");
    // Client request stream error
    // Abort the proxy request
    proxyRequest.destroy();
  });

  res.on("error", () => {
    console.log("Error in client response stream");
    // Client response stream error (client disconnected)
    // Clean up proxy streams
    proxyRequest.destroy();
  });

  res.on("close", () => {
    console.log("Client response stream closed");
    // Client disconnected
    // Abort the proxy request to avoid unnecessary work
    if (!res.writableEnded) {
      proxyRequest.destroy();
    }
  });

  req.pipe(proxyRequest);
}
