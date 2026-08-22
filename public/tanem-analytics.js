(() => {
  const script = document.currentScript;
  const endpoint = script?.dataset?.endpoint;
  const siteId = script?.dataset?.site;
  if (!endpoint || !siteId) return;

  const params = new URLSearchParams(location.search);
  const utmSource = params.get("utm_source") || "";
  const utmMedium = params.get("utm_medium") || "";
  const utmCampaign = params.get("utm_campaign") || "";

  function getSessionId() {
    const key = "tanem_session_id";
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, value);
    }
    return value;
  }

  function inferSource() {
    if (utmSource) return utmSource.toLowerCase().slice(0, 64);
    if (!document.referrer) return "direct";
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host.includes("yandex")) return "yandex";
      if (host.includes("google")) return "google";
      if (host === "t.me" || host.includes("telegram")) return "telegram";
      if (host.includes("instagram")) return "instagram";
      if (host === "vk.com" || host.endsWith(".vk.com")) return "vk";
      if (host.includes("2gis")) return "2gis";
      if (host.includes("profi")) return "profi";
      if (host.includes("avito")) return "avito";
      return "other";
    } catch {
      return "other";
    }
  }

  const source = inferSource();
  const sessionId = getSessionId();

  function send(eventType, target = "") {
    const body = JSON.stringify({
      site_id: siteId,
      event_type: eventType,
      path: `${location.pathname}${location.search}`,
      referrer: document.referrer,
      source,
      medium: utmMedium,
      campaign: utmCampaign,
      session_id: sessionId,
      target: String(target || "").slice(0, 300)
    });

    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon && navigator.sendBeacon(`${endpoint}?site=${encodeURIComponent(siteId)}`, blob)) return;
    } catch {}

    fetch(`${endpoint}?site=${encodeURIComponent(siteId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit"
    }).catch(() => {});
  }

  function classify(element) {
    const explicit = element.dataset?.tanemEvent;
    if (explicit) return explicit;

    const href = String(element.getAttribute?.("href") || "").toLowerCase();
    const text = String(element.textContent || "").trim().toLowerCase();
    const classes = String(element.className || "").toLowerCase();
    const id = String(element.id || "").toLowerCase();

    if (href.startsWith("tel:")) return "phone_click";
    if (href.includes("wa.me") || href.includes("whatsapp.com")) return "whatsapp_click";
    if (href.includes("t.me/") || href.startsWith("tg:")) return "telegram_click";
    if (href.includes("yandex.ru/maps") || href.includes("yandex.com/maps") || href.includes("2gis")) return "map_click";
    if (
      href.includes("yclients") || href.includes("dikidi") ||
      classes.includes("ms_booking") || classes.includes("booking") ||
      id.includes("booking") || /запис(аться|ь|ься)?/.test(text)
    ) return "booking_click";
    if (href.startsWith("http://") || href.startsWith("https://")) return "external_click";
    return "";
  }

  send("page_view");

  document.addEventListener("click", (event) => {
    const element = event.target?.closest?.("a,button,[data-tanem-event]");
    if (!element) return;
    const type = classify(element);
    if (!type) return;
    send(type, element.getAttribute?.("href") || element.textContent || "");
  }, true);
})();
