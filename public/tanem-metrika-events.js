(() => {
  const COUNTER_ID = 111558185;
  const DEBUG = new URLSearchParams(window.location.search).get("tanem_debug") === "1";
  let heartbeatCallback = false;

  function reach(goal, callback) {
    try {
      if (typeof window.ym === "function") {
        if (callback) window.ym(COUNTER_ID, "reachGoal", goal, {}, callback);
        else window.ym(COUNTER_ID, "reachGoal", goal);
      }
    } catch (_) {}
  }

  function metrikaScriptState() {
    const script = [...document.scripts].find((item) =>
      String(item.src || "").includes("mc.yandex.ru/metrika/tag.js")
    );
    if (!script) return "не найден";

    const resource = performance.getEntriesByType("resource").find((entry) =>
      String(entry.name || "").includes("mc.yandex.ru/metrika/tag.js")
    );
    if (resource) return "загружен";
    return "ожидание / возможно заблокирован";
  }

  function showDebug() {
    if (!DEBUG) return;

    let panel = document.getElementById("tanem-analytics-debug");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "tanem-analytics-debug";
      panel.style.cssText = [
        "position:fixed",
        "left:12px",
        "right:12px",
        "bottom:12px",
        "z-index:2147483647",
        "padding:14px 16px",
        "border-radius:14px",
        "background:#111",
        "color:#fff",
        "font:13px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
        "box-shadow:0 10px 30px rgba(0,0,0,.28)",
        "white-space:pre-line"
      ].join(";");
      document.body.appendChild(panel);
    }

    panel.textContent = [
      "TANEM Analytics · DEBUG",
      "tracker: ЗАГРУЖЕН",
      `ym: ${typeof window.ym === "function" ? "есть" : "НЕТ"}`,
      `Metrika tag.js: ${metrikaScriptState()}`,
      `heartbeat callback: ${heartbeatCallback ? "ДА" : "нет"}`,
      `host: ${window.location.host}`
    ].join("\n");
  }

  function normalizedHref(element) {
    return String(element?.getAttribute?.("href") || element?.dataset?.url || "").trim();
  }

  function classify(element) {
    const rawHref = normalizedHref(element);
    const href = rawHref.toLowerCase();
    const text = String(element?.textContent || "").trim().toLowerCase();
    const classes = String(element?.className || "").toLowerCase();
    const id = String(element?.id || "").toLowerCase();

    if (href.startsWith("tel:")) return "tanem_phone";
    if (href.startsWith("mailto:")) return "tanem_email";
    if (href.includes("wa.me") || href.includes("whatsapp.com")) return "tanem_whatsapp";
    if (href.includes("t.me/") || href.startsWith("tg:")) return "tanem_telegram";

    if (
      href.includes("yclients") || href.includes("dikidi") ||
      classes.includes("ms_booking") || classes.includes("booking") ||
      id.includes("booking") || /запис(аться|ь|ься)?/.test(text)
    ) return "tanem_booking";

    if (
      (href.includes("yandex.ru/maps") || href.includes("yandex.com/maps") || href.includes("2gis")) &&
      (href.includes("/reviews") || href.includes("tab=reviews"))
    ) return "tanem_reviews";

    if (href.includes("mode=routes") || href.includes("/route") || href.includes("rtext=")) {
      return "tanem_route";
    }

    if (href.includes("yandex.ru/maps") || href.includes("yandex.com/maps") || href.includes("2gis")) {
      return "tanem_map";
    }

    if (href.startsWith("#")) return "tanem_internal";

    if (rawHref) {
      try {
        const url = new URL(rawHref, window.location.href);
        if (url.origin === window.location.origin) return "tanem_internal";
        return "tanem_external";
      } catch (_) {
        return "tanem_external";
      }
    }

    return "";
  }

  function resolveClickable(target) {
    if (!(target instanceof Element)) return null;

    const direct = target.closest("a[href],[data-tanem-goal],[data-url]");
    if (direct) return direct;

    const serviceTitle = target.closest(".mct-service-name strong");
    if (serviceTitle) {
      return serviceTitle.closest(".mct-service-row")?.querySelector(".mct-service-action a[href]") || null;
    }

    return null;
  }

  document.addEventListener("click", (event) => {
    const element = resolveClickable(event.target);
    if (!element) return;

    const explicit = element.dataset?.tanemGoal;
    const goal = explicit || classify(element);
    if (goal) reach(goal);
  }, true);

  reach("tanem_tracker_loaded", () => {
    heartbeatCallback = true;
    showDebug();
  });

  if (DEBUG) {
    const start = () => {
      showDebug();
      let checks = 0;
      const timer = window.setInterval(() => {
        showDebug();
        checks += 1;
        if (checks >= 20 || heartbeatCallback) window.clearInterval(timer);
      }, 500);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
})();
