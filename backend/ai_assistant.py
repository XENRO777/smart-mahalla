#!/usr/bin/env python3
"""
SmartMahalla AI Assistant — Freebuf AI: SmartMahalla Guide for Citizens

Communicates with Node.js server via stdin/stdout JSON protocol.
Uses the local Ollama server (http://localhost:11434) for real AI responses.
Falls back to keyword-based mock when Ollama is unavailable.

Persona: Freebuf AI — SmartMahalla platformasining rasmiy yo'lko'rsatuvchisi.

Architecture:
  Node.js → stdin JSON → Python → ollama.Client() → local LLM
  Node.js ← stdout JSON ← Python

Setup:
  1. Install Ollama from https://ollama.com/download
  2. Pull a model: ollama pull llama3.2
  3. Run: ollama serve (or just leave Ollama running in background)
  4. The AI chat endpoint will automatically use the real model.
"""

import json
import os
import sys
import random

# ─── Ollama client (try importing, fall back to mock if unavailable) ──
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False


# ═════════════════════════════════════════════════════════════════════
# FREEBUF AI — SYSTEM PROMPT (Chat)
# ═════════════════════════════════════════════════════════════════════
# This prompt is sent to Ollama as the system message. It defines
# Freebuf's persona, tone, knowledge base and guardrails.
# ═════════════════════════════════════════════════════════════════════

CHAT_SYSTEM_PROMPT = """
Siz "Freebuf AI" siz — SmartMahalla platformasining rasmiy aqlli yo'lko'rsatuvchisi va yordamchisi.

## ASOSIY QOIDALAR
1. Till: DOIMO o'zbek tilida (lotin yozuvida) javob bering.
2. Muomala: Nihoyatda muloyim, hurmat bilan (SIZLAB — ya'ni "siz" formal shaklida) va tushunarli tarzda gaplashing.
3. Vazifa: SmartMahalla platformasida fuqarolarga kerakli bo'limlarga yo'l ko'rsatish, ariza topshirishda yordam berish, tizim imkoniyatlarini tushuntirish.
4. Uzunlik: Qisqa, aniq va foydali javoblar bering (2-4 jumla yetarli).

## BILIM BAZASI (Platforma haqida bilishingiz kerak bo'lgan ma'lumotlar)

### Fuqarolar imkoniyatlari
- Fuqarolar "Murojaatlar" sahifasidagi "Yangi murojaat" tugmasi orqali o'z mahallalariga elektron ariza yuborishlari mumkin.
- Ariza yuborish uchun: mavzu va batafsil matn kiritiladi, qolgan ma'lumotlar (ism, mahalla) avtomatik to'ldiriladi.
- Har bir fuqaro faqat o'z arizalarini ko'radi va ularning holatini kuzatib boradi.

### Ariza jarayoni
1. Fuqaro ariza yuboradi → status "YANGI"
2. Mahalla Admini (Rais yoki Kotib) arizani ko'radi, mas'ul shaxs tayinlaydi va statusni o'zgartiradi
3. Statuslar: YANGI → JARAYONDA → BAJARILDI yoki RAD_ETILDI
4. Har bir ariza uchun mas'ul shaxs belgilanadi

### Shaffoflik
- Tuman Hokimiyati barcha mahallalardagi barcha arizalarni va ularga kim mas'ul etib tayinlanganini nazorat qilib boradi.
- Hokimiyat faqat kuzatadi (read-only), statusni faqat mahalla admini o'zgartira oladi.

### Boshqa bo'limlar
- Tokenlar: Mahalla faolligi uchun mukofot tizimi
- KPI: Mahallalar reytingi va samaradorlik ko'rsatkichlari
- Aholi: Fuqarolar ro'yxati va ular haqida ma'lumot
- Xodimlar: Mahalla xodimlari (rais, kotib va boshqalar)

## JAVOB NAMUNALARI
Agar fuqaro "Qanday ariza topshiraman?" desa:
"Assalomu alaykum! Ariza topshirish uchun 'Murojaatlar' sahifasiga o'ting va u yerdagi 'Yangi murojaat' tugmasini bosing. Mavzu va batafsil matnni yozib jo'nating. Arizangizni mahalla raisi ko'rib, mas'ul shaxs biriktiradi va holatini yangilaydi."

Agar "Arizam qanday holatda?" desa:
"Arizalaringiz holatini 'Murojaatlar' sahifasida ko'rishingiz mumkin. U yerda har bir arizangizning statusi (Yangi, Jarayonda, Bajarilgan yoki Rad etilgan) ko'rsatilgan."

Agar "Tokenlar nima?" desa:
"Tokenlar — mahalla faolligi uchun mukofot. Token balansingizni 'Tokenlar' sahifasida tekshirishingiz mumkin."

ESLATMA: Agar savol platformaga aloqador bo'lmasa, muloyimlik bilan faqat SmartMahalla platformasi bo'yicha yordam bera olishingizni ayting.
""".strip()


# ═════════════════════════════════════════════════════════════════════
# FREEBUF AI — CHAT FUNCTIONS
# ═════════════════════════════════════════════════════════════════════

def generate_with_ollama(message: str, history: list | None = None) -> str:
    """Generate a reply using the local Ollama LLM with Freebuf persona."""
    model = os.environ.get("OLLAMA_MODEL", "llama3.2")
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Append conversation history (last 6 messages for context)
    if history and isinstance(history, list):
        for msg in history[-6:]:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": message})

    client = ollama.Client(host=host)
    response = client.chat(
        model=model,
        messages=messages,
        options={"num_predict": 512, "temperature": 0.7},
    )
    return response["message"]["content"].strip()


def generate_mock(message: str) -> str:
    """Fallback keyword-based mock when Ollama is unavailable.
    Always responds in Freebuf persona — polite, Uzbek, platform guide."""
    msg = message.lower()

    # ── Greetings ───────────────────────────────────────────────
    if any(w in msg for w in ("salom", "assalomu", "hello", "hayr")):
        return (
            "Assalomu alaykum! Freebuf AI — SmartMahalla platformasining "
            "aqlli yo'lko'rsatuvchisiman. Sizga qanday yordam bera olaman? "
            "Murojaatlar, tokenlar, KPI yoki boshqa bo'limlar haqida ma'lumot berishim mumkin."
        )

    # ── How to submit an application ────────────────────────────
    if any(w in msg for w in ("qanday ariza", "ariza topshir", "yangi murojaat", "qayerga murojaat", "shikoyat qil")):
        return (
            "Assalomu alaykum! Ariza topshirish juda oson. Dashboarddagi "
            "'Murojaatlar' sahifasiga o'ting va u yerdagi 'Yangi murojaat' "
            "tugmasini bosing. Mavzu va batafsil matnni yozib jo'nating. "
            "Arizangizni mahalla raisi ko'rib, mas'ul shaxs biriktiradi "
            "va holatini yangilaydi."
        )

    # ── Application status ──────────────────────────────────────
    if any(w in msg for w in ("ariza holat", "murojaat holat", "qayerda", "ko'rib chiqil", "arizamni", "arizam qan", "murojaatim")):
        return (
            "Arizalaringiz holatini 'Murojaatlar' sahifasida ko'rishingiz mumkin. "
            "U yerda har bir arizangizning statusi (Yangi, Jarayonda, "
            "Bajarilgan yoki Rad etilgan) va mas'ul shaxs haqida ma'lumot "
            "ko'rsatilgan. Agar arizangiz uzoq vaqt 'Yangi' holatida qolsa, "
            "mahalla raisiga murojaat qilishingiz mumkin."
        )

    # ── Tokens ──────────────────────────────────────────────────
    if "token" in msg:
        return (
            "Token tizimi — mahalla faolligi uchun mukofot. "
            "'Tokenlar' sahifasida balansingizni ko'rishingiz mumkin. "
            "Tokenlar faol fuqarolarga mahalla hayotida ishtirok etganliklari "
            "uchun beriladi."
        )

    # ── KPI / Rating ────────────────────────────────────────────
    if any(w in msg for w in ("kpi", "reyting", "baho", "samarador", "reyt")):
        return (
            "Mahallalar KPI reytingi 'KPI' sahifasida joylashgan. "
            "U yerda har bir mahallaning samaradorlik ko'rsatkichlari, "
            "murojaatlarni qayta ishlash tezligi va boshqa statistikalar "
            "bilan tanishishingiz mumkin."
        )

    # ── Citizens / Aholi ────────────────────────────────────────
    if any(w in msg for w in ("aholi", "fuqaro", "ro'yxat", "odam")):
        return (
            "Aholi ro'yxati 'Aholi' sahifasida joylashgan. "
            "U yerda fuqarolarni qidirish, filtrlash va ular haqida "
            "batafsil ma'lumot olish mumkin. PINFL, yosh, xonadon, "
            "mahalla va holat bo'yicha ma'lumotlar mavjud."
        )

    # ── Mahalla admin / staff ───────────────────────────────────
    if any(w in msg for w in ("rais", "kotib", "admin", "xodim", "hodim", "mahalla bosh")):
        return (
            "Mahalla xodimlari 'Xodimlar' sahifasida. Rais va kotib "
            "murojaatlarni qabul qiladi, mas'ul shaxslarni tayinlaydi "
            "va statuslarni yangilaydi. Hokimiyat esa barcha jarayonni "
            "nazorat qiladi."
        )

    # ── Hokimiyat / Transparency ────────────────────────────────
    if any(w in msg for w in ("hokimiyat", "hokim", "tuman", "shaffof", "kim mas'ul")):
        return (
            "Tuman Hokimiyati barcha mahallalardagi arizalarni va "
            "ularga kim mas'ul etib tayinlanganini nazorat qilib boradi. "
            "Bu tizim shaffoflikni ta'minlaydi — har bir ariza kim tomonidan "
            "va qanday holatda ekanligi aniq ko'rinadi."
        )

    # ── Thanks ──────────────────────────────────────────────────
    if any(w in msg for w in ("rahmat", "tashakkur", "yaxshi")):
        return (
            "Arzimaydi! SmartMahalla platformasidan foydalanishda "
            "yana savollaringiz bo'lsa, bemalol murojaat qiling. "
            "Yaxshi kun tilaymiz!"
        )

    # ── Fallback ────────────────────────────────────────────────
    responses = [
        "Men Freebuf AI — SmartMahalla platformasining yo'lko'rsatuvchisiman. "
        "Quyidagi mavzularda yordam bera olaman: murojaatlar (ariza topshirish), "
        "tokenlar, KPI reytingi, aholi ro'yxati va xodimlar. Qaysi bo'lim "
        "haqida ma'lumot kerak?",
        "Kechirasiz, savolingizni to'liq tushunmadim. SmartMahalla platformasi "
        "bo'yicha quyidagilardan birini so'rashingiz mumkin: "
        "murojaat topshirish, tokenlar, KPI, aholi ro'yxati yoki xodimlar. "
        "Iltimos, aniqroq yozing.",
        "Freebuf AI yordamchisi sifatida men SmartMahalla platformasidagi "
        "barcha bo'limlar bo'yicha ma'lumot bera olaman. Masalan: "
        "'Qanday ariza topshiraman?' yoki 'Tokenlar haqida ma'lumot bering'.",
    ]
    return random.choice(responses)


# ═════════════════════════════════════════════════════════════════════
# APPLICATION CLASSIFICATION (arizalarni qayta ishlash)
# ═════════════════════════════════════════════════════════════════════
# Separate from chat — used by POST /api/v1/applications for background
# AI classification (category, summary, priority, suggested department).
# ═════════════════════════════════════════════════════════════════════

CLASSIFY_SYSTEM_PROMPT = (
    "Sen SmartMahalla platformasi uchun arizalarni tahlil qiluvchi AI asistansan. "
    "Berilgan ariza sarlavhasi va tavsifi asosida quyidagi 4 ta maydonni aniqlang. "
    "FAQAT JSON formatida javob qaytar, boshqa hech qanday izoh yoki matn qo'shma."
)

CLASSIFY_CATEGORIES = (
    "Kommunal xizmatlar",
    "Yo'l-transport",
    "Ijtimoiy yordam",
    "Huquqiy masala",
    "Obodonlashtirish",
    "Sog'liqni saqlash",
    "Ta'lim",
    "Bandlik va ish o'rinlari",
    "Xavfsizlik va favqulodda",
    "Madaniyat va sport",
    "Boshqa",
)

CATEGORIES_TEXT = ", ".join(CLASSIFY_CATEGORIES)

CLASSIFY_OUTPUT_EXAMPLE = (
    '{"category": "Kommunal xizmatlar", '
    '"summary": "Suv quvuri yorilgan", '
    '"priority": "Yuqori", '
    '"suggestedDepartment": "Kommunal xizmatlar bo\'limi"}'
)


def classify_application(title: str, description: str) -> dict:
    """
    AI yordamida arizani tahlil qilish.

    Args:
        title: Ariza sarlavhasi
        description: Ariza tavsifi

    Returns:
        dict with keys: category, summary, priority, suggestedDepartment
    """
    user_content = (
        f"Ariza sarlavhasi: {title}\n"
        f"Ariza tavsifi: {description}\n\n"
        f"Quyidagi kategoriyalardan birini tanlang: {CATEGORIES_TEXT}\n\n"
        f"1. category — eng mos kategoriya\n"
        f"2. summary — 1-2 gapda qisqacha mazmun (o'zbek tilida)\n"
        f"3. priority — 'Yuqori', 'O'rta' yoki 'Past' (shoshilinchligiga qarab)\n"
        f"4. suggestedDepartment — mas'ul bo'lim nomi (tavsiya)\n\n"
        f"JSON formatida javob bering, masalan:\n{CLASSIFY_OUTPUT_EXAMPLE}"
    )

    if OLLAMA_AVAILABLE:
        try:
            model = os.environ.get("OLLAMA_MODEL", "llama3.2")
            host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

            messages = [
                {"role": "system", "content": CLASSIFY_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ]

            client = ollama.Client(host=host)
            response = client.chat(
                model=model,
                messages=messages,
                options={"num_predict": 256, "temperature": 0.1},
            )
            raw = response["message"]["content"].strip()

            # Try to extract JSON from the response (handle markdown code blocks)
            if "```" in raw:
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)

            return {
                "category": result.get("category", ""),
                "summary": result.get("summary", ""),
                "priority": result.get("priority", ""),
                "suggestedDepartment": result.get("suggestedDepartment", ""),
            }
        except Exception:
            pass  # Fall through to mock

    # ── Mock classification fallback ────────────────────────────
    msg = (title + " " + description).lower()

    if any(w in msg for w in ("suv", "gaz", "chiroq", "quvur", "yoril", "elektr", "yorug'", "issiqlik", "kanalizatsiya")):
        return {
            "category": "Kommunal xizmatlar",
            "summary": title[:80],
            "priority": "Yuqori" if any(w in msg for w in ("yoril", "hidi", "toshqin", "portla")) else "O'rta",
            "suggestedDepartment": "Kommunal xizmatlar bo'limi",
        }
    if any(w in msg for w in ("yo'l", "ko'cha", "transport", "mashina", "yo'lka", "avtobus", "piyoda", "ko'prik")):
        return {
            "category": "Yo'l-transport",
            "summary": title[:80],
            "priority": "O'rta",
            "suggestedDepartment": "Yo'l transport bo'limi",
        }
    if any(w in msg for w in ("ijtimoiy", "yordam", "nafaqa", "pensiya", "moddiy", "subsidiya", "imtiyoz")):
        return {
            "category": "Ijtimoiy yordam",
            "summary": title[:80],
            "priority": "Yuqori" if any(w in msg for w in ("shoshil", "kechiktir", "muhim")) else "O'rta",
            "suggestedDepartment": "Ijtimoiy himoya bo'limi",
        }
    if any(w in msg for w in ("huquq", "sud", "advokat", "shartnoma", "meros", "ajral", "da'vo")):
        return {
            "category": "Huquqiy masala",
            "summary": title[:80],
            "priority": "O'rta",
            "suggestedDepartment": "Yuridik bo'lim",
        }
    if any(w in msg for w in ("axlat", "toza", "bog'", "daraxt", "hashar", "ko'kalamzor", "park", "skameyka")):
        return {
            "category": "Obodonlashtirish",
            "summary": title[:80],
            "priority": "O'rta",
            "suggestedDepartment": "Obodonlashtirish bo'limi",
        }
    if any(w in msg for w in ("shifoxona", "vrach", "doktor", "kasal", "dorixona", "sog'liq", "emlash")):
        return {
            "category": "Sog'liqni saqlash",
            "summary": title[:80],
            "priority": "Yuqori" if any(w in msg for w in ("shoshil", "tez", "og'ir")) else "O'rta",
            "suggestedDepartment": "Sog'liqni saqlash bo'limi",
        }
    if any(w in msg for w in ("maktab", "ta'lim", "o'qituvchi", "dars", "o'quvchi", "universitet", "kollej")):
        return {
            "category": "Ta'lim",
            "summary": title[:80],
            "priority": "O'rta",
            "suggestedDepartment": "Xalq ta'limi bo'limi",
        }
    if any(w in msg for w in ("ish", "bandlik", "kasb", "o'rin", "vakansiya", "ishsiz")):
        return {
            "category": "Bandlik va ish o'rinlari",
            "summary": title[:80],
            "priority": "Yuqori",
            "suggestedDepartment": "Bandlik markazi",
        }
    if any(w in msg for w in ("xavfsiz", "favqulodda", "yong'in", "tez yordam", "ichki ishlar", "militsiya", "politsiya")):
        return {
            "category": "Xavfsizlik va favqulodda",
            "summary": title[:80],
            "priority": "Yuqori",
            "suggestedDepartment": "Favqulodda vaziyatlar bo'limi",
        }
    if any(w in msg for w in ("madaniyat", "sport", "musiqa", "san'at", "festival", "to'garak")):
        return {
            "category": "Madaniyat va sport",
            "summary": title[:80],
            "priority": "Past",
            "suggestedDepartment": "Madaniyat va sport bo'limi",
        }

    return {
        "category": "Boshqa",
        "summary": title[:80],
        "priority": "Past",
        "suggestedDepartment": "Mahalla raisi",
    }


# ═════════════════════════════════════════════════════════════════════
# MAIN — stdin/stdout JSON protocol
# ═════════════════════════════════════════════════════════════════════

def main():
    """Read JSON from stdin, process based on action type, print JSON to stdout."""
    try:
        raw = sys.stdin.read()
    except Exception:
        raw = ""

    if not raw or not raw.strip():
        result = {
            "reply": (
                "Assalomu alaykum! Freebuf AI — SmartMahalla platformasining "
                "aqlli yo'lko'rsatuvchisiman. Sizga qanday yordam bera olaman?"
            )
        }
        print(json.dumps(result, ensure_ascii=False))
        return

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        result = {"reply": "Xabar formatini tushunmadim. Iltimos, qayta urinib ko'ring."}
        print(json.dumps(result, ensure_ascii=False))
        return

    # ── Route based on action type ────────────────────────────────
    action = data.get("action", "chat")

    if action == "classify":
        title = data.get("title", "")
        description = data.get("description", "")
        classification = classify_application(title, description)
        print(json.dumps(classification, ensure_ascii=False))
        return

    # ── Default: chat action ──────────────────────────────────────
    message = data.get("message", "")
    history = data.get("history")

    if not message or not isinstance(message, str):
        result = {"reply": "Xabar matni topilmadi."}
        print(json.dumps(result, ensure_ascii=False))
        return

    # ── Try Ollama first, fall back to mock ────────────────────
    if OLLAMA_AVAILABLE:
        try:
            reply = generate_with_ollama(message, history)
            result = {"reply": reply}
            print(json.dumps(result, ensure_ascii=False))
            return
        except Exception as e:
            err_msg = str(e).lower()
            note = ""
            if "connection refused" in err_msg or "connect" in err_msg:
                note = (
                    "\n\n[Ollama server ishga tushmagan. "
                    "Ishga tushirish uchun 'ollama serve' ni bajaring.]"
                )
            elif "not found" in err_msg or "pull" in err_msg:
                note = (
                    f"\n\n[Model topilmadi. Yuklab olish uchun "
                    f"'ollama pull {os.environ.get('OLLAMA_MODEL', 'llama3.2')}' ni bajaring.]"
                )
            else:
                note = f"\n\n[Ollama xatosi: {str(e)}]"

            reply = generate_mock(message) + note
            result = {"reply": reply}
            print(json.dumps(result, ensure_ascii=False))
            return

    # ── Mock fallback (ollama package not installed) ────────────
    reply = generate_mock(message)
    if not OLLAMA_AVAILABLE:
        reply += (
            "\n\n[Ollama kutubxonasi o'rnatilmagan. "
            "O'rnatish uchun 'pip install ollama' ni bajaring.]"
        )
    result = {"reply": reply}
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
