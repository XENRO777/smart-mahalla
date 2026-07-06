// ═════════════════════════════════════════════════════════════════════
// SmartMahalla — Node.js Express Backend
// Auth, AI Assistant, and Python subprocess integration
// ═════════════════════════════════════════════════════════════════════

const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// ─── Env ──────────────────────────────────────────────────────────
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const PORT = process.env.PORT ?? 8000;
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

// ─── Express setup ────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────
// 1. MOCK USER STORE
// ─────────────────────────────────────────────────────────────────
// In-memory users — replace with a real database later.
// The `roles` array maps to the frontend's deriveDashboardRole():
//   admin  → HOKIMIYAT
//   rais / kotib → MAHALLA
//   user   → FUQARO

const USERS = [
  {
    id: "u-admin-001",
    email: "admin@sardoba.uz",
    password: "admin123",
    full_name: "Sardoba Tuman Hokimi",
    roles: ["admin"],
    mahalla_id: null,
    phone: "+998901234567",
  },
  {
    id: "u-rais-001",
    email: "rais@mahalla1.uz",
    password: "rais123",
    full_name: "Alisher Karimov",
    roles: ["rais"],
    mahalla_id: "m-001",
    phone: "+998901234568",
  },
  {
    id: "u-kotib-001",
    email: "kotib@mahalla1.uz",
    password: "kotib123",
    full_name: "Dilshod Mamatov",
    roles: ["kotib"],
    mahalla_id: "m-001",
    phone: "+998901234569",
  },
  {
    id: "u-user-001",
    email: "user@example.uz",
    password: "user123",
    full_name: "Jahongir Toshpo'latov",
    roles: ["user"],
    mahalla_id: "m-001",
    phone: "+998901234570",
  },
];

// In-memory token store (maps token → userId)
const TOKENS = new Map();

// ─────────────────────────────────────────────────────────────────
// 2. HELPERS
// ─────────────────────────────────────────────────────────────────

/** Create a simple pseudo-JWT (base64-encoded payload + signature). */
function createToken(userId) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24h
    })
  );
  const signature = btoa(`${JWT_SECRET}:${payload}`);
  return `${header}.${payload}.${signature}`;
}

/** Extract userId from a token stored in our map. */
function resolveToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return TOKENS.get(token) ?? null;
}

/** Strip the password field before sending user data to the client. */
function sanitizeUser(user) {
  const { password, ...safe } = user;
  safe.last_login = new Date().toISOString();
  return safe;
}

/** Standard success response wrapper. */
function ok(res, data, message = "OK") {
  return res.json({ success: true, data, message });
}

/** Standard error response wrapper. */
function fail(res, status, message) {
  return res.status(status).json({ success: false, data: null, message });
}

// ─────────────────────────────────────────────────────────────────
// 3. AUTH ROUTES  —  /api/v1/auth/*
// ─────────────────────────────────────────────────────────────────

// ─── POST /api/v1/auth/login ─────────────────────────────────────
app.post("/api/v1/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return fail(res, 422, "Email va parol majburiy maydonlar.");
  }

  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    return fail(res, 401, "Email yoki parol noto'g'ri.");
  }

  const token = createToken(user.id);
  TOKENS.set(token, user.id);

  console.log(`[auth] ✓ ${email} logged in (roles: ${user.roles.join(", ")})`);

  return ok(res, { user: sanitizeUser(user), token }, "Tizimga muvaffaqiyatli kirdingiz.");
});

// ─── POST /api/v1/auth/register ──────────────────────────────────
app.post("/api/v1/auth/register", (req, res) => {
  const { email, password, full_name, mahalla_id, phone, pinfl, household, birth_year } = req.body ?? {};

  if (!email || !password || !full_name) {
    return fail(res, 422, "Email, parol va to'liq ism majburiy.");
  }
  if (USERS.find((u) => u.email === email)) {
    return fail(res, 409, "Bu email allaqachon ro'yxatdan o'tgan.");
  }

  const newUser = {
    id: `u-${uuidv4().slice(0, 8)}`,
    email,
    password,
    full_name,
    roles: ["user"],
    mahalla_id: mahalla_id ?? null,
    phone: phone ?? null,
  };

  USERS.push(newUser);

  // Also create a citizen record so the user appears in Aholi list
  const mahalla = MAHALLALAR.find((m) => m.id === mahalla_id);
  const newCitizen = {
    id: `c-${uuidv4().slice(0, 8)}`,
    full_name,
    pinfl: pinfl || null,
    birth_year: birth_year ? parseInt(birth_year) : null,
    household: household || null,
    phone: phone || null,
    mahalla_id: mahalla_id ?? null,
    mahalla: mahalla?.name ?? "Noma'lum",
    status: "oddiy",
    notebook: null,
    tokens: 0,
  };
  CITIZENS.push(newCitizen);

  const token = createToken(newUser.id);
  TOKENS.set(token, newUser.id);

  console.log(`[auth] ✓ ${email} registered (citizen record created)`);

  return ok(
    res,
    { user: sanitizeUser(newUser), token },
    "Ro'yxatdan o'tdingiz! Tizimga kirilmoqda..."
  );
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────
app.get("/api/v1/auth/me", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Token noto'g'ri yoki muddati tugagan.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  return ok(res, sanitizeUser(user));
});

// ─── POST /api/v1/auth/logout ────────────────────────────────────
app.post("/api/v1/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    TOKENS.delete(authHeader.slice(7));
  }
  return ok(res, null, "Tizimdan chiqildi.");
});

// ─────────────────────────────────────────────────────────────────
// 4. AI ASSISTANT CHAT  —  /api/v1/ai/chat
// ─────────────────────────────────────────────────────────────────
// This route is designed to call either:
//   A) A Python AI script via child_process.spawn
//   B) An OpenAI-compatible API directly
//
// The Python subprocess approach is ready to use below.
// Uncomment the relevant section and adjust PYTHON_PATH / script path.

app.post("/api/v1/ai/chat", (req, res) => {
  // Auth check — only logged-in users can chat
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }
  const { message, history } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return fail(res, 422, "Xabar matni majburiy.");
  }

  // ─── Option A: Call OpenAI-compatible API directly ────────────
  // const apiKey = process.env.OPENAI_API_KEY;
  // if (apiKey) {
  //   try {
  //     const response = await fetch("https://api.openai.com/v1/chat/completions", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${apiKey}`,
  //       },
  //       body: JSON.stringify({
  //         model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  //         messages: [
  //           { role: "system", content: "You are a helpful assistant for the SmartMahalla platform." },
  //           ...(history ?? []),
  //           { role: "user", content: message },
  //         ],
  //       }),
  //     });
  //     const data = await response.json();
  //     const reply = data.choices?.[0]?.message?.content ?? "Xatolik yuz berdi.";
  //     return ok(res, { reply }, "OK");
  //   } catch (err) {
  //     return fail(res, 500, "AI server bilan bog'lanib bo'lmadi.");
  //   }
  // }

  // ─── Option B: Python subprocess (child_process.spawn) ────────
  // First, try to call the Python AI script. If Python is not available
  // or the script fails, fall back to mock responses.

  const pythonPath = process.env.PYTHON_PATH ?? "python";
  const scriptPath = path.resolve(__dirname, "ai_assistant.py");
  const input = JSON.stringify({ message, history: history ?? [] });

  // Pass Ollama config as environment variables to the Python subprocess
  const env = {
    ...process.env,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "llama3.2",
    OLLAMA_HOST: process.env.OLLAMA_HOST ?? "http://localhost:11434",
  };

  const py = spawn(pythonPath, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env,
  });

  let stdout = "";
  let stderr = "";

  py.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  let responded = false;

  py.on("error", (err) => {
    if (responded) return;
    responded = true;
    console.warn(`[ai] Python subprocess failed (${err.message}), using mock fallback.`);
    sendMockResponse(res, message);
  });

  py.on("close", (code) => {
    if (responded) return;
    responded = true;
    if (code !== 0) {
      console.error("[ai] Python stderr:", stderr);
      return sendMockResponse(res, message);
    }
    try {
      const result = JSON.parse(stdout);
      if (result.error) {
        console.warn("[ai] Python returned error:", result.error);
        return sendMockResponse(res, message);
      }
      return ok(res, { reply: result.reply }, "OK");
    } catch {
      console.warn("[ai] Failed to parse Python output, using mock fallback.");
      return sendMockResponse(res, message);
    }
  });

  try {
    py.stdin.write(input);
    py.stdin.end();
  } catch (stdinErr) {
    if (responded) return;
    responded = true;
    console.warn(`[ai] stdin write failed (${stdinErr.message}), using mock fallback.`);
    sendMockResponse(res, message);
  }
});

/**
 * Send a mock AI response when Python is unavailable or fails.
 */
function sendMockResponse(res, message) {
  console.log(`[ai] (mock) message: "${message}"`);
  const mockReplies = [
    "Mahallangizdagi so'nggi e'lonlarga ko'ra, ertaga hashar tashkil qilinadi.",
    "Token balansingizni tekshirish uchun 'Tokenlar' sahifasiga o'ting.",
    "Murojaatlaringiz holatini 'Murojaatlar' sahifasida ko'rishingiz mumkin.",
    "Sizning mahallangiz 42 ta mahalla orasida KPI bo'yicha 7-o'rinda.",
    "So'nggi yangilik: Sardoba tumanida ichimlik suvi ta'minoti yaxshilandi.",
  ];
  const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
  return ok(res, { reply }, "OK");
}

// ─────────────────────────────────────────────────────────────────
// 5. CITIZENS & MAHALLALAR  —  /api/v1/citizens/*, /api/v1/mahallalar/*
// ─────────────────────────────────────────────────────────────────

const CITIZENS = [
  {
    id: "c-001",
    full_name: "Jahongir Toshpo'latov",
    pinfl: "12345678901234",
    birth_year: 1990,
    household: "Mustaqillik ko'chasi, 15-uy",
    phone: "+998901234570",
    mahalla_id: "m-001",
    mahalla: "Mustaqillik Mahallasi",
    status: "faol",
    notebook: "Yoshlar daftari",
    tokens: 450,
  },
  {
    id: "c-002",
    full_name: "Gulnora Rasulova",
    pinfl: "23456789012345",
    birth_year: 1985,
    household: "Navoiy ko'chasi, 7-uy",
    phone: "+998901234571",
    mahalla_id: "m-001",
    mahalla: "Mustaqillik Mahallasi",
    status: "oddiy",
    notebook: null,
    tokens: 120,
  },
  {
    id: "c-003",
    full_name: "Bekzod Xasanov",
    pinfl: "34567890123456",
    birth_year: 2000,
    household: "Bog' ko'chasi, 3-uy",
    phone: "+998901234572",
    mahalla_id: "m-002",
    mahalla: "Navbahor Mahallasi",
    status: "faol",
    notebook: "Ayollar daftari",
    tokens: 300,
  },
  {
    id: "c-004",
    full_name: "Dilorom Karimova",
    pinfl: "45678901234567",
    birth_year: 1975,
    household: "Markaziy ko'cha, 22-uy",
    phone: "+998901234573",
    mahalla_id: "m-003",
    mahalla: "Istiqlol Mahallasi",
    status: "nogiron",
    notebook: "Nogironlar daftari",
    tokens: 500,
  },
  {
    id: "c-005",
    full_name: "Sardor Aliyev",
    pinfl: "56789012345678",
    birth_year: 1995,
    household: "Yangi hayot ko'chasi, 10-uy",
    phone: "+998901234574",
    mahalla_id: "m-002",
    mahalla: "Navbahor Mahallasi",
    status: "kam_taminlangan",
    notebook: "Temir daftar",
    tokens: 80,
  },
];

// ─── GET /api/v1/mahallalar — List all mahallalar ────────────────
app.get("/api/v1/mahallalar", (_req, res) => {
  const data = MAHALLALAR.map((m) => ({
    id: m.id,
    nomi: m.name,
    tuman: "Sardoba",
    sektor: m.sektor?.replace("-sektor", "") ?? null,
    rais_name: null,
  }));
  return ok(res, data);
});

// ─── GET /api/v1/citizens — Paginated, searchable citizen list ───
app.get("/api/v1/citizens", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) return fail(res, 401, "Iltimos, avval tizimga kiring.");

  const user = USERS.find((u) => u.id === userId);
  if (!user) return fail(res, 401, "Foydalanuvchi topilmadi.");

  const page = Math.max(0, parseInt(req.query.page) || 0);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
  const search = (req.query.search || "").toLowerCase();

  // Filter by mahalla for mahalla staff
  let filtered = [...CITIZENS];
  if (user.roles.some((r) => ["rais", "kotib"].includes(r)) && user.mahalla_id) {
    filtered = filtered.filter((c) => c.mahalla_id === user.mahalla_id);
  }

  // Apply search
  if (search) {
    filtered = filtered.filter(
      (c) =>
        c.full_name.toLowerCase().includes(search) ||
        (c.pinfl && c.pinfl.includes(search)) ||
        c.household.toLowerCase().includes(search) ||
        c.mahalla.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return ok(res, { items, total, page, page_size: pageSize, total_pages: totalPages });
});

// ─── POST /api/v1/citizens — Create a new citizen ────────────────
app.post("/api/v1/citizens", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) return fail(res, 401, "Iltimos, avval tizimga kiring.");

  const user = USERS.find((u) => u.id === userId);
  if (!user) return fail(res, 401, "Foydalanuvchi topilmadi.");

  // Only mahalla staff or admin can create citizens
  if (!user.roles.some((r) => ["rais", "kotib", "admin"].includes(r))) {
    return fail(res, 403, "Faqat mahalla xodimlari fuqaro qo'shishi mumkin.");
  }

  const { full_name, pinfl, birth_year, household, phone, notebook, status, mahalla_id } = req.body ?? {};

  if (!full_name) {
    return fail(res, 422, "F.I.Sh majburiy maydon.");
  }

  const targetMahallaId = mahalla_id || user.mahalla_id;
  const mahalla = MAHALLALAR.find((m) => m.id === targetMahallaId);

  const citizen = {
    id: `c-${uuidv4().slice(0, 8)}`,
    full_name: full_name.trim(),
    pinfl: pinfl || null,
    birth_year: birth_year ? parseInt(birth_year) : null,
    household: household || null,
    phone: phone || null,
    mahalla_id: targetMahallaId,
    mahalla: mahalla?.name ?? "Noma'lum",
    status: status || "oddiy",
    notebook: notebook || null,
    tokens: 0,
  };

  CITIZENS.push(citizen);
  console.log(`[citizens] ✓ ${user.full_name} added citizen "${full_name}"`);

  return ok(res, citizen, "Fuqaro qo'shildi.");
});

// ─────────────────────────────────────────────────────────────────
// 6. APPLICATIONS (Ariza)  —  /api/v1/applications/*
// ─────────────────────────────────────────────────────────────────
// Full lifecycle:
//   1. Citizen (FUQARO) submits → POST /api/v1/applications
//   2. Mahalla (MAHALLA) views their mahalla's apps → GET .../mahalla/:mahallaId
//   3. Mahalla assigns responsible person → PUT .../:id/assign
//   4. Hokimiyat views all apps → GET .../government

const MAHALLALAR = [
  { id: "m-001", name: "Mustaqillik Mahallasi", sektor: "1-sektor" },
  { id: "m-002", name: "Navbahor Mahallasi", sektor: "2-sektor" },
  { id: "m-003", name: "Istiqlol Mahallasi", sektor: "1-sektor" },
];

const APPLICATIONS = [
  {
    id: "app-001",
    citizenId: "u-user-001",
    citizenName: "Jahongir Toshpo'latov",
    citizenPhone: "+998901234570",
    mahallaId: "m-001",
    mahallaName: "Mustaqillik Mahallasi",
    title: "Ko'cha chiroqlari nosoz",
    description: "Mustaqillik ko'chasidagi 3 ta chiroq bir haftadan beri ishlamayapti. Kechqurun ko'cha qorong'i bo'lib qolmoqda.",
    status: "YANGI",
    responsiblePerson: null,
    responsibleNotes: null,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    aiCategory: null,
    aiSummary: null,
    aiPriority: null,
    aiSuggestedDepartment: null,
    aiProcessingStatus: "failed",
  },
  {
    id: "app-002",
    citizenId: "u-user-001",
    citizenName: "Jahongir Toshpo'latov",
    citizenPhone: "+998901234570",
    mahallaId: "m-001",
    mahallaName: "Mustaqillik Mahallasi",
    title: "Suv quvuri yorilgan",
    description: "Navoiy ko'chasida suv quvuri yorilgan, suv yo'qotilmoqda.",
    status: "JARAYONDA",
    responsiblePerson: "Bobur Murodov",
    responsibleNotes: "Ta'mirlash guruhi yuborildi",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    aiCategory: null,
    aiSummary: null,
    aiPriority: null,
    aiSuggestedDepartment: null,
    aiProcessingStatus: "failed",
  },
  {
    id: "app-003",
    citizenId: "u-user-001",
    citizenName: "Jahongir Toshpo'latov",
    citizenPhone: "+998901234570",
    mahallaId: "m-002",
    mahallaName: "Navbahor Mahallasi",
    title: "Axlat to'plami tozalanmagan",
    description: "Axlat konteynerlari to'lib toshgan, 3 kundan beri tozalanmagan.",
    status: "BAJARILDI",
    responsiblePerson: "Akbar Xasanov",
    responsibleNotes: "Axlat olib ketildi, hudud tozalandi",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    aiCategory: null,
    aiSummary: null,
    aiPriority: null,
    aiSuggestedDepartment: null,
    aiProcessingStatus: "failed",
  },
  {
    id: "app-004",
    citizenId: "u-user-001",
    citizenName: "Jahongir Toshpo'latov",
    citizenPhone: "+998901234570",
    mahallaId: "m-003",
    mahallaName: "Istiqlol Mahallasi",
    title: "Yo'l ta'miri kerak",
    description: "Markaziy ko'chada chuqur paydo bo'lgan, mashinalar o'tolmayapti.",
    status: "RAD_ETILDI",
    responsiblePerson: null,
    responsibleNotes: "Yo'l ta'miri tuman budjetiga kiritilmagan",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    aiCategory: null,
    aiSummary: null,
    aiPriority: null,
    aiSuggestedDepartment: null,
    aiProcessingStatus: "failed",
  },
];

// ─── Helper: enrich application with mahalla name ──────────────
function enrichApp(app) {
  const mahalla = MAHALLALAR.find((m) => m.id === app.mahallaId);
  return { ...app, mahallaName: mahalla?.name ?? app.mahallaName ?? "Noma'lum" };
}

// ─── Background AI classification ────────────────────────────────
// Runs after the citizen submits an application.
// Never throws — all errors are caught and result in null AI fields.

function processApplicationWithAI(appId) {
  const app = APPLICATIONS.find((a) => a.id === appId);
  if (!app) return;

  const pythonPath = process.env.PYTHON_PATH ?? "python";
  const scriptPath = path.resolve(__dirname, "ai_assistant.py");

  // Prepare input for the Python script
  const input = JSON.stringify({
    action: "classify",
    title: app.title,
    description: app.description,
  });

  const env = {
    ...process.env,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "llama3.2",
    OLLAMA_HOST: process.env.OLLAMA_HOST ?? "http://localhost:11434",
  };

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    py.kill();
    app.aiProcessingStatus = "failed";
    console.warn(`[ai] classify timeout for app ${appId}`);
  }, 5000);

  const py = spawn(pythonPath, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env,
  });

  let stdout = "";
  let stderr = "";

  py.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  py.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  py.on("error", (err) => {
    clearTimeout(timeout);
    if (timedOut) return;
    console.warn(`[ai] classify spawn failed for app ${appId}: ${err.message}`);
    app.aiProcessingStatus = "failed";
  });

  py.on("close", (code) => {
    clearTimeout(timeout);
    if (timedOut) return;

    if (code !== 0) {
      console.warn(`[ai] classify script exited with code ${code} for app ${appId}`);
      app.aiProcessingStatus = "failed";
      return;
    }

    try {
      const result = JSON.parse(stdout);
      app.aiCategory = result.category || null;
      app.aiSummary = result.summary || null;
      app.aiPriority = result.priority || null;
      app.aiSuggestedDepartment = result.suggestedDepartment || null;
      app.aiProcessingStatus = "done";
      console.log(`[ai] ✓ classified app ${appId}: ${app.aiCategory} (${app.aiPriority})`);
    } catch {
      console.warn(`[ai] classify parse failed for app ${appId}: ${stdout.slice(0, 100)}`);
      app.aiProcessingStatus = "failed";
    }
  });

  try {
    py.stdin.write(input);
    py.stdin.end();
  } catch (stdinErr) {
    clearTimeout(timeout);
    if (timedOut) return;
    console.warn(`[ai] classify stdin error for app ${appId}: ${stdinErr.message}`);
    app.aiProcessingStatus = "failed";
  }
}

// ─── POST /api/v1/applications — Citizen submits a new application ──
app.post("/api/v1/applications", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  // Only citizens (FUQARO) can submit applications
  if (!user.roles.includes("user") || user.roles.length > 1) {
    return fail(res, 403, "Faqat fuqarolar murojaat yuborishi mumkin.");
  }

  const { mahallaId, title, description } = req.body ?? {};

  if (!mahallaId || !title || !description) {
    return fail(res, 422, "Mahalla, sarlavha va tavsif majburiy maydonlar.");
  }

  const mahalla = MAHALLALAR.find((m) => m.id === mahallaId);

  const app = {
    id: `app-${uuidv4().slice(0, 8)}`,
    citizenId: user.id,
    citizenName: user.full_name,
    citizenPhone: user.phone,
    mahallaId,
    mahallaName: mahalla?.name ?? "Noma'lum",
    title,
    description,
    status: "YANGI",
    responsiblePerson: null,
    responsibleNotes: null,
    createdAt: new Date().toISOString(),
    // AI fields — populated asynchronously
    aiCategory: null,
    aiSummary: null,
    aiPriority: null,
    aiSuggestedDepartment: null,
    aiProcessingStatus: "pending",
  };

  APPLICATIONS.push(app);
  console.log(`[apps] ✓ ${user.full_name} submitted application "${title}" (AI pending)`);

  // Fire background AI classification (non-blocking)
  setTimeout(() => processApplicationWithAI(app.id), 0);

  return ok(res, app, "Murojaatingiz qabul qilindi.");
});

// ─── GET /api/v1/applications/stats — Dashboard stats (role-based) ────────────────
app.get("/api/v1/applications/stats", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  // FUQARO → their own apps only
  if (user.roles.includes("user") && user.roles.length === 1) {
    const myApps = APPLICATIONS.filter((a) => a.citizenId === user.id);
    return ok(res, {
      total: myApps.length,
      yangi: myApps.filter((a) => a.status === "YANGI").length,
      jarayonda: myApps.filter((a) => a.status === "JARAYONDA").length,
      bajarilgan: myApps.filter((a) => a.status === "BAJARILDI").length,
      rad_etilgan: myApps.filter((a) => a.status === "RAD_ETILDI").length,
      citizens_total: CITIZENS.length,
      role: "FUQARO",
    });
  }

  // MAHALLA (rais/kotib) → their mahalla's apps
  if (user.roles.some((r) => ["rais", "kotib"].includes(r)) && user.mahalla_id) {
    const mahallaApps = APPLICATIONS.filter((a) => a.mahallaId === user.mahalla_id);
    const mahallaCitizens = CITIZENS.filter((c) => c.mahalla_id === user.mahalla_id);
    return ok(res, {
      total: mahallaApps.length,
      yangi: mahallaApps.filter((a) => a.status === "YANGI").length,
      jarayonda: mahallaApps.filter((a) => a.status === "JARAYONDA").length,
      bajarilgan: mahallaApps.filter((a) => a.status === "BAJARILDI").length,
      rad_etilgan: mahallaApps.filter((a) => a.status === "RAD_ETILDI").length,
      citizens_total: mahallaCitizens.length,
      role: "MAHALLA",
      mahalla_id: user.mahalla_id,
      mahallaName: MAHALLALAR.find((m) => m.id === user.mahalla_id)?.name ?? "Noma'lum",
    });
  }

  // HOKIMIYAT (admin) → all apps across all mahallas
  if (user.roles.includes("admin")) {
    const allApps = APPLICATIONS;
    return ok(res, {
      total: allApps.length,
      yangi: allApps.filter((a) => a.status === "YANGI").length,
      jarayonda: allApps.filter((a) => a.status === "JARAYONDA").length,
      bajarilgan: allApps.filter((a) => a.status === "BAJARILDI").length,
      rad_etilgan: allApps.filter((a) => a.status === "RAD_ETILDI").length,
      citizens_total: CITIZENS.length,
      role: "HOKIMIYAT",
      totalMahallas: MAHALLALAR.length,
    });
  }

  return fail(res, 403, "Rolingiz aniqlanmadi.");
});

// ─── GET /api/v1/applications/mahalla/:mahallaId — Mahalla admin views their apps ──
app.get("/api/v1/applications/mahalla/:mahallaId", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  const { mahallaId } = req.params;

  // Only mahalla staff (rais/kotib) for this mahalla OR admin (hokimiyat) can view
  const isStaffForThisMahalla = (
    user.mahalla_id === mahallaId &&
    user.roles.some((r) => ["rais", "kotib"].includes(r))
  );
  const isAdmin = user.roles.includes("admin");

  if (!isStaffForThisMahalla && !isAdmin) {
    return fail(res, 403, "Faqat mahalla raisi yoki kotibi ko'rishi mumkin.");
  }

  const apps = APPLICATIONS
    .filter((a) => a.mahallaId === mahallaId)
    .map(enrichApp)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return ok(res, apps);
});

// ─── PUT /api/v1/applications/:id/assign — Mahalla admin assigns & updates status ──
app.put("/api/v1/applications/:id/assign", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  const app = APPLICATIONS.find((a) => a.id === req.params.id);
  if (!app) {
    return fail(res, 404, "Murojaat topilmadi.");
  }

  // Only MAHALLA staff (rais/kotib) for this mahalla, or admin can assign
  const isStaffForThisMahalla = (
    user.mahalla_id === app.mahallaId &&
    user.roles.some((r) => ["rais", "kotib"].includes(r))
  );
  const isAdmin = user.roles.includes("admin");

  if (!isStaffForThisMahalla && !isAdmin) {
    return fail(res, 403, "Siz faqat o'z mahallangizdagi murojaatlarni tayinlashingiz mumkin.");
  }

  const { responsiblePerson, status, responsibleNotes } = req.body ?? {};
  const validStatuses = ["YANGI", "JARAYONDA", "BAJARILDI", "RAD_ETILDI"];

  if (status && !validStatuses.includes(status)) {
    return fail(res, 422, `Noto'g'ri status. Qabul qilinadigan: ${validStatuses.join(", ")}`);
  }

  if (responsiblePerson) app.responsiblePerson = responsiblePerson;
  if (status) app.status = status;
  if (responsibleNotes !== undefined) app.responsibleNotes = responsibleNotes;

  console.log(`[apps] ✓ ${user.full_name} updated app ${app.id} → status: ${app.status}`);

  return ok(res, enrichApp(app), "Murojaat yangilandi.");
});

// ─── GET /api/v1/applications/government — Hokimiyat views ALL applications ──
app.get("/api/v1/applications/government", (req, res) => {
  const userId = resolveToken(req.headers.authorization);
  if (!userId) {
    return fail(res, 401, "Iltimos, avval tizimga kiring.");
  }

  const user = USERS.find((u) => u.id === userId);
  if (!user) {
    return fail(res, 401, "Foydalanuvchi topilmadi.");
  }

  // Only admin can view government dashboard
  if (!user.roles.includes("admin")) {
    return fail(res, 403, "Faqat hokimiyat xodimlari ko'rishi mumkin.");
  }

  const apps = APPLICATIONS
    .map(enrichApp)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return ok(res, apps);
});

// ─────────────────────────────────────────────────────────────────
// 6. HEALTH CHECK
// ─────────────────────────────────────────────────────────────────

app.get("/api/v1/health", (_req, res) => {
  return ok(res, { status: "ok", uptime: process.uptime() });
});

// ─────────────────────────────────────────────────────────────────
// 6. START
// ─────────────────────────────────────────────────────────────────

// ─── Global error handler (catches JSON parse errors, etc.) ────
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err.message ?? err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return fail(res, 400, "Noto'g'ri JSON format.");
  }
  return fail(res, 500, "Server xatoligi.");
});

// ─────────────────────────────────────────────────────────────────
// 6. START
// ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log(`  ║   SmartMahalla Backend                       ║`);
  console.log(`  ║   → http://localhost:${PORT}                  ║`);
  console.log(`  ║   → http://localhost:${PORT}/api/v1/health    ║`);
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Auth routes:`);
  console.log(`    POST /api/v1/auth/login`);
  console.log(`    POST /api/v1/auth/register`);
  console.log(`    GET  /api/v1/auth/me`);
  console.log(`    POST /api/v1/auth/logout`);
  console.log(`  AI route:`);
  console.log(`    POST /api/v1/ai/chat`);
  console.log(`  Test users:`);
  console.log(`    admin@sardoba.uz  / admin123  → HOKIMIYAT`);
  console.log(`    rais@mahalla1.uz  / rais123   → MAHALLA`);
  console.log(`    kotib@mahalla1.uz / kotib123  → MAHALLA`);
  console.log(`    user@example.uz   / user123   → FUQARO`);
  console.log("");
});
