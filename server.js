import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let waitingUser = null;

wss.on("connection", (ws) => {
  ws.partner = null;

  if (waitingUser === null) {
    waitingUser = ws;
    ws.send(JSON.stringify({ type: "status", message: "Esperando a otro usuario..." }));
  } else {
    ws.partner = waitingUser;
    waitingUser.partner = ws;

    ws.send(JSON.stringify({ type: "status", message: "¡Conectado!" }));
    waitingUser.send(JSON.stringify({ type: "status", message: "¡Conectado!" }));

    waitingUser = null;
  }

  ws.on("message", (msg) => {
    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "message", message: msg.toString() }));
    }
  });

  ws.on("close", () => {
    if (waitingUser === ws) waitingUser = null;

    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "status", message: "El otro usuario se desconectó." }));
      ws.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor WebSocket activo en puerto", PORT);
});
