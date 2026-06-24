const translations = {
  no: {
    navHome: "Hjem",
    navGallery: "Arbeid",
    navServices: "Tjenester",
    navAbout: "Om",
    navBooking: "Booking",
    navContact: "Kontakt",
    taglineMain: "Mer enn en klipp",
    bookNow: "Book time",
    seeWork: "Se arbeid",
    profileBio: "Barber portfolio, skarpe detaljer og booking for kunder som vil ha en ren finish.",
    galleryEyebrow: "Portfolio",
    galleryTitle: "Arbeid og galleri",
    servicesEyebrow: "Services",
    servicesTitle: "Tjenester og priser",
    aboutEyebrow: "About",
    aboutTitle: "Om TW'Cutz",
    bookingEyebrow: "Booking",
    bookingTitle: "Send bookingforespørsel",
    bookingCopy: "Velg tjeneste, dato og klokkeslett. Eier bekrefter forespørselen i adminpanelet.",
    fieldService: "Tjeneste",
    fieldDate: "Dato",
    fieldTime: "Klokkeslett",
    fieldName: "Navn",
    fieldPhone: "Telefon",
    fieldEmail: "E-post",
    fieldComment: "Kommentar",
    fieldContact: "E-post eller telefon",
    fieldMessage: "Melding",
    sendBooking: "Send forespørsel",
    contactEyebrow: "Contact",
    contactTitle: "Kontakt",
    contactCopy: "Send en melding, eller gå direkte til Instagram for rask kontakt.",
    sendMessage: "Send melding",
    bookingOk: "Bookingforespørsel sendt. Eier kan se den i adminpanelet.",
    contactOk: "Meldingen er sendt.",
    error: "Noe gikk galt. Prøv igjen.",
    minutes: "min",
    homeGallery: "Se fades, klipp og detaljer.",
    homeServices: "Priser, varighet og behandlinger.",
    homeBooking: "Send forespørsel direkte."
  },
  en: {
    navHome: "Home",
    navGallery: "Work",
    navServices: "Services",
    navAbout: "About",
    navBooking: "Booking",
    navContact: "Contact",
    taglineMain: "More than a cut",
    bookNow: "Book now",
    seeWork: "See work",
    profileBio: "Barber portfolio, sharp details and booking for clients who want a clean finish.",
    galleryEyebrow: "Portfolio",
    galleryTitle: "Work and gallery",
    servicesEyebrow: "Services",
    servicesTitle: "Services and prices",
    aboutEyebrow: "About",
    aboutTitle: "About TW'Cutz",
    bookingEyebrow: "Booking",
    bookingTitle: "Send booking request",
    bookingCopy: "Choose a service, date and time. The owner confirms the request in the admin panel.",
    fieldService: "Service",
    fieldDate: "Date",
    fieldTime: "Time",
    fieldName: "Name",
    fieldPhone: "Phone",
    fieldEmail: "Email",
    fieldComment: "Comment",
    fieldContact: "Email or phone",
    fieldMessage: "Message",
    sendBooking: "Send request",
    contactEyebrow: "Contact",
    contactTitle: "Contact",
    contactCopy: "Send a message, or go directly to Instagram for quick contact.",
    sendMessage: "Send message",
    bookingOk: "Booking request sent. The owner can see it in the admin panel.",
    contactOk: "Message sent.",
    error: "Something went wrong. Try again.",
    minutes: "min",
    homeGallery: "See fades, cuts and details.",
    homeServices: "Prices, duration and treatments.",
    homeBooking: "Send a request directly."
  }
};

let state = {
  lang: localStorage.getItem("twcutz_lang") || "no",
  data: { services: [], gallery: [], content: {} },
  adminToken: localStorage.getItem("twcutz_admin_token") || "",
  adminData: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function t(key) {
  return translations[state.lang][key] || translations.no[key] || key;
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.adminToken) headers.Authorization = `Bearer ${state.adminToken}`;
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach(node => {
    node.textContent = t(node.dataset.i18n);
  });
  $$(".lang-btn").forEach(button => button.classList.toggle("active", button.dataset.lang === state.lang));
  $$("[data-page-link]").forEach(link => {
    link.classList.toggle("active", link.dataset.pageLink === document.body.dataset.page);
  });

  const heroNote = $("#heroNote");
  if (heroNote) heroNote.textContent = state.lang === "no" ? state.data.content.heroNoteNo : state.data.content.heroNoteEn;

  const aboutCopy = $("#aboutCopy");
  if (aboutCopy) aboutCopy.textContent = state.lang === "no" ? state.data.content.aboutNo : state.data.content.aboutEn;

  renderServices();
  renderBookingOptions();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGallery() {
  const count = $("#galleryCount");
  if (count) count.textContent = state.data.gallery.length;

  const grid = $("#galleryGrid");
  if (!grid) return;
  grid.innerHTML = state.data.gallery.map(item => `
    <article class="gallery-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
      <div class="gallery-caption">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.category)}</span>
      </div>
    </article>
  `).join("");
}

function renderServices() {
  const list = $("#serviceList");
  if (!list) return;
  list.innerHTML = state.data.services.map(service => {
    const name = state.lang === "no" ? service.nameNo : service.nameEn;
    const description = state.lang === "no" ? service.descriptionNo : service.descriptionEn;
    return `
      <article class="service-card">
        <div>
          <h3>${escapeHtml(name)}</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="service-meta">
          <span class="price">${service.price} kr</span>
          <span class="duration">${service.duration} ${t("minutes")}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderBookingOptions() {
  const select = $("#bookingForm select[name='serviceId']");
  if (!select) return;
  select.innerHTML = state.data.services.map(service => {
    const name = state.lang === "no" ? service.nameNo : service.nameEn;
    return `<option value="${escapeHtml(service.id)}">${escapeHtml(name)} - ${service.price} kr</option>`;
  }).join("");
}

function setStatus(node, message, type = "") {
  if (!node) return;
  node.textContent = message;
  node.className = `form-status ${type}`;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function loadPublic() {
  state.data = await api("/api/bootstrap");
  renderGallery();
  applyTranslations();
}

function setupPublicForms() {
  const bookingForm = $("#bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = $("#bookingStatus");
      try {
        await api("/api/bookings", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
        event.currentTarget.reset();
        setStatus(status, t("bookingOk"), "ok");
      } catch {
        setStatus(status, t("error"), "error");
      }
    });
  }

  const contactForm = $("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async event => {
      event.preventDefault();
      const status = $("#contactStatus");
      try {
        await api("/api/contact", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
        event.currentTarget.reset();
        setStatus(status, t("contactOk"), "ok");
      } catch {
        setStatus(status, t("error"), "error");
      }
    });
  }
}

function setupLanguage() {
  $$(".lang-btn").forEach(button => {
    button.addEventListener("click", () => {
      state.lang = button.dataset.lang;
      localStorage.setItem("twcutz_lang", state.lang);
      applyTranslations();
    });
  });
}

async function loadAdmin() {
  state.adminData = await api("/api/admin/dashboard");
  renderAdmin();
}

function setupAdmin() {
  const adminLogin = $("#adminLogin");
  if (!adminLogin) return;

  adminLogin.addEventListener("submit", async event => {
    event.preventDefault();
    try {
      const payload = await api("/api/admin/login", { method: "POST", body: JSON.stringify(formData(event.currentTarget)) });
      state.adminToken = payload.token;
      localStorage.setItem("twcutz_admin_token", payload.token);
      $("#adminLogin").classList.add("hidden");
      $("#adminDashboard").classList.remove("hidden");
      setStatus($("#adminStatus"), "");
      await loadAdmin();
    } catch {
      setStatus($("#adminStatus"), "Feil e-post eller passord.", "error");
    }
  });

  $$(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach(item => item.classList.remove("active"));
      $$(".admin-pane").forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active");
    });
  });

  if (state.adminToken) {
    $("#adminLogin").classList.add("hidden");
    $("#adminDashboard").classList.remove("hidden");
    loadAdmin().catch(() => {
      state.adminToken = "";
      localStorage.removeItem("twcutz_admin_token");
      $("#adminLogin").classList.remove("hidden");
      $("#adminDashboard").classList.add("hidden");
    });
  }
}

function serviceNameById(serviceId) {
  const service = [...state.data.services, ...(state.adminData?.services || [])].find(item => item.id === serviceId);
  return service ? `${service.nameNo} / ${service.nameEn}` : serviceId;
}

function renderAdmin() {
  if (!state.adminData) return;
  renderAdminBookings();
  renderAdminServices();
  renderAdminGallery();
  renderAdminMessages();
  renderAdminContent();
}

function renderAdminBookings() {
  const pane = $("#bookings");
  if (!pane) return;
  pane.innerHTML = state.adminData.bookings.map(booking => `
    <article class="admin-card">
      <div class="admin-card-header">
        <div>
          <strong>${escapeHtml(booking.customerName)}</strong>
          <small>${escapeHtml(booking.date)} ${escapeHtml(booking.time)} - ${escapeHtml(serviceNameById(booking.serviceId))}</small>
        </div>
        <select data-booking-status="${escapeHtml(booking.id)}">
          ${["ny", "bekreftet", "fullført", "kansellert"].map(status => `<option ${booking.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <small>${escapeHtml(booking.phone)}${booking.email ? ` - ${escapeHtml(booking.email)}` : ""}</small>
      <p>${escapeHtml(booking.comment || "")}</p>
    </article>
  `).join("") || `<p class="form-status">Ingen bookinger enda.</p>`;

  $$("[data-booking-status]").forEach(select => {
    select.addEventListener("change", async () => {
      await api(`/api/admin/bookings/${select.dataset.bookingStatus}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
      await loadAdmin();
    });
  });
}

function renderAdminServices() {
  const pane = $("#servicesAdmin");
  if (!pane) return;
  pane.innerHTML = `
    <form class="form-panel" id="serviceEditor">
      <div class="admin-form-grid">
        <input name="id" type="hidden">
        <label><span>Navn NO</span><input name="nameNo" required></label>
        <label><span>Name EN</span><input name="nameEn" required></label>
        <label class="wide"><span>Beskrivelse NO</span><textarea name="descriptionNo" rows="3" required></textarea></label>
        <label class="wide"><span>Description EN</span><textarea name="descriptionEn" rows="3" required></textarea></label>
        <label><span>Pris</span><input name="price" type="number" min="0" required></label>
        <label><span>Varighet</span><input name="duration" type="number" min="0" required></label>
        <label><span>Aktiv</span><select name="active"><option value="true">Aktiv</option><option value="false">Inaktiv</option></select></label>
      </div>
      <button class="btn primary" type="submit">Lagre tjeneste</button>
    </form>
    ${state.adminData.services.map(service => `
      <article class="admin-card">
        <div class="admin-card-header">
          <div><strong>${escapeHtml(service.nameNo)}</strong><small>${escapeHtml(service.nameEn)} - ${service.price} kr - ${service.duration} min</small></div>
          <div class="admin-actions">
            <button class="btn compact" data-edit-service="${escapeHtml(service.id)}" type="button">Rediger</button>
            <button class="btn compact" data-delete-service="${escapeHtml(service.id)}" type="button">Slett</button>
          </div>
        </div>
        <small>${service.active ? "Aktiv" : "Inaktiv"}</small>
      </article>
    `).join("")}
  `;

  $("#serviceEditor").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = formData(event.currentTarget);
    payload.price = Number(payload.price);
    payload.duration = Number(payload.duration);
    payload.active = payload.active === "true";
    await api("/api/admin/services", { method: "PUT", body: JSON.stringify(payload) });
    event.currentTarget.reset();
    await loadPublic();
    await loadAdmin();
  });

  $$("[data-edit-service]").forEach(button => {
    button.addEventListener("click", () => {
      const service = state.adminData.services.find(item => item.id === button.dataset.editService);
      Object.entries(service).forEach(([key, value]) => {
        const field = $(`#serviceEditor [name="${key}"]`);
        if (field) field.value = String(value);
      });
    });
  });

  $$("[data-delete-service]").forEach(button => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/services/${button.dataset.deleteService}`, { method: "DELETE" });
      await loadPublic();
      await loadAdmin();
    });
  });
}

function renderAdminGallery() {
  const pane = $("#galleryAdmin");
  if (!pane) return;
  pane.innerHTML = `
    <form class="form-panel" id="galleryEditor">
      <div class="admin-form-grid">
        <input name="id" type="hidden">
        <label><span>Tittel</span><input name="title" required></label>
        <label><span>Kategori</span><input name="category" required></label>
        <label class="wide"><span>Bilde-URL</span><input name="image"></label>
        <label class="wide"><span>Last opp bilde</span><input id="galleryFile" type="file" accept="image/*"></label>
        <label><span>Publisert</span><select name="published"><option value="true">Publisert</option><option value="false">Ikke publisert</option></select></label>
      </div>
      <button class="btn primary" type="submit">Lagre bilde</button>
    </form>
    ${state.adminData.gallery.map(item => `
      <article class="admin-card">
        <div class="admin-card-header">
          <div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} - ${item.published ? "publisert" : "skjult"}</small></div>
          <div class="admin-actions">
            <button class="btn compact" data-edit-gallery="${escapeHtml(item.id)}" type="button">Rediger</button>
            <button class="btn compact" data-delete-gallery="${escapeHtml(item.id)}" type="button">Slett</button>
          </div>
        </div>
      </article>
    `).join("")}
  `;

  $("#galleryFile").addEventListener("change", event => {
    const file = event.currentTarget.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      $("#galleryEditor [name='image']").value = reader.result;
    };
    reader.readAsDataURL(file);
  });

  $("#galleryEditor").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = formData(event.currentTarget);
    payload.published = payload.published === "true";
    await api("/api/admin/gallery", { method: "PUT", body: JSON.stringify(payload) });
    event.currentTarget.reset();
    await loadPublic();
    await loadAdmin();
  });

  $$("[data-edit-gallery]").forEach(button => {
    button.addEventListener("click", () => {
      const item = state.adminData.gallery.find(entry => entry.id === button.dataset.editGallery);
      Object.entries(item).forEach(([key, value]) => {
        const field = $(`#galleryEditor [name="${key}"]`);
        if (field) field.value = String(value);
      });
    });
  });

  $$("[data-delete-gallery]").forEach(button => {
    button.addEventListener("click", async () => {
      await api(`/api/admin/gallery/${button.dataset.deleteGallery}`, { method: "DELETE" });
      await loadPublic();
      await loadAdmin();
    });
  });
}

function renderAdminMessages() {
  const pane = $("#messagesAdmin");
  if (!pane) return;
  pane.innerHTML = state.adminData.messages.map(message => `
    <article class="admin-card">
      <div class="admin-card-header">
        <div><strong>${escapeHtml(message.name)}</strong><small>${escapeHtml(message.contact)} - ${new Date(message.createdAt).toLocaleString()}</small></div>
        <select data-message-status="${escapeHtml(message.id)}">
          ${["ny", "lest", "besvart"].map(status => `<option ${message.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </div>
      <p>${escapeHtml(message.message)}</p>
    </article>
  `).join("") || `<p class="form-status">Ingen meldinger enda.</p>`;

  $$("[data-message-status]").forEach(select => {
    select.addEventListener("change", async () => {
      await api(`/api/admin/messages/${select.dataset.messageStatus}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
      await loadAdmin();
    });
  });
}

function renderAdminContent() {
  const pane = $("#contentAdmin");
  if (!pane) return;
  const content = state.adminData.content;
  pane.innerHTML = `
    <form class="form-panel" id="contentEditor">
      <label><span>Hero note NO</span><textarea name="heroNoteNo" rows="2">${escapeHtml(content.heroNoteNo)}</textarea></label>
      <label><span>Hero note EN</span><textarea name="heroNoteEn" rows="2">${escapeHtml(content.heroNoteEn)}</textarea></label>
      <label><span>Om tekst NO</span><textarea name="aboutNo" rows="5">${escapeHtml(content.aboutNo)}</textarea></label>
      <label><span>About text EN</span><textarea name="aboutEn" rows="5">${escapeHtml(content.aboutEn)}</textarea></label>
      <button class="btn primary" type="submit">Lagre tekst</button>
    </form>
  `;

  $("#contentEditor").addEventListener("submit", async event => {
    event.preventDefault();
    await api("/api/admin/content", { method: "PUT", body: JSON.stringify(formData(event.currentTarget)) });
    await loadPublic();
    await loadAdmin();
  });
}

async function init() {
  setupLanguage();
  setupPublicForms();
  setupAdmin();
  await loadPublic();
}

init().catch(error => {
  console.error(error);
});
