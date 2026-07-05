import Event from "../models/Event.js";
import AdminUser from "../models/AdminUser.js";
import { readDatabase } from "../services/databaseService.js";
import { sendJson } from "../utils/response.js";

export async function getDashboardSummary(request, response) {
  const database = await readDatabase();
  const admin = new AdminUser(request.currentUser);
  const events = database.events
    .filter(event => event.status !== "deleted")
    .map(event => new Event(event));

  const totalRevenue = events.reduce((total, event) => total + event.getRevenue(), 0);
  const checkedInTickets = database.tickets.filter(ticket => ticket.status === "checked-in").length;
  const popularEvents = events
    .sort((firstEvent, secondEvent) => secondEvent.sold - firstEvent.sold)
    .slice(0, 3)
    .map(event => event.toJSON());

  sendJson(response, 200, {
    success: true,
    message: "Ringkasan dashboard admin berhasil diambil",
    data: {
      admin: admin.toJSON(),
      totalEvents: database.events.filter(event => event.status === "published").length,
      totalTickets: database.tickets.length,
      checkedInTickets,
      totalRevenue,
      popularEvents
    }
  });
}
