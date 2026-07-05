const clients = new Set();

function sendEvent(response, eventName, payload) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function addRealtimeClient(request, response, user) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  const client = {
    response,
    userId: user.id,
    role: user.role
  };

  clients.add(client);
  sendEvent(response, "connected", {
    message: "Real-time connection aktif",
    user: {
      id: user.id,
      role: user.role
    }
  });

  const heartbeat = setInterval(() => {
    sendEvent(response, "heartbeat", {
      time: new Date().toISOString()
    });
  }, 15000);

  request.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

export function broadcastRealtime(eventName, payload, options = {}) {
  for (const client of clients) {
    if (options.role && client.role !== options.role) continue;
    if (options.userId && client.userId !== options.userId) continue;

    sendEvent(client.response, eventName, {
      ...payload,
      sentAt: new Date().toISOString()
    });
  }
}
