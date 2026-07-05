import { sendJson } from "../utils/response.js";

export function requireAuth(request, response) {
  if (request.currentUser) return true;

  sendJson(response, 401, {
    success: false,
    message: "Silakan login terlebih dahulu"
  });
  return false;
}

export function requireRole(request, response, allowedRoles) {
  if (!requireAuth(request, response)) return false;

  if (allowedRoles.includes(request.currentUser.role)) return true;

  sendJson(response, 403, {
    success: false,
    message: "Akses ditolak untuk role pengguna ini"
  });
  return false;
}
