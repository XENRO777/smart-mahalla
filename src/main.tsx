import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ─── Global error handler – prevents silent white screen ───────
window.onerror = (message, source, line, col, error) => {
  console.error("🚨 [Global onerror]", { message, source, line, col, error });
  // Show a visible fallback in the DOM so the user knows something broke
  const root = document.getElementById("root");
  if (root && !root.querySelector("[data-error-fallback]")) {
    const div = document.createElement("div");
    div.setAttribute("data-error-fallback", "true");
    div.style.cssText =
      "display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;background:#09090b;color:#e4e4e7;font-family:system-ui,sans-serif;";
    div.innerHTML = `
      <div style="max-width:480px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
        <h1 style="font-size:1.25rem;font-weight:600;margin-bottom:0.5rem;">
          Ma'lumotlarni yuklashda xatolik yuz berdi
        </h1>
        <p style="font-size:0.875rem;color:#a1a1aa;margin-bottom:1.5rem;">
          Ilovani ishga tushirishda kutilmagan xatolik yuz berdi.
          Iltimos, sahifani yangilang yoki keyinroq qayta urinib ko'ring.
        </p>
        <button onclick="location.reload()" style="
          padding:0.5rem 1.5rem;border-radius:0.5rem;border:1px solid #27272a;
          background:#18181b;color:#e4e4e7;cursor:pointer;font-size:0.875rem;
        ">Sahifani yangilash</button>
        <details style="margin-top:1.5rem;text-align:left;">
          <summary style="cursor:pointer;font-size:0.75rem;color:#71717a;">
            Texnik ma'lumot
          </summary>
          <pre style="margin-top:0.5rem;padding:0.75rem;background:#18181b;border-radius:0.5rem;font-size:0.75rem;overflow-x:auto;color:#a1a1aa;">
${error?.stack ?? message?.toString() ?? "Noma'lum xatolik"}
          </pre>
        </details>
      </div>
    `;
    root.innerHTML = "";
    root.appendChild(div);
  }
  return true;
};

// Unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("🚨 [Unhandled Promise Rejection]", event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
