export function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

export function sendHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });
  response.end(html);
}

export function sendStatic(response, statusCode, content, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType
  });
  response.end(content);
}

export function sendNotFound(response) {
  sendJson(response, 404, {
    success: false,
    message: "Route tidak ditemukan"
  });
}

export function sendServerError(response, error) {
  sendJson(response, 500, {
    success: false,
    message: "Terjadi kesalahan pada server",
    detail: error.message
  });
}
