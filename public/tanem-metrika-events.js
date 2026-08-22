(() => {
  const COUNTER_ID = 111558185;

  function reach(goal) {
    try {
      if (typeof window.ym === "function") {
        window.ym(COUNTER_ID, "reachGoal", goal);
      }
    } catch (_) {}
  }

  function classify(element) {
    const href = String(element.getAttribute?.("href") || "").toLowerCase();
    const text = String(element.textContent || "").trim().toLowerCase();
    const classes = String(element.className || "").toLowerCase();
    const id = String(element.id || "").toLowerCase();

    if (href.startsWith("tel:")) return "tanem_phone";
    if (href.includes("wa.me") || href.includes("whatsapp.com")) return "tanem_whatsapp";
    if (href.includes("t.me/") || href.startsWith("tg:")) return "tanem_telegram";
    if (href.includes("yandex.ru/maps") || href.includes("yandex.com/maps") || href.includes("2gis")) return "tanem_map";
    if (
      href.includes("yclients") || href.includes("dikidi") ||
      classes.includes("ms_booking") || classes.includes("booking") ||
      id.includes("booking") || /запис(аться|ь|ься)?/.test(text)
    ) return "tanem_booking";

    return "";
  }

  document.addEventListener("click", (event) => {
    const element = event.target?.closest?.("a,button,[data-tanem-goal]");
    if (!element) return;

    const explicit = element.dataset?.tanemGoal;
    const goal = explicit || classify(element);
    if (goal) reach(goal);
  }, true);
})();
