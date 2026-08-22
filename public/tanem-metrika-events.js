(() => {
  const COUNTER_ID = 111558185;

  function reach(goal) {
    try {
      if (typeof window.ym === "function") {
        window.ym(COUNTER_ID, "reachGoal", goal);
      }
    } catch (_) {}
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
      href.includes("yandex.ru/maps") ||
      href.includes("yandex.com/maps") ||
      href.includes("2gis")
    ) return "tanem_yandex_card";

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
})();
