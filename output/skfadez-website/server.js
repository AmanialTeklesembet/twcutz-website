const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SECRET = process.env.SESSION_SECRET || "skfadez-local-dev-secret-change-me";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@skfadez.no";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "skfadez";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function nowIso() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, encoded) {
  const [salt, expected] = String(encoded || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}

function createSeedData() {
  return {
    services: [
      {
        id: id("svc"),
        nameNo: "Skinfade",
        nameEn: "Skin Fade",
        descriptionNo: "Skarp skinfade med ren overgang, styling og premium finish.",
        descriptionEn: "Sharp skin fade with clean blend, styling and premium finish.",
        price: 500,
        duration: 45,
        active: true
      },
      {
        id: id("svc"),
        nameNo: "Klipp og skjegg",
        nameEn: "Haircut and Beard",
        descriptionNo: "Komplett klipp, skjeggform, line-up og rolig finish.",
        descriptionEn: "Complete haircut, beard shape, line-up and calm finish.",
        price: 700,
        duration: 60,
        active: true
      },
      {
        id: id("svc"),
        nameNo: "Line-up / Shape-up",
        nameEn: "Line-up / Shape-up",
        descriptionNo: "Presise kanter rundt hårfeste og skjegg for en fresh finish.",
        descriptionEn: "Precise edges around hairline and beard for a fresh finish.",
        price: 300,
        duration: 25,
        active: true
      }
    ],
    bookings: [],
    availabilitySlots: [
      {
        id: id("slot"),
        date: "2026-06-27",
        time: "12:00",
        status: "ledig",
        active: true,
        note: "Åpen time"
      },
      {
        id: id("slot"),
        date: "2026-06-27",
        time: "14:30",
        status: "ledig",
        active: true,
        note: "Åpen time"
      },
      {
        id: id("slot"),
        date: "2026-06-28",
        time: "16:00",
        status: "ledig",
        active: true,
        note: "Åpen time"
      }
    ],
    gallery: [
      {
        id: id("gal"),
        image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
        title: "Clean fade detail",
        category: "fades",
        published: true
      },
      {
        id: id("gal"),
        image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
        title: "Fresh barber profile",
        category: "cuts",
        published: true
      },
      {
        id: id("gal"),
        image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80",
        title: "Barbershop mood",
        category: "studio",
        published: true
      }
    ],
    messages: [],
    content: {
      aboutNo: "SKFADEZ er et premium fade-konsept bygget rundt skarpe overganger, rene linjer og en bookingopplevelse som føles like profesjonell som resultatet.",
      aboutEn: "SKFADEZ is a premium fade concept built around sharp blends, clean line-ups and a booking experience that feels as professional as the result.",
      heroNoteNo: "Premium fades, rene linjer og en eksklusiv bookingopplevelse i svart, hvitt og gull.",
      heroNoteEn: "Premium fades, clean line-ups and an exclusive black, white and gold booking experience."
    },
    adminUsers: [
      {
        id: id("adm"),
        email: ADMIN_EMAIL,
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: "owner"
      }
    ]
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) writeDb(createSeedData());
}

function normalizeDb(db) {
  if (!Array.isArray(db.availabilitySlots)) db.availabilitySlots = [];
  db.bookings = (db.bookings || []).map(booking => ({
    slotId: "",
    ...booking
  }));
  return db;
}

function readDb() {
  ensureDb();
  return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function send(res, status, payload, headers = {}) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": typeof payload === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, payload);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 8 * 1024 * 1024) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function sanitizeText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function signToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 8
  })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function getAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (session.exp < Date.now()) return null;
  return session;
}

function requireAdmin(req, res) {
  const session = getAuth(req);
  if (!session) {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
}

function publicPayload(db) {
  return {
    services: db.services.filter(service => service.active),
    availabilitySlots: db.availabilitySlots
      .filter(slot => slot.active && slot.status === "ledig")
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    gallery: db.gallery.filter(item => item.published),
    content: db.content,
    contactUrl: "mailto:admin@skfadez.no",
    phone: "92137051"
  };
}

function upsertById(list, item, prefix) {
  if (item.id) {
    const index = list.findIndex(existing => existing.id === item.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...item };
      return list[index];
    }
  }
  const created = { ...item, id: id(prefix) };
  list.unshift(created);
  return created;
}

async function handleApi(req, res, url) {
  const db = readDb();

  if (req.method === "GET" && url.pathname === "/api/bootstrap") {
    return sendJson(res, 200, publicPayload(db));
  }

  if (req.method === "POST" && url.pathname === "/api/bookings") {
    const body = await parseBody(req);
    const slotId = sanitizeText(body.slotId, 80);
    const slot = db.availabilitySlots.find(item => item.id === slotId);
    if (!slot || !slot.active || slot.status !== "ledig") {
      return sendJson(res, 400, { error: "Selected time is not available" });
    }
    const booking = {
      id: id("book"),
      customerName: sanitizeText(body.customerName, 120),
      phone: sanitizeText(body.phone, 60),
      email: sanitizeText(body.email, 120),
      serviceId: sanitizeText(body.serviceId, 80),
      slotId,
      date: slot.date,
      time: slot.time,
      status: "ny",
      comment: sanitizeText(body.comment, 800),
      createdAt: nowIso()
    };
    if (!booking.customerName || !booking.phone || !booking.serviceId) {
      return sendJson(res, 400, { error: "Missing required booking fields" });
    }
    slot.status = "reservert";
    slot.bookingId = booking.id;
    db.bookings.unshift(booking);
    writeDb(db);
    return sendJson(res, 201, { ok: true, booking });
  }

  if (req.method === "POST" && url.pathname === "/api/contact") {
    const body = await parseBody(req);
    const message = {
      id: id("msg"),
      name: sanitizeText(body.name, 120),
      contact: sanitizeText(body.contact, 160),
      message: sanitizeText(body.message, 1200),
      status: "ny",
      createdAt: nowIso()
    };
    if (!message.name || !message.contact || !message.message) {
      return sendJson(res, 400, { error: "Missing required contact fields" });
    }
    db.messages.unshift(message);
    writeDb(db);
    return sendJson(res, 201, { ok: true, message });
  }

  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    const body = await parseBody(req);
    const user = db.adminUsers.find(item => item.email.toLowerCase() === sanitizeText(body.email).toLowerCase());
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) {
      return sendJson(res, 401, { error: "Invalid login" });
    }
    return sendJson(res, 200, { token: signToken(user), user: { email: user.email, role: user.role } });
  }

  if (url.pathname.startsWith("/api/admin/")) {
    if (!requireAdmin(req, res)) return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/dashboard") {
    return sendJson(res, 200, {
      services: db.services,
      bookings: db.bookings,
      availabilitySlots: db.availabilitySlots.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
      gallery: db.gallery,
      messages: db.messages,
      content: db.content
    });
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/services") {
    const body = await parseBody(req);
    const service = upsertById(db.services, {
      id: sanitizeText(body.id, 80),
      nameNo: sanitizeText(body.nameNo, 120),
      nameEn: sanitizeText(body.nameEn, 120),
      descriptionNo: sanitizeText(body.descriptionNo, 500),
      descriptionEn: sanitizeText(body.descriptionEn, 500),
      price: Number(body.price || 0),
      duration: Number(body.duration || 0),
      active: Boolean(body.active)
    }, "svc");
    writeDb(db);
    return sendJson(res, 200, { ok: true, service });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/services/")) {
    const targetId = decodeURIComponent(url.pathname.split("/").pop());
    db.services = db.services.filter(service => service.id !== targetId);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/bookings/")) {
    const body = await parseBody(req);
    const targetId = decodeURIComponent(url.pathname.split("/").pop());
    const booking = db.bookings.find(item => item.id === targetId);
    if (!booking) return sendJson(res, 404, { error: "Not found" });
    if (["ny", "bekreftet", "fullført", "kansellert"].includes(body.status)) {
      booking.status = body.status;
      const slot = db.availabilitySlots.find(item => item.id === booking.slotId);
      if (slot) {
        if (body.status === "kansellert") {
          slot.status = "ledig";
          delete slot.bookingId;
        } else {
          slot.status = "reservert";
          slot.bookingId = booking.id;
        }
      }
    }
    writeDb(db);
    return sendJson(res, 200, { ok: true, booking });
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/availability") {
    const body = await parseBody(req);
    const slot = upsertById(db.availabilitySlots, {
      id: sanitizeText(body.id, 80),
      date: sanitizeText(body.date, 20),
      time: sanitizeText(body.time, 20),
      status: ["ledig", "reservert", "stengt"].includes(body.status) ? body.status : "ledig",
      active: Boolean(body.active),
      note: sanitizeText(body.note, 200)
    }, "slot");
    if (!slot.date || !slot.time) {
      return sendJson(res, 400, { error: "Missing date or time" });
    }
    writeDb(db);
    return sendJson(res, 200, { ok: true, slot });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/availability/")) {
    const targetId = decodeURIComponent(url.pathname.split("/").pop());
    const slot = db.availabilitySlots.find(item => item.id === targetId);
    if (slot?.bookingId) {
      return sendJson(res, 400, { error: "Cannot delete a reserved slot" });
    }
    db.availabilitySlots = db.availabilitySlots.filter(item => item.id !== targetId);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/gallery") {
    const body = await parseBody(req);
    const item = upsertById(db.gallery, {
      id: sanitizeText(body.id, 80),
      image: sanitizeText(body.image, 6000000),
      title: sanitizeText(body.title, 160),
      category: sanitizeText(body.category, 80),
      published: Boolean(body.published)
    }, "gal");
    writeDb(db);
    return sendJson(res, 200, { ok: true, item });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/gallery/")) {
    const targetId = decodeURIComponent(url.pathname.split("/").pop());
    db.gallery = db.gallery.filter(item => item.id !== targetId);
    writeDb(db);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/messages/")) {
    const body = await parseBody(req);
    const targetId = decodeURIComponent(url.pathname.split("/").pop());
    const message = db.messages.find(item => item.id === targetId);
    if (!message) return sendJson(res, 404, { error: "Not found" });
    if (["ny", "lest", "besvart"].includes(body.status)) message.status = body.status;
    writeDb(db);
    return sendJson(res, 200, { ok: true, message });
  }

  if (req.method === "PUT" && url.pathname === "/api/admin/content") {
    const body = await parseBody(req);
    db.content = {
      aboutNo: sanitizeText(body.aboutNo, 1400),
      aboutEn: sanitizeText(body.aboutEn, 1400),
      heroNoteNo: sanitizeText(body.heroNoteNo, 400),
      heroNoteEn: sanitizeText(body.heroNoteEn, 400)
    };
    writeDb(db);
    return sendJson(res, 200, { ok: true, content: db.content });
  }

  sendJson(res, 404, { error: "Not found" });
}

function serveStatic(req, res, url) {
  const cleanPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, cleanPath));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden");
  fs.readFile(filePath, (error, data) => {
    if (error) return send(res, 404, "Not found");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url);
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

ensureDb();
server.listen(PORT, () => {
  console.log(`SKFADEZ site running at http://localhost:${PORT}`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
