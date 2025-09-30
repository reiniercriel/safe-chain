import * as net from "net";
import { ui } from "../environment/userInteraction.js";

export function tunnelRequest(req, clientSocket, head) {
  const { port, hostname } = new URL(`http://${req.url}`);

  const serverSocket = net.connect(port || 443, hostname, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on("error", (err) => {
    ui.writeError(
      `Safe-chain: error connecting to ${hostname}:${port} - ${err.message}`
    );
    clientSocket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
  });
}
