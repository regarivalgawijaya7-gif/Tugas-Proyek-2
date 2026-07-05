import { getPublicUser, getTokenFromRequest, getUserByToken } from "../services/authService.js";
import { sendJson } from "../utils/response.js";

export async function runMiddlewares(request, response, url, middlewares) {
  for (const middleware of middlewares) {
    await middleware(request, response, url);

    if (response.writableEnded) {
      return false;
    }
  }

  return true;
}

export async function securityHeadersMiddleware(request, response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "same-origin");
}

export async function loggerMiddleware(request, response, url) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${request.method} ${url.pathname}`);
}

export async function jsonContentTypeMiddleware(request, response, url) {
  const methodNeedsBody = ["POST", "PUT", "PATCH"].includes(request.method);
  const isApiRoute = url.pathname.startsWith("/api");
  const hasBody = Number(request.headers["content-length"] || 0) > 0;

  if (!isApiRoute || !methodNeedsBody || !hasBody) return;

  const contentType = request.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    sendJson(response, 415, {
      success: false,
      message: "Content-Type harus application/json"
    });
  }
}

export async function authContextMiddleware(request, response, url) {
  const token = getTokenFromRequest(request, url);
  const user = await getUserByToken(token);

  request.authToken = token;
  request.currentUser = user;
  request.publicUser = getPublicUser(user);
}
