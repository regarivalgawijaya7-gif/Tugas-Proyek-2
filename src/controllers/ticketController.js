import Ticket from "../models/Ticket.js";
import { createId, readDatabase, writeDatabase } from "../services/databaseService.js";
import { broadcastRealtime } from "../services/realtimeService.js";
import { parseRequestBody } from "../utils/request.js";
import { sendJson } from "../utils/response.js";

function generateTicketCode(eventId) {
  const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SMX-${eventId}-${randomCode}`;
}

export async function getTickets(request, response) {
  const database = await readDatabase();
  const visibleTickets = request.currentUser.role === "admin"
    ? database.tickets
    : database.tickets.filter(ticket => ticket.userId === request.currentUser.id);

  const tickets = visibleTickets.map(ticket => {
    const event = database.events.find(item => item.id === ticket.eventId);

    return {
      ...new Ticket(ticket).toJSON(),
      eventTitle: event?.title || "Event tidak ditemukan",
      eventDate: event?.date || "-",
      eventLocation: event?.location || "-"
    };
  });

  sendJson(response, 200, {
    success: true,
    message: "Data tiket berhasil diambil",
    data: tickets
  });
}

export async function createTicket(request, response) {
  const body = await parseRequestBody(request);
  const database = await readDatabase();
  const event = database.events.find(item => item.id === body.eventId);

  if (!event) {
    sendJson(response, 404, {
      success: false,
      message: "Event tidak ditemukan"
    });
    return;
  }

  const quantity = Number(body.quantity);
  const remainingQuota = event.quota - event.sold;

  if (!body.buyerName || quantity < 1) {
    sendJson(response, 400, {
      success: false,
      message: "Nama pembeli dan jumlah tiket wajib diisi"
    });
    return;
  }

  if (quantity > remainingQuota) {
    sendJson(response, 400, {
      success: false,
      message: "Jumlah tiket melebihi kuota tersedia"
    });
    return;
  }

  const newTicket = new Ticket({
    id: createId("TKT", database.tickets),
    eventId: event.id,
    userId: request.currentUser.id,
    buyerName: body.buyerName || request.currentUser.name,
    quantity,
    totalPrice: event.price * quantity,
    code: generateTicketCode(event.id),
    status: "active",
    createdAt: new Date().toISOString()
  });

  event.sold += quantity;
  database.tickets.push(newTicket.toJSON());
  await writeDatabase(database);
  broadcastRealtime("ticket-created", {
    message: "Tiket baru berhasil dibooking",
    ticket: newTicket.toJSON()
  }, {
    userId: request.currentUser.id
  });
  broadcastRealtime("admin-dashboard-updated", {
    message: "Ada transaksi tiket baru"
  }, {
    role: "admin"
  });
  broadcastRealtime("event-updated", {
    message: "Kuota event berubah",
    eventId: event.id
  });

  sendJson(response, 201, {
    success: true,
    message: "Booking tiket berhasil",
    data: newTicket.toJSON()
  });
}

export async function checkInTicket(request, response) {
  const body = await parseRequestBody(request);
  const database = await readDatabase();
  const ticketIndex = database.tickets.findIndex(ticket => ticket.code === body.code);

  if (ticketIndex === -1) {
    sendJson(response, 404, {
      success: false,
      message: "Kode tiket tidak ditemukan"
    });
    return;
  }

  if (database.tickets[ticketIndex].status === "checked-in") {
    sendJson(response, 409, {
      success: false,
      message: "Tiket sudah pernah check-in"
    });
    return;
  }

  database.tickets[ticketIndex].status = "checked-in";
  database.tickets[ticketIndex].checkedInAt = new Date().toISOString();
  await writeDatabase(database);
  broadcastRealtime("ticket-checked-in", {
    message: "Tiket berhasil check-in",
    ticket: new Ticket(database.tickets[ticketIndex]).toJSON()
  }, {
    userId: database.tickets[ticketIndex].userId
  });
  broadcastRealtime("admin-dashboard-updated", {
    message: "Status check-in berubah"
  }, {
    role: "admin"
  });

  sendJson(response, 200, {
    success: true,
    message: "Check-in tiket berhasil",
    data: new Ticket(database.tickets[ticketIndex]).toJSON()
  });
}
