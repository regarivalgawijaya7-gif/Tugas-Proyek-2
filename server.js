import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import {
  authContextMiddleware,
  jsonContentTypeMiddleware,
  loggerMiddleware,
  runMiddlewares,
  securityHeadersMiddleware
} from "./src/middlewares/appMiddleware.js";
import { handleApiRoute } from "./src/routes/router.js";
import { sendJson, sendServerError } from "./src/utils/response.js";
import { serveStaticFile } from "./src/utils/staticFile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "public");
const middlewares = [
  securityHeadersMiddleware,
  loggerMiddleware,
  jsonContentTypeMiddleware,
  authContextMiddleware
];

async function handleStaticRoute(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path
    .normalize(requestedPath)
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  const filePath = path.join(publicDirectory, safePath);

  if (!filePath.startsWith(publicDirectory)) {
    sendJson(response, 403, {
      success: false,
      message: "Akses file ditolak"
    });
    return;
  }

  await serveStaticFile(response, filePath);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    const shouldContinue = await runMiddlewares(request, response, url, middlewares);
    if (!shouldContinue) return;

    if (url.pathname.startsWith("/api")) {
      await handleApiRoute(request, response, url);
      return;
    }

    await handleStaticRoute(response, url.pathname);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(response, 404, {
        success: false,
        message: "File tidak ditemukan"
      });
      return;
    }

    sendServerError(response, error);
  }
});

server.listen(port, () => {
  console.log(`Smartix server running at http://localhost:${port}`);
});
