const state = {
  events: [],
  adminEvents: [],
  tickets: [],
  dashboard: null,
  currentUser: null,
  authMode: "login",
  token: localStorage.getItem("smartixToken") || "",
  realtimeSource: null
};

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const plainNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric"
});

const elements = {
  authView: document.querySelector("#authView"),
  appShell: document.querySelector("#appShell"),
  navButtons: document.querySelectorAll(".nav-button"),
  adminNavButton: document.querySelector(".nav-button[data-view='admin']"),
  views: document.querySelectorAll(".view"),
  eventList: document.querySelector("#eventList"),
  ticketList: document.querySelector("#ticketList"),
  ticketSearchPanel: document.querySelector("#ticketSearchPanel"),
  ticketSearchInput: document.querySelector("#ticketSearchInput"),
  ticketActionResult: document.querySelector("#ticketActionResult"),
  bookingEvent: document.querySelector("#bookingEvent"),
  bookingBuyerName: document.querySelector("#bookingForm input[name='buyerName']"),
  bookingQuantity: document.querySelector("#bookingForm input[name='quantity']"),
  bookingTotal: document.querySelector("#bookingTotal"),
  bookingForm: document.querySelector("#bookingForm"),
  bookingResult: document.querySelector("#bookingResult"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  dashboardCards: document.querySelector("#dashboardCards"),
  popularEventList: document.querySelector("#popularEventList"),
  adminEventList: document.querySelector("#adminEventList"),
  eventForm: document.querySelector("#eventForm"),
  eventFormResult: document.querySelector("#eventFormResult"),
  eventFormTitle: document.querySelector("#eventFormTitle"),
  eventSubmitButton: document.querySelector("#eventSubmitButton"),
  eventCancelButton: document.querySelector("#eventCancelButton"),
  authForm: document.querySelector("#authForm"),
  authUsernameInput: document.querySelector("#authUsernameInput"),
  authEmailInput: document.querySelector("#authEmailInput"),
  authPasswordInput: document.querySelector("#authForm input[name='password']"),
  authTitle: document.querySelector("#authTitle"),
  authSubtitle: document.querySelector("#authSubtitle"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  authModeButton: document.querySelector("#authModeButton"),
  authHelper: document.querySelector("#authHelper"),
  authResult: document.querySelector("#authResult"),
  authStatus: document.querySelector("#authStatus"),
  logoutButton: document.querySelector("#logoutButton"),
  rtcStatus: document.querySelector("#rtcStatus"),
  hero: document.querySelector(".hero"),
  heroPanel: document.querySelector(".hero-panel"),
  heroTitle: document.querySelector("#heroTitle"),
  heroDescription: document.querySelector("#heroDescription"),
  heroEventCount: document.querySelector("#heroEventCount"),
  heroTicketCount: document.querySelector("#heroTicketCount"),
  homeContentGrid: document.querySelector("#homeContentGrid"),
  bookingPanel: document.querySelector("#bookingPanel"),
  eventSectionDescription: document.querySelector("#eventSectionDescription")
};

async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const result = await response.json();

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Request gagal");
  }

  return result;
}

function isLoggedIn() {
  return Boolean(state.currentUser);
}

function isAdmin() {
  return state.currentUser?.role === "admin";
}

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function parseCurrencyInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function getTicketSearchText(ticket) {
  return [
    ticket.code,
    ticket.buyerName,
    ticket.eventTitle,
    ticket.eventDate,
    ticket.eventLocation,
    ticket.status
  ].join(" ").toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showNotice(element, message, isError = false) {
  element.textContent = message;
  element.hidden = false;
  element.classList.toggle("error", isError);
}

function clearNotice(element) {
  element.textContent = "";
  element.hidden = true;
  element.classList.remove("error");
}

function setAuthMode(mode) {
  state.authMode = mode;
  elements.authForm.reset();
  clearNotice(elements.authResult);

  if (mode === "register") {
    elements.authUsernameInput.hidden = false;
    elements.authUsernameInput.disabled = false;
    elements.authUsernameInput.required = true;
    elements.authPasswordInput.autocomplete = "new-password";
    elements.authTitle.textContent = "Buat Akun Baru";
    elements.authSubtitle.textContent = "Daftar dengan username, email, dan password untuk mulai booking tiket.";
    elements.authSubmitButton.textContent = "Buat Akun";
    elements.authModeButton.textContent = "Masuk ke Akun";
    elements.authHelper.textContent = "Sudah punya akun? Masuk dengan email dan password.";
    return;
  }

  elements.authUsernameInput.hidden = true;
  elements.authUsernameInput.disabled = true;
  elements.authUsernameInput.required = false;
  elements.authPasswordInput.autocomplete = "current-password";
  elements.authTitle.textContent = "Masuk ke Smartix";
  elements.authSubtitle.textContent = "Masuk untuk memesan tiket dan melihat kode tiket digitalmu.";
  elements.authSubmitButton.textContent = "Login";
  elements.authModeButton.textContent = "Buat Akun Baru";
  elements.authHelper.textContent = "Belum punya akun? Buat akun baru untuk mulai booking tiket.";
}

function setFormDisabled(form, disabled) {
  form.querySelectorAll("input, select, textarea, button").forEach(control => {
    control.disabled = disabled;
  });
}

function updateAdminAccessState() {
  const locked = !isAdmin();

  setFormDisabled(elements.eventForm, locked);
  elements.eventCancelButton.disabled = locked;
}

function updateBookingQuantityLimit() {
  const selectedEvent = state.events.find(event => event.id === elements.bookingEvent.value);

  if (!selectedEvent) {
    elements.bookingQuantity.removeAttribute("max");
    elements.bookingQuantity.value = 1;
    updateBookingQuantityValidation();
    updateBookingTotal();
    return;
  }

  const maxQuantity = Math.max(1, Number(selectedEvent.remainingQuota));
  elements.bookingQuantity.max = String(maxQuantity);

  if (Number(elements.bookingQuantity.value) > maxQuantity) {
    elements.bookingQuantity.value = String(maxQuantity);
  }

  updateBookingQuantityValidation();
  updateBookingTotal();
}

function updateBookingQuantityValidation() {
  const selectedEvent = state.events.find(event => event.id === elements.bookingEvent.value);

  if (!selectedEvent) {
    elements.bookingQuantity.setCustomValidity("");
    return true;
  }

  const quantity = Number(elements.bookingQuantity.value);
  const remainingQuota = Number(selectedEvent.remainingQuota);

  if (quantity > remainingQuota) {
    elements.bookingQuantity.setCustomValidity(`Mohon maaf, jumlah tiket yang tersisa hanya ${remainingQuota}.`);
    return false;
  }

  elements.bookingQuantity.setCustomValidity("");
  return true;
}

function updateBookingTotal() {
  const selectedEvent = state.events.find(event => event.id === elements.bookingEvent.value);
  const quantity = Math.max(1, Number(elements.bookingQuantity.value) || 1);
  const total = selectedEvent ? selectedEvent.price * quantity : 0;

  elements.bookingTotal.textContent = rupiahFormatter.format(total);
}

function updateBookingQuantityInput() {
  updateBookingQuantityValidation();
  updateBookingTotal();
}

function updateBookingBuyerNameValidation() {
  if (!elements.bookingBuyerName.value.trim()) {
    elements.bookingBuyerName.setCustomValidity("Mohon isi nama anda terlebih dahulu.");
    return false;
  }

  elements.bookingBuyerName.setCustomValidity("");
  return true;
}

function updateHeroCopy() {
  if (isAdmin()) {
    elements.hero.classList.remove("customer-hero");
    elements.heroPanel.hidden = false;
    elements.heroTitle.textContent = "Kelola event, booking tiket, dan check-in dalam satu website.";
    elements.heroDescription.textContent = "ZEE membantu peserta menemukan event terbaik, memesan tiket digital, dan membantu panitia memantau penjualan secara real-time.";
    return;
  }

  elements.hero.classList.add("customer-hero");
  elements.heroPanel.hidden = true;
  elements.heroTitle.textContent = "Temukan event seru dan pesan tiketmu sekarang.";
  elements.heroDescription.textContent = "Pilih event favoritmu, booking tiket digital dengan mudah, lalu gunakan kode unik untuk check-in saat hari acara.";
}

function updateHomeAccessState() {
  const admin = isAdmin();

  elements.bookingPanel.hidden = admin;
  elements.homeContentGrid.classList.toggle("events-only", admin);
  elements.eventSectionDescription.textContent = admin
    ? "Pantau event yang sedang dipublish untuk pelanggan."
    : "Pilih event dan pesan tiket digital.";
}

function renderAuthState() {
  if (!state.currentUser) {
    elements.authView.hidden = false;
    elements.appShell.hidden = true;
    elements.authStatus.textContent = "Guest";
    elements.logoutButton.hidden = true;
    elements.rtcStatus.textContent = "Off";
    elements.adminNavButton.hidden = true;
    elements.ticketSearchPanel.hidden = true;
    clearNotice(elements.ticketActionResult);
    elements.ticketList.innerHTML = `<div class="locked-state">Login sebagai customer atau admin untuk melihat tiket.</div>`;
    elements.dashboardCards.innerHTML = `<div class="locked-state">Login sebagai admin untuk membuka dashboard.</div>`;
    elements.popularEventList.innerHTML = "";
    elements.adminEventList.innerHTML = "";
    return;
  }

  elements.authView.hidden = true;
  elements.appShell.hidden = false;
  elements.authStatus.textContent = `${state.currentUser.name} (${state.currentUser.role})`;
  elements.logoutButton.hidden = false;
  elements.adminNavButton.hidden = !isAdmin();
  updateHeroCopy();
  updateHomeAccessState();
  updateAdminAccessState();

  if (!isAdmin()) {
    elements.dashboardCards.innerHTML = `<div class="locked-state">Role customer tidak memiliki akses admin.</div>`;
    elements.popularEventList.innerHTML = "";
    elements.adminEventList.innerHTML = "";
    if (document.querySelector("#adminView").classList.contains("active-view")) {
      setActiveView("home");
    }
  }
}

function setAuthSession(data) {
  state.currentUser = data.user;
  state.token = data.token;
  localStorage.setItem("smartixToken", data.token);
  renderAuthState();
  setActiveView("home");
  connectRealtime();
}

function setActiveView(viewName) {
  const nextViewName = viewName === "admin" && !isAdmin() ? "home" : viewName;

  elements.navButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.view === nextViewName);
  });

  elements.views.forEach(view => {
    view.classList.remove("active-view");
  });

  document.querySelector(`#${nextViewName}View`).classList.add("active-view");
}

function renderEvents() {
  if (state.events.length === 0) {
    elements.eventList.innerHTML = `<div class="empty-state">Belum ada event yang cocok.</div>`;
    elements.bookingEvent.innerHTML = `<option value="">Tidak ada event</option>`;
    return;
  }

  elements.eventList.innerHTML = state.events
    .map(event => {
      const demandClass = event.demandLevel === "High" ? "hot" : "";
      const demandBadge = isAdmin()
        ? `<span class="badge ${demandClass}">${escapeHtml(event.demandLevel)} demand</span>`
        : "";

      return `
        <article class="event-card">
          <div class="event-art" aria-hidden="true"></div>
          <div class="event-body">
            <div class="badge-row">
              <span class="badge">${escapeHtml(event.category)}</span>
              ${demandBadge}
            </div>
            <h3>${escapeHtml(event.title)}</h3>
            <div class="event-meta">
              <span>${formatDate(event.date)} at ${escapeHtml(event.time)}</span>
              <span>${escapeHtml(event.location)}</span>
              <span>${event.remainingQuota} seats left from ${event.quota}</span>
            </div>
            <p>${escapeHtml(event.description)}</p>
            <div class="price">${rupiahFormatter.format(event.price)}</div>
          </div>
        </article>
      `;
    })
    .join("");

  elements.bookingEvent.innerHTML = state.events
    .map(event => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.title)}</option>`)
    .join("");

  updateBookingQuantityLimit();
}

function renderTickets() {
  elements.heroTicketCount.textContent = state.tickets.length;
  elements.ticketSearchPanel.hidden = !isAdmin();

  if (!isLoggedIn()) {
    elements.ticketList.innerHTML = `<div class="locked-state">Login terlebih dahulu untuk melihat tiket digital.</div>`;
    return;
  }

  if (state.tickets.length === 0) {
    elements.ticketList.innerHTML = `<div class="empty-state">Belum ada tiket yang dibooking.</div>`;
    return;
  }

  const searchKeyword = elements.ticketSearchInput.value.trim().toLowerCase();
  const visibleTickets = isAdmin() && searchKeyword
    ? state.tickets.filter(ticket => getTicketSearchText(ticket).includes(searchKeyword))
    : state.tickets;

  if (visibleTickets.length === 0) {
    elements.ticketList.innerHTML = `<div class="empty-state">Tidak ada tiket yang cocok dengan pencarian.</div>`;
    return;
  }

  elements.ticketList.innerHTML = visibleTickets
    .map(ticket => `
      <article class="ticket-card">
        <span class="badge">${escapeHtml(ticket.status)}</span>
        <h3>${escapeHtml(ticket.eventTitle)}</h3>
        <div class="ticket-meta">
          <span>Pemilik: ${escapeHtml(ticket.buyerName)}</span>
          <span>Jumlah: ${ticket.quantity} tiket</span>
          <span>Tanggal event: ${escapeHtml(ticket.eventDate)}</span>
          <span>Lokasi: ${escapeHtml(ticket.eventLocation)}</span>
          <span>Total: ${rupiahFormatter.format(ticket.totalPrice)}</span>
        </div>
        <div class="ticket-code-row">
          <div class="ticket-code">${escapeHtml(ticket.code)}</div>
          ${isAdmin() ? `
            <button
              class="small-button ticket-checkin-button"
              type="button"
              data-checkin-code="${escapeHtml(ticket.code)}"
              ${ticket.status === "checked-in" ? "disabled" : ""}
            >
              ${ticket.status === "checked-in" ? "Checked In" : "Check In"}
            </button>
          ` : ""}
        </div>
      </article>
    `)
    .join("");
}

function renderDashboard() {
  if (!state.dashboard) return;

  const summary = state.dashboard;
  elements.heroEventCount.textContent = summary.totalEvents;

  const cards = [
    ["Total Events", summary.totalEvents],
    ["Total Tickets", summary.totalTickets],
    ["Checked In", summary.checkedInTickets],
    ["Revenue", rupiahFormatter.format(summary.totalRevenue)]
  ];

  elements.dashboardCards.innerHTML = cards
    .map(([label, value]) => `
      <article class="dashboard-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `)
    .join("");

  elements.popularEventList.innerHTML = summary.popularEvents
    .map(event => `
      <article class="compact-item">
        <div>
          <strong>${escapeHtml(event.title)}</strong>
          <span>${escapeHtml(event.category)} - ${event.sold} sold - ${rupiahFormatter.format(event.revenue)}</span>
        </div>
        <span class="badge ${event.demandLevel === "High" ? "hot" : ""}">${escapeHtml(event.demandLevel)}</span>
      </article>
    `)
    .join("");
}

function renderAdminEvents() {
  if (state.adminEvents.length === 0) {
    elements.adminEventList.innerHTML = `<div class="empty-state">Belum ada event yang bisa dikelola.</div>`;
    return;
  }

  elements.adminEventList.innerHTML = state.adminEvents
    .map(event => {
      const deleteDisabled = Number(event.sold) > 0;
      const deleteTitle = deleteDisabled
        ? "Event tidak bisa dihapus karena sudah ada tiket yang dibeli"
        : "Delete event";

      return `
        <article class="admin-event-item">
          <div>
            <strong>${escapeHtml(event.title)}</strong>
            <span>${escapeHtml(event.location)} - ${formatDate(event.date)}</span>
            <span>${event.sold}/${event.quota} sold - ${rupiahFormatter.format(event.price)}</span>
          </div>
          <div class="event-actions">
            <button class="small-button" data-action="edit" data-id="${escapeHtml(event.id)}">Edit</button>
            <button
              class="small-button danger-button"
              data-action="delete"
              data-id="${escapeHtml(event.id)}"
              title="${escapeHtml(deleteTitle)}"
              ${deleteDisabled ? "disabled" : ""}
            >
              Delete
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadEvents() {
  const keyword = elements.searchInput.value.trim();
  const category = elements.categoryFilter.value;
  const query = new URLSearchParams({ keyword, category });
  const result = await apiRequest(`/api/events?${query.toString()}`);

  state.events = result.data;
  renderEvents();
}

async function loadAdminEvents() {
  if (!isAdmin()) {
    state.adminEvents = [];
    renderAuthState();
    return;
  }

  const result = await apiRequest("/api/events?scope=admin&category=all");
  state.adminEvents = result.data;
  renderAdminEvents();
}

async function loadTickets() {
  if (!isLoggedIn()) {
    state.tickets = [];
    renderTickets();
    return;
  }

  const result = await apiRequest("/api/tickets");
  state.tickets = result.data;
  renderTickets();
}

async function loadDashboard() {
  if (!isAdmin()) {
    state.dashboard = null;
    renderAuthState();
    return;
  }

  const result = await apiRequest("/api/admin/dashboard");
  state.dashboard = result.data;
  renderDashboard();
}

async function refreshAll() {
  await loadEvents();
  await loadAdminEvents();
  await loadTickets();
  await loadDashboard();
}

function resetEventForm() {
  elements.eventForm.reset();
  elements.eventForm.elements.eventId.value = "";
  elements.eventForm.querySelectorAll("[data-lock-after-sale]").forEach(control => {
    control.disabled = false;
  });
  elements.eventForm.elements.quota.min = "1";
  elements.eventFormTitle.textContent = "Create Event";
  elements.eventSubmitButton.textContent = "Publish Event";
  elements.eventCancelButton.hidden = true;
}

function fillEventForm(eventId) {
  const selectedEvent = state.adminEvents.find(event => event.id === eventId);
  if (!selectedEvent) return;

  elements.eventForm.elements.eventId.value = selectedEvent.id;
  elements.eventForm.elements.title.value = selectedEvent.title;
  elements.eventForm.elements.category.value = selectedEvent.category;
  elements.eventForm.elements.location.value = selectedEvent.location;
  elements.eventForm.elements.date.value = selectedEvent.date;
  elements.eventForm.elements.time.value = selectedEvent.time;
  elements.eventForm.elements.price.value = plainNumberFormatter.format(selectedEvent.price);
  elements.eventForm.elements.quota.value = selectedEvent.quota;
  elements.eventForm.elements.quota.min = String(Math.max(1, Number(selectedEvent.sold)));
  elements.eventForm.elements.description.value = selectedEvent.description;
  elements.eventFormTitle.textContent = "Edit Event";
  elements.eventSubmitButton.textContent = "Save Changes";
  elements.eventCancelButton.hidden = false;

  const lockSoldEventFields = Number(selectedEvent.sold) > 0;
  elements.eventForm.querySelectorAll("[data-lock-after-sale]").forEach(control => {
    control.disabled = lockSoldEventFields;
  });

  if (lockSoldEventFields) {
    showNotice(elements.eventFormResult, "Event ini sudah memiliki tiket terjual. Hanya kuota yang bisa ditambah.");
  }

  elements.eventForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function connectRealtime() {
  if (state.realtimeSource) {
    state.realtimeSource.close();
    state.realtimeSource = null;
  }

  if (!state.token) {
    elements.rtcStatus.textContent = "Off";
    return;
  }

  const source = new EventSource(`/api/realtime?token=${encodeURIComponent(state.token)}`);
  state.realtimeSource = source;
  elements.rtcStatus.textContent = "Connecting";

  source.addEventListener("connected", () => {
    elements.rtcStatus.textContent = "On";
  });

  ["event-created", "event-updated", "event-deleted", "ticket-created", "ticket-checked-in", "admin-dashboard-updated"].forEach(eventName => {
    source.addEventListener(eventName, () => {
      refreshAll().catch(error => showNotice(elements.authResult, error.message, true));
    });
  });

  source.onerror = () => {
    elements.rtcStatus.textContent = "Retry";
  };
}

async function loadCurrentUser() {
  if (!state.token) {
    renderAuthState();
    return;
  }

  try {
    const result = await apiRequest("/api/auth/me");
    state.currentUser = result.data;
    renderAuthState();
    connectRealtime();
  } catch {
    state.currentUser = null;
    state.token = "";
    localStorage.removeItem("smartixToken");
    renderAuthState();
  }
}

elements.navButtons.forEach(button => {
  button.addEventListener("click", () => {
    setActiveView(button.dataset.view);
  });
});

elements.authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const mode = state.authMode;

  try {
    const result = await apiRequest(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setAuthSession(result.data);
    showNotice(elements.authResult, result.message);
    form.reset();
    await refreshAll();
  } catch (error) {
    showNotice(elements.authResult, error.message, true);
  }
});

elements.authModeButton.addEventListener("click", () => {
  setAuthMode(state.authMode === "login" ? "register" : "login");
});

elements.logoutButton.addEventListener("click", async () => {
  try {
    if (state.token) {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({})
      });
    }
  } catch {
    // Session may already be expired; local cleanup still needs to happen.
  }

  if (state.realtimeSource) {
    state.realtimeSource.close();
    state.realtimeSource = null;
  }

  state.currentUser = null;
  state.token = "";
  state.tickets = [];
  state.dashboard = null;
  localStorage.removeItem("smartixToken");
  clearNotice(elements.authResult);
  renderAuthState();
  await refreshAll();
});

elements.searchInput.addEventListener("input", () => {
  loadEvents().catch(error => showNotice(elements.bookingResult, error.message, true));
});

elements.categoryFilter.addEventListener("change", () => {
  loadEvents().catch(error => showNotice(elements.bookingResult, error.message, true));
});

elements.bookingEvent.addEventListener("change", updateBookingQuantityLimit);

elements.bookingBuyerName.addEventListener("input", updateBookingBuyerNameValidation);

elements.bookingBuyerName.addEventListener("invalid", updateBookingBuyerNameValidation);

elements.bookingQuantity.addEventListener("input", updateBookingQuantityInput);

elements.bookingQuantity.addEventListener("invalid", updateBookingQuantityValidation);

elements.ticketSearchInput.addEventListener("input", () => {
  renderTickets();
});

elements.ticketList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-checkin-code]");
  if (!button) return;

  if (!isAdmin()) {
    showNotice(elements.ticketActionResult, "Hanya admin yang bisa check-in tiket", true);
    return;
  }

  try {
    button.disabled = true;
    const result = await apiRequest("/api/tickets/check-in", {
      method: "POST",
      body: JSON.stringify({ code: button.dataset.checkinCode })
    });

    showNotice(elements.ticketActionResult, `${result.message}: ${result.data.code}`);
    await refreshAll();
  } catch (error) {
    button.disabled = false;
    showNotice(elements.ticketActionResult, error.message, true);
  }
});

elements.adminEventList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const eventId = button.dataset.id;

  if (button.dataset.action === "edit") {
    fillEventForm(eventId);
    return;
  }

  if (!confirm("Hapus event ini dari daftar publik?")) return;

  try {
    const result = await apiRequest(`/api/events/${eventId}`, {
      method: "DELETE"
    });

    showNotice(elements.eventFormResult, result.message);
    resetEventForm();
    await refreshAll();
  } catch (error) {
    showNotice(elements.eventFormResult, error.message, true);
  }
});

elements.bookingForm.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!isLoggedIn()) {
    showNotice(elements.bookingResult, "Login diperlukan sebelum booking tiket", true);
    return;
  }

  if (!updateBookingBuyerNameValidation()) {
    elements.bookingBuyerName.reportValidity();
    return;
  }

  if (!updateBookingQuantityValidation()) {
    elements.bookingQuantity.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.quantity = Number(payload.quantity);

  try {
    const result = await apiRequest("/api/tickets", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    showNotice(elements.bookingResult, `${result.message}. Kode tiket: ${result.data.code}`);
    form.reset();
    await refreshAll();
  } catch (error) {
    showNotice(elements.bookingResult, error.message, true);
  }
});

elements.eventForm.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!isAdmin()) {
    showNotice(elements.eventFormResult, "Hanya admin yang bisa membuat atau mengedit event", true);
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const eventId = payload.eventId;
  delete payload.eventId;
  const editedEvent = state.adminEvents.find(eventItem => eventItem.id === eventId);
  const quotaOnlyEdit = Boolean(editedEvent && Number(editedEvent.sold) > 0);

  if (quotaOnlyEdit) {
    Object.keys(payload).forEach(key => {
      if (key !== "quota") delete payload[key];
    });
  } else {
    payload.price = parseCurrencyInput(payload.price);
  }

  payload.quota = Number(payload.quota);
  const endpoint = eventId ? `/api/events/${eventId}` : "/api/events";
  const method = eventId ? "PUT" : "POST";

  try {
    const result = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    showNotice(elements.eventFormResult, `${result.message}: ${result.data.title}`);
    resetEventForm();
    await refreshAll();
  } catch (error) {
    showNotice(elements.eventFormResult, error.message, true);
  }
});

elements.eventCancelButton.addEventListener("click", resetEventForm);

setAuthMode("login");
await loadCurrentUser();
refreshAll().catch(error => {
  elements.eventList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
