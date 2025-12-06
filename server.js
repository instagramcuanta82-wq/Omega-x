import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 3000 });

let waitingUser = null; // almacena usuario esperando

wss.on("connection", (ws) => {
  ws.partner = null;

  // intentar emparejar
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

  // mensaje enviado por usuario
  ws.on("message", (msg) => {
    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "message", message: msg.toString() }));
    }
  });

  // desconexión
  ws.on("close", () => {
    if (waitingUser === ws) waitingUser = null;

    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: "status", message: "El otro usuario se desconectó." }));
      ws.partner.partner = null;
    }
  });
});
