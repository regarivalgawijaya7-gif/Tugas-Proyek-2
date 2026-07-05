import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent
} from "../controllers/eventController.js";
import {
  checkInTicket,
  createTicket,
  getTickets
} from "../controllers/ticketController.js";
import { getDashboardSummary } from "../controllers/adminController.js";
import { getMe, login, logout, register } from "../controllers/authController.js";
import { openRealtimeStream } from "../controllers/realtimeController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import { sendJson, sendNotFound } from "../utils/response.js";

export async function handleApiRoute(request, response, url) {
  const method = request.method;
  const pathname = url.pathname;

  if (method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      success: true,
      message: "Smartix API berjalan dengan baik"
    });
    return;
  }

  if (method === "POST" && pathname === "/api/auth/register") {
    await register(request, response);
    return;
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    await login(request, response);
    return;
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    if (!requireAuth(request, response)) return;
    await logout(request, response);
    return;
  }

  if (method === "GET" && pathname === "/api/auth/me") {
    if (!requireAuth(request, response)) return;
    await getMe(request, response);
    return;
  }

  if (method === "GET" && pathname === "/api/realtime") {
    await openRealtimeStream(request, response);
    return;
  }

  if (method === "GET" && pathname === "/api/events") {
    if (url.searchParams.get("scope") === "admin" && !requireRole(request, response, ["admin"])) return;
    await getEvents(request, response, url.searchParams);
    return;
  }

  if (method === "POST" && pathname === "/api/events") {
    if (!requireRole(request, response, ["admin"])) return;
    await createEvent(request, response);
    return;
  }

  const eventDetailMatch = pathname.match(/^\/api\/events\/(EVT\d+)$/);
  if (eventDetailMatch && method === "GET") {
    await getEventById(request, response, eventDetailMatch[1]);
    return;
  }

  if (eventDetailMatch && method === "PUT") {
    if (!requireRole(request, response, ["admin"])) return;
    await updateEvent(request, response, eventDetailMatch[1]);
    return;
  }

  if (eventDetailMatch && method === "DELETE") {
    if (!requireRole(request, response, ["admin"])) return;
    await deleteEvent(request, response, eventDetailMatch[1]);
    return;
  }

  if (method === "GET" && pathname === "/api/tickets") {
    if (!requireAuth(request, response)) return;
    await getTickets(request, response);
    return;
  }

  if (method === "POST" && pathname === "/api/tickets") {
    if (!requireAuth(request, response)) return;
    await createTicket(request, response);
    return;
  }

  if (method === "POST" && pathname === "/api/tickets/check-in") {
    if (!requireRole(request, response, ["admin"])) return;
    await checkInTicket(request, response);
    return;
  }

  if (method === "GET" && pathname === "/api/admin/dashboard") {
    if (!requireRole(request, response, ["admin"])) return;
    await getDashboardSummary(request, response);
    return;
  }

  sendNotFound(response);
}
