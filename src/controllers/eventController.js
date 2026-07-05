import Event from "../models/Event.js";
import { createId, readDatabase, writeDatabase } from "../services/databaseService.js";
import { broadcastRealtime } from "../services/realtimeService.js";
import { parseRequestBody } from "../utils/request.js";
import { sendJson } from "../utils/response.js";

function parseCurrencyValue(value) {
  if (typeof value === "number") return value;

  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : NaN;
}

function parseIntegerValue(value) {
  return Number.parseInt(String(value), 10);
}

function valuesAreEqual(firstValue, secondValue) {
  return String(firstValue ?? "") === String(secondValue ?? "");
}

export async function getEvents(request, response, query) {
  const database = await readDatabase();
  const keyword = query.get("keyword")?.toLowerCase() || "";
  const category = query.get("category") || "all";
  const adminScope = query.get("scope") === "admin" && request.currentUser?.role === "admin";

  let events = database.events
    .filter(event => {
      if (adminScope) return event.status !== "deleted";
      return event.status === "published";
    })
    .map(event => new Event(event).toJSON());

  if (category !== "all") {
    events = events.filter(event => event.category === category);
  }

  if (keyword) {
    events = events.filter(event => {
      const searchableText = `${event.title} ${event.category} ${event.location}`.toLowerCase();
      return searchableText.includes(keyword);
    });
  }

  sendJson(response, 200, {
    success: true,
    message: "Data event berhasil diambil",
    data: events
  });
}

export async function getEventById(request, response, eventId) {
  const database = await readDatabase();
  const event = database.events.find(item => item.id === eventId);

  if (!event) {
    sendJson(response, 404, {
      success: false,
      message: "Event tidak ditemukan"
    });
    return;
  }

  sendJson(response, 200, {
    success: true,
    message: "Detail event berhasil diambil",
    data: new Event(event).toJSON()
  });
}

export async function createEvent(request, response) {
  const body = await parseRequestBody(request);
  const database = await readDatabase();
  const price = parseCurrencyValue(body.price);
  const quota = parseIntegerValue(body.quota);

  const newEvent = new Event({
    id: createId("EVT", database.events),
    title: body.title,
    category: body.category,
    location: body.location,
    date: body.date,
    time: body.time,
    price,
    quota,
    sold: 0,
    description: body.description,
    status: "published"
  });

  if (!newEvent.title || !newEvent.location || !newEvent.date || !newEvent.time) {
    sendJson(response, 400, {
      success: false,
      message: "Nama, lokasi, tanggal, dan waktu event wajib diisi"
    });
    return;
  }

  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quota) || quota < 1) {
    sendJson(response, 400, {
      success: false,
      message: "Harga dan kuota event harus berupa angka valid"
    });
    return;
  }

  database.events.push(newEvent.toJSON());
  await writeDatabase(database);
  broadcastRealtime("event-created", {
    message: "Event baru dipublish",
    event: newEvent.toJSON()
  });

  sendJson(response, 201, {
    success: true,
    message: "Event baru berhasil dibuat",
    data: newEvent.toJSON()
  });
}

export async function updateEvent(request, response, eventId) {
  const body = await parseRequestBody(request);
  const database = await readDatabase();
  const eventIndex = database.events.findIndex(event => event.id === eventId);

  if (eventIndex === -1) {
    sendJson(response, 404, {
      success: false,
      message: "Event tidak ditemukan"
    });
    return;
  }

  const currentEvent = database.events[eventIndex];
  const hasSoldTickets = Number(currentEvent.sold) > 0;

  if (hasSoldTickets) {
    const lockedFields = ["title", "category", "location", "date", "time", "price", "description", "status"];
    const changedLockedField = lockedFields.some(field => {
      if (body[field] === undefined) return false;

      if (field === "price") {
        return parseCurrencyValue(body.price) !== Number(currentEvent.price);
      }

      return !valuesAreEqual(body[field], currentEvent[field]);
    });

    if (changedLockedField) {
      sendJson(response, 400, {
        success: false,
        message: "Event sudah memiliki tiket terjual, hanya kuota yang bisa ditambah"
      });
      return;
    }
  }

  const price = body.price === undefined ? currentEvent.price : parseCurrencyValue(body.price);
  const quota = body.quota === undefined ? currentEvent.quota : parseIntegerValue(body.quota);

  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quota) || quota < currentEvent.sold) {
    sendJson(response, 400, {
      success: false,
      message: "Harga harus valid dan kuota tidak boleh lebih kecil dari tiket terjual"
    });
    return;
  }

  if (hasSoldTickets && quota < currentEvent.quota) {
    sendJson(response, 400, {
      success: false,
      message: "Kuota event yang sudah terjual hanya bisa ditambah"
    });
    return;
  }

  const updatedEvent = new Event({
    ...currentEvent,
    ...body,
    price,
    quota,
    sold: currentEvent.sold
  });

  database.events[eventIndex] = updatedEvent.toJSON();
  await writeDatabase(database);
  broadcastRealtime("event-updated", {
    message: "Event diperbarui",
    event: updatedEvent.toJSON()
  });

  sendJson(response, 200, {
    success: true,
    message: "Event berhasil diperbarui",
    data: updatedEvent.toJSON()
  });
}

export async function deleteEvent(request, response, eventId) {
  const database = await readDatabase();
  const eventIndex = database.events.findIndex(event => event.id === eventId);

  if (eventIndex === -1) {
    sendJson(response, 404, {
      success: false,
      message: "Event tidak ditemukan"
    });
    return;
  }

  const hasPurchasedTickets = database.tickets.some(ticket => ticket.eventId === eventId);
  if (hasPurchasedTickets) {
    sendJson(response, 409, {
      success: false,
      message: "Event tidak bisa dihapus karena sudah ada tiket yang dibeli"
    });
    return;
  }

  database.events[eventIndex].status = "deleted";
  await writeDatabase(database);
  broadcastRealtime("event-deleted", {
    message: "Event dihapus dari publik",
    eventId
  });

  sendJson(response, 200, {
    success: true,
    message: "Event berhasil dihapus dari daftar publik"
  });
}
