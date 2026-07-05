import { readFile } from "fs/promises";
import path from "path";
import { sendStatic } from "./response.js";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

export async function serveStaticFile(response, filePath) {
  const extension = path.extname(filePath);
  const contentType = contentTypes[extension] || "application/octet-stream";
  const content = await readFile(filePath);

  sendStatic(response, 200, content, contentType);
}
